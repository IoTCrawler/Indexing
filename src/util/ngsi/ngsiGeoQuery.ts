import { CountryGeometry } from "../../models/countryGeometry";

export class NgsiGeoQuery {
    private static readonly nearOpRegExp = new RegExp('^near;((max|min)Distance)==([0-9\\.]+)');
    public readonly nearQuery: boolean;
    public readonly query: unknown;
    private readonly shardQuery: unknown;

    constructor(_prop: string, rel: string, geometry: string, coordinates: string) {
        const indexedProp = 'generatedBy.location';
        const queryObject = {
            $geometry: {
                type: geometry,
                coordinates: JSON.parse(coordinates)
            }
        };

        let nearTokens: string[] | null;
        if ((nearTokens = NgsiGeoQuery.nearOpRegExp.exec(rel)) !== null) {
            const distanceProp = nearTokens[1];
            const distance = parseFloat(nearTokens[3]);

            if (distance == 0) {
                const msg = `Parsing Error: georel='${rel}' is not valid. Expected non-zero distance`;
                console.error(msg);
                throw new Error(msg);
            }

            if (geometry !== 'Point') {
                const msg = `Parsing Error: geometry='${rel}' is not valid. Only Point is supported for georel='near'`;
                console.error(msg);
                throw new Error(msg);
            }

            this.nearQuery = true;
            this.query = {
                key: indexedProp,
                near: queryObject.$geometry,
                distanceField: 'generatedBy.distance',
                [distanceProp]: distance
            };
            this.shardQuery = {
                geometry: {
                    $near: {
                        ...queryObject,
                        [`$${distanceProp}`]: distance
                    }
                }
            };
        } else {
            switch (rel) {
                case 'within':
                    this.query = { [indexedProp]: { $geoWithin: queryObject } }
                    break;
                case 'contains':
                    //TODO: this is not a correct query (needs to be inverse of $geoWithin)
                    this.query = { [indexedProp]: { $geoIntersects: queryObject } }
                    break;
                case 'intersects':
                    this.query = { [indexedProp]: { $geoIntersects: queryObject } }
                    break;
                case 'equals':
                    this.query = {
                        $and: [
                            { [indexedProp]: { $geoIntersects: queryObject } },
                            { [indexedProp]: { $geoWithin: queryObject } }
                        ]
                    }
                    break;
                case 'disjoint':
                    this.query = { [indexedProp]: { $not: { $geoIntersects: queryObject } } }
                    break;
                case 'overlaps':
                    this.query = {
                        $and: [
                            { [indexedProp]: { $geoIntersects: queryObject } },
                            { [indexedProp]: { $not: { $geoWithin: queryObject } } }
                        ]
                    }
                    break;
                default: {
                    const msg = `Parsing Error: georel='${rel}' is not valid`;
                    console.error(msg);
                    throw new Error(msg);
                }
            }

            this.nearQuery = false;
            this.shardQuery = { geometry: { $geoIntersects: queryObject } }
        }
    }

    public async getShardQuery(): Promise<unknown> {
        const countries = await CountryGeometry.Model.find(this.shardQuery, { _id: 0, countryISO: 1 }).exec();

        return {
            countryISO: { $in: countries.map(c => c.countryISO).concat('00') },
            geoPartitionKey: '00'
        }
    }
}