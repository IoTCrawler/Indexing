// Controller to handle search queries from applications / orchestrator
import * as express from 'express';
import { OK, INTERNAL_SERVER_ERROR, REQUEST_TIMEOUT, BAD_REQUEST } from 'http-status-codes';
import { Controller } from '../util/Controller';
import { env } from '../util/validateEnv';
import Axios from 'axios';
import { IotStreamType, SensorType, QualityType, PointType, relativeLocationPropName, locationPropName, observesPropName, generatedByPropName, hasQualityPropName } from '../util/iotObjects/ontology';
import { Entity } from '../util/clients/ngsiObjects/ngsiEntity';
import { NgsiQueryParams } from '../util/clients/ngsiObjects/ngsiQueryParams';
import { NgsiQuery } from '../util/ngsi/ngsiQuery';
import { IndexingContext, IotcContext } from '../util/ngsi/ngsiContext';
import { NgsiError } from '../util/ngsi/ngsiError';
import { NgsiGeoQuery } from '../util/ngsi/ngsiGeoQuery';
import { StreamMapping } from '../models/streamMapping';
import { QoiMapping } from '../models/qoiMapping';
import { IndexedIotStream } from '../models/indexedIotStream';
import { PointMapping } from '../models/pointMapping';

export class QueryController implements Controller {
    private static readonly supportedTypes: string[] = [
        IotStreamType,
        SensorType,
        QualityType,
        PointType
    ];
    private static readonly supportedAttrs: string[] = [
        'id', 'type', 'location',
        relativeLocationPropName,
        locationPropName,
        observesPropName,
        generatedByPropName,
        hasQualityPropName
    ];

    private static readonly dotEncodeRegExp: RegExp = new RegExp('\\.', 'g');
    private static readonly dotDecodeRegExp: RegExp = new RegExp('%2E', 'g');

    public readonly path = '/';
    public readonly router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    private intializeRoutes(): void {
        this.router.get('/entities', this.handleSearchRequest.bind(this));
        this.router.get('/entities/:entityId', this.proxyRequest.bind(this));
    }

    public async handleSearchRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const query = req.query as NgsiQueryParams;
        const context = IotcContext; // TODO get context from Link header

