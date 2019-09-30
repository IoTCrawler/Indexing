import { IndexedSensor } from "../models/indexedSensor";
import { getCountry, getCountriesInRegion, getBoundingCircle } from "./geoHelpers";
import { HttpException } from "./errorMiddleware";
import { BAD_REQUEST } from "http-status-codes";

interface LocationQuery {
    query: '$near' | '$geoWithin';
    sort?: boolean;
}

interface NearQuery extends LocationQuery {
    query: '$near';
    point: number[];
    maxDistance?: number; // in Meters
}

interface WithinQuery extends LocationQuery {
    query: '$geoWithin';
    coordinates: number[][];
}

type NearQueryInput = Omit<Record<keyof NearQuery, string>, 'point' | 'query'> & { query: '$near'; point: string[] };
type WithinQueryInput = Omit<Record<keyof NearQuery, string>, 'coordinates' | 'query'> & { query: '$geoWithin'; coordinates: string[][] };

export interface SearchQuery {
    location: NearQueryInput | WithinQueryInput;
    observes?: string;
}

export interface SearchRequest {
    exec(): Promise<(IndexedSensor & { distance?: number })[]>;
}

export class NearSearchRequest implements SearchRequest {
    private readonly location: NearQuery;
    private readonly observes?: string;

    constructor(request: SearchQuery) {
        const reqLocation = request.location as NearQueryInput
        this.location = {
            query: reqLocation.query,
            sort: reqLocation.sort ? JSON.parse(reqLocation.sort) as boolean : undefined,
            point: reqLocation.point.map(x => parseFloat(x)),
            maxDistance: reqLocation.maxDistance ? parseFloat(reqLocation.maxDistance) : undefined
        };
        this.observes = request.observes;

        if (this.location.sort === false && !this.location.maxDistance) {
            throw new HttpException(BAD_REQUEST, 'Unsorted request must specify a search radius using \'maxDistance\' property.')
        }
    }

    public async exec(): Promise<(IndexedSensor & { distance?: number })[]> {
        // Sort $near search queries by default
        if (this.location.sort === false) {
            return await this.execUnsorted();
        }
        return await this.execSorted();
    }

    private async execSorted(): Promise<(IndexedSensor & { distance?: number })[]> {
        const geoNear = {
            key: 'location',
            near: { type: 'Point', coordinates: this.location.point },
            distanceField: 'distance',
            spherical: true,
            query: {
                countryISO: await getCountry(this.location.point),
                geoPartitionKey: '00',
                observes: this.observes
            }
        };
        let pipiline = IndexedSensor.Model.aggregate([{ $geoNear: this.location.maxDistance ? { ...geoNear, maxDistance: this.location.maxDistance } : { ...geoNear } }]);

        if (!this.location.maxDistance) {
            pipiline = pipiline.limit(100);
        }

        return await pipiline.exec();
    }

    private async execUnsorted(): Promise<IndexedSensor[]> {
        const pipiline = IndexedSensor.Model.find({
            countryISO: await getCountry(this.location.point),
            geoPartitionKey: '00',
            location: {
                $geoWithin: {
                    $centerSphere: [this.location.point, this.location.maxDistance! / 6371000]
                }
            },
            observes: this.observes
        });

        return await pipiline.exec();
    }
}

export class WithinSearchRequest implements SearchRequest {
    private readonly location: WithinQuery;
    private readonly observes?: string;

    constructor(request: SearchQuery) {
        const reqLocation = request.location as WithinQueryInput
        const coordinates = reqLocation.coordinates.map(point => point.map(x => parseFloat(x)));

        this.location = {
            query: reqLocation.query,
            sort: reqLocation.sort ? JSON.parse(reqLocation.sort) as boolean : undefined,
            coordinates: coordinates.concat([coordinates[0]]) // Close the loop for MongoDB queries
        };
        this.observes = request.observes;
    }

    public async exec(): Promise<(IndexedSensor & { distance?: number })[]> {
        // Do NOT sort $geoWithin search queries by default
        if (this.location.sort) {
            return await this.execSorted();
        }
        return await this.execUnsorted();
    }

    private async execSorted(): Promise<(IndexedSensor & { distance?: number })[]> {
        const boundingCircle = getBoundingCircle(this.location.coordinates);

        const pipiline = IndexedSensor.Model.aggregate([{
            $geoNear: {
                key: 'location',
                near: { type: 'Point', coordinates: boundingCircle.center },
                distanceField: 'distance',
                maxDistance: boundingCircle.radius,
                spherical: true,
                query: {
                    countryISO: { $in: await getCountriesInRegion(this.location.coordinates) },
                    geoPartitionKey: '00',
                    location: {
                        $geoWithin: {
                            $geometry: {
                                type: 'Polygon',
                                coordinates: [this.location.coordinates]
                            }
                        }
                    },
                    observes: this.observes
                }
            }
        }]);

        return await pipiline.exec();
    }

    private async execUnsorted(): Promise<IndexedSensor[]> {
        const pipiline = IndexedSensor.Model.find({
            countryISO: { $in: await getCountriesInRegion(this.location.coordinates) },
            geoPartitionKey: '00',
            location: {
                $geoWithin: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: [this.location.coordinates]
                    }
                }
            },
            observes: this.observes
        });

        return await pipiline.exec();
    }
}