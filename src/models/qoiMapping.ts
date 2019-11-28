import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'

export interface QoiMapping {
    _id: string;
    countryISO: string;
    geoPartitionKey: string;
    sensorId: string;
}

const shardKeySpec = { _id: 'hashed' };

export const QoiMapping = new Model<QoiMapping>('QoiMapping', {
    _id: { type: String },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
    sensorId: { type: String, required: true, unique: true }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    }
});