        try {
            
            // Query must contain type and no context course filter must be present
            if (query.csf || !query.type
                || (query.geoproperty && query.geoproperty !== 'location')
                || (query.q && query.q.includes('~='))) {
                throw 'Query not supported';
            }

            // if (query.csf || !query.type
            //     || (query.geoproperty && query.geoproperty !== 'location')
            //     || (query.q && query.q.includes('~='))) {
            //     console.info(`Forwarding query to MDR at ${env.BROKER_HOST}: No location attribute found in query`);
            //     await this.proxyRequest(req, res);
            //     return;
            // }

            // If none of the geo-query parameters are present, forward to broker
            if (!(query.georel || query.geometry || query.coordinates)) {
                console.info(`Forwarding query to MDR at ${env.BROKER_HOST}: No location attribute found in query`);
                await this.proxyRequest(req, res);
                return;
            }

            // If any of geo-query parameters are present, all must be present
            if ((query.georel || query.geometry || query.coordinates) && !(query.georel && query.geometry && query.coordinates)) {
                res.status(BAD_REQUEST).json({
                    type: 'https://uri.etsi.org/ngsi-ld/errors/BadRequestData',
                    title: 'Invalid Geo-query',
                    detail: 'Geo-query requires  georel, geomerty and coordinates to be specified'
                });
                return;
            }

            // Indexing only supports querying for 4 indexed types
            const types = query.type.split(',').map(t => Object.keys(context.expand({ [t]: '' }))[0]);
            if (!types.every(t => QueryController.supportedTypes.find(st => t === st))) { throw 'Type not supported'; }

            // Only a subset of attributes is indexed
            let attrs = query.attrs ? query.attrs.split(',').map(attr => Object.keys(context.expand({ [attr]: '' }))[0]) : undefined;
            if (attrs) {
                if (!attrs.every(a => QueryController.supportedAttrs.find(sa => a === sa))) { throw 'Attr not supported'; }
                attrs = attrs.map(attr => Object.keys(IndexingContext.compact({ [attr]: '' }))[0].replace(QueryController.dotEncodeRegExp, '%2E'));
            }

            // Parse Ids
            let idQuery: unknown;
            if (query.id) {
                const ids = query.id.split(',');
                idQuery = { $in: ids }
            }

            // Parse idPattern RegExp
            try {
                if (query.idPattern) {
                    const idPattern = new RegExp(`${query.idPattern}`);

                    if (!idQuery) {
                        idQuery = { $regex: query.idPattern }
                    } else {
                        const ids = (idQuery as { $in: string[] }).$in.filter(id => idPattern.test(id));
                        if (ids.length === 0) {
                            console.warn('Both id and idPattern were defined, which resulted in conflicting query');
                            res.status(OK).json([]);
                            return;
                        } else {
                            (idQuery as { $in: string[] }).$in = ids;
                        }
                    }
                }
            } catch (e) {
                res.status(BAD_REQUEST).json({
                    type: 'https://uri.etsi.org/ngsi-ld/errors/BadRequestData',
                    title: 'Invalid idPattern',
                    detail: e.message
                });
                return;
            }

            // Parse NGSI-LD query
            let q: NgsiQuery | undefined;
            try {
                if (query.q) {
                    q = new NgsiQuery(query.q, context);
                }
            } catch (e) {
                if (e instanceof NgsiError) {
                    res.status(e.status).json(e);
                } else {
                    res.status(BAD_REQUEST).json({
                        type: 'https://uri.etsi.org/ngsi-ld/errors/BadRequestData',
                        title: 'Invalid query',
                        detail: e.message
                    });
                }
                return;
            }

            let geoQ: NgsiGeoQuery | undefined;
            try {
                if (query.georel) {
                    geoQ = new NgsiGeoQuery(query.geoproperty || 'location', query.georel, query.geometry!, query.coordinates!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                }
            } catch (e) {
                res.status(BAD_REQUEST).json({
                    type: 'https://uri.etsi.org/ngsi-ld/errors/BadRequestData',
                    title: 'Invalid geo-query',
                    detail: e.message
                });
            }

            // Get indexed entities for each type separately
            const resultByType = await Promise.all(types.map(async type => {
                const combinedQuery = {
                    $and: [] as unknown[]
                };

                let shardQuery: unknown;

                if (idQuery) {
                    const mappingIdQuery = { _id: idQuery };
                    let typedIdQuery: unknown;
                    let countries: string[] | undefined;
                    switch (type) {
                        case IotStreamType:
                            countries = (await StreamMapping.Model.find(mappingIdQuery, { _id: 0, countryISO: 1 }).exec()).map(c => c.countryISO);
                            typedIdQuery = { _id: idQuery };
                            break;
                        case SensorType:
                            typedIdQuery = { 'generatedBy._id': idQuery };
                            break;
                        case QualityType:
                            countries = (await QoiMapping.Model.find(mappingIdQuery, { _id: 0, countryISO: 1 }).exec()).map(c => c.countryISO);
                            typedIdQuery = { 'hasQuality._id': idQuery };
                            break;
                        case PointType:
                            countries = (await PointMapping.Model.find(mappingIdQuery, { _id: 0, countryISO: 1 }).exec()).map(c => c.countryISO);
                            typedIdQuery = { 'generatedBy.metaLocation._id': idQuery };
                            break;
                        default:
                            throw 'Type not supported';
                    }

                    if (countries) {
                        shardQuery = {
                            countryISO: { $in: countries.concat('00') },
                            geoPartitionKey: '00'
                        }
                    }

                    combinedQuery.$and.push(typedIdQuery);
                } else if (q) {
                    // generate shard query from relationship id queries
                    shardQuery = q.getShardQuery();
                }

                // Only Sensor entities contain location property
                if (geoQ) {
                    if (type !== SensorType) { return []; }

                    if (!shardQuery) {
                        shardQuery = await geoQ.getShardQuery();
                    }

                    if (!geoQ.nearQuery) {
                        combinedQuery.$and.unshift(geoQ.query);
                    }
                }

                // All queries must contain shard key
                if (!shardQuery) {
                    throw 'Query did not result in shard key'
                }
                combinedQuery.$and.unshift(shardQuery);

                // Define root document and projection operator
                let root: string | undefined;
                let projection: unknown;
                switch (type) {
                    case IotStreamType:
                        projection = {
                            _id: 0,
                            id: 1,
                            type: 1,
                            generatedBy: {
                                type: 'Relationship',
                                object: '$generatedBy._id'
                            },
                            hasQuality: {
                                $cond: {
                                    if: '$hasQuality._id', then: {
                                        type: 'Relationship',
                                        object: '$hasQuality._id'
                                    }, else: '$$REMOVE'
                                }
                            }
                        };
                        break;
                    case SensorType:
                        root = 'generatedBy';
                        projection = {
                            _id: 0,
                            id: 1,
                            type: 1,
                            location: {
                                type: 'GeoProperty',
                                value: '$location'
                            },
                            'geo:location': {
                                $cond: {
                                    if: '$metaLocation._id', then: {
                                        type: 'Relationship',
                                        object: '$metaLocation._id'
                                    }, else: '$$REMOVE'
                                }
                            },
                            observes: {
                                type: 'Relationship',
                                object: '$observes'
                            }
                        };
                        break;
                    case QualityType:
                        root = 'hasQuality';
                        projection = {
                            _id: 0
                        }
                        break;
                    case PointType:
                        projection = {
                            _id: 0,
                            id: 1,
                            type: 1,
                            relativeLocation: {
                                type: "Property",
                                value: '$relativeLocation'
                            }
                        }
                        root = 'generatedBy.metaLocation';
                        break;
                    default:
                        throw 'Type not supported';
                }

                // Construct the query to send to Mongo DB
                let queryPipeline: unknown[]

                // $near query cannot be used inside $match stage, need to use $geoNear stage instead
                if (geoQ && geoQ.nearQuery) {
                    let query: unknown = {};
                    for (const queryOp of combinedQuery.$and) {
                        query = { ...queryOp };
                    }
                    queryPipeline = [{ $geoNear: { ...geoQ.query, query: query } }];
                } else {
                    queryPipeline = [{ $match: combinedQuery }];
                }

                if (root) {
                    queryPipeline.push({ $replaceRoot: { newRoot: `$${root}` } });
                }

                if (q) {
                    queryPipeline.push({ $match: q.query });
                }

                queryPipeline.push(
                    {
                        $set: {
                            id: '$_id',
                            type: type
                        }
                    },
                    { $project: projection }
                );

                return (await IndexedIotStream.Model.aggregate(queryPipeline).exec() as Entity[]).map(entity => {
                    const result: { [key: string]: unknown } = {};
                    for (const key in entity) {
                        result[key.replace(QueryController.dotDecodeRegExp, '.')] = entity[key];
                    }
                    return IotcContext.expand(result) as Entity;
                });
            }));

            const result: Entity[] = [];
            for (const r of resultByType) {
                result.push(...r);
            }

            ////////// if no results returned, forward to broker

            // if (result === undefined || result.length == 0) {
            //     console.info(`Forwarding query to MDR at ${env.BROKER_HOST} : No results from Indexing`);
            //     await this.proxyRequest(req, res);
            //     return;
            // }
            ///////////

            res.status(OK).json(result);
            return;

        }
        catch (e) {
            if (e instanceof NgsiError) {
                res.status(e.status).json(e);
                return;
            }

            if (typeof e === 'string') {
                console.info(`Forwarding query to the Broker: ${e}`);
                await this.proxyRequest(req, res);
                return;
            }

            return next(e);
        }
    }

