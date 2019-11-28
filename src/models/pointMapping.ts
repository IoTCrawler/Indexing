import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'

export interface PointMapping {
    _id: string;
    countryISO: string;
    geoPartitionKey: string;
    sensorId: string;
}

const shardKeySpec = { _id: 'hashed' };

export const PointMapping = new Model<PointMapping>('PointMapping', {
    _id: { type: String },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
    sensorId: { type: String, required: true, unique: true }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    }
});
