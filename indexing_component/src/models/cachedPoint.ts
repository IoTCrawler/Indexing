import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers';

export interface CachedPoint {
    pointId: string;
    countryISO: string;
    geoPartitionKey: string;
    location: {
        type: string;
        coordinates: number[];
    };
    createdAt: Date
}

export const CachedPoint = new Model<CachedPoint>('CachedPoint', {
    pointId: { type: String, required: true },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    createdAt: { type: Date, expires: 24 * 60 * 60, default: Date.now } // Expire cache after 24 hours
}, {
    schemaOptions: {
        shardKey: { pointId: 'hashed' }
    }
});