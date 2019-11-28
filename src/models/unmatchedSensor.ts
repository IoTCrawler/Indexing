import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'
import { LocationSchema } from './schemas/locationSchema';
import { Geometry } from '../util/clients/ngsiObjects/geoJson';
import { GeoPointSchema } from './schemas/geoPointSchema';

export interface UnmatchedSensor {
    _id: string;
    countryISO: string;
    geoPartitionKey: string;
    location: Geometry;
    metaLocation?: { // geo:Point
        _id: string;
        relativeLocation?: string;
    };
    observes: string;
}

const shardKeySpec = { _id: 'hashed' };

export const UnmatchedSensor = new Model<UnmatchedSensor>('UnmatchedSensor', {
    _id: { type: String },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
    location: { type: LocationSchema, required: true },
    metaLocation: { type: GeoPointSchema, required: false },
    observes: { type: String, required: true }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    },
    schemaConf: (schema): void => {
        schema.index({ 'metaLocation._id': 1 }, { sparse: true });
    }
});
