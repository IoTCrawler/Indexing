import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'

export interface SensorMapping {
    _id: string;
    countryISO: string;
    geoPartitionKey: string;
}

const shardKeySpec = { _id: 'hashed' };

export const SensorMapping = new Model<SensorMapping>('SensorMapping', {
    _id: { type: String },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    }
});