    public async proxyRequest(req: express.Request, res: express.Response): Promise<void> {
        try {
            const response = await Axios.get(`${env.BROKER_HOST}${req.originalUrl}`, {
                headers: req.headers
            });

            for (const header in response.headers) {
                if (header === 'transfer-encoding') { continue; }
                res.setHeader(header, response.headers[header]);
            }

            res.status(response.status).send(response.data);
        } catch (error) {
            if (error.response) {
                console.error(`Forwarding request to the broker returned an error: ${error.resonse.status}`);
                for (const header in error.response.headers) {
                    if (header === 'transfer-encoding') { continue; }
                    res.setHeader(header, error.response.headers[header]);
                }
                res.status(error.response.status).send(error.response.data);
            } else if (error.request) {
                console.error('Timeout: no response received from the broker');
                res.status(REQUEST_TIMEOUT).json({
                    type: 'https://uri.etsi.org/ngsi-ld/errors/InternalError',
                    title: 'Timeout',
                    detail: 'No response received from the broker'
                });
            } else {
                console.error('Failed to make request to the broker');
                res.status(INTERNAL_SERVER_ERROR).json({
                    type: 'https://uri.etsi.org/ngsi-ld/errors/InternalError',
                    title: 'Request failed',
                    detail: 'Failed to make request to the broker'
                });
            }
        }
    }
}

