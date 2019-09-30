import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'

export interface IndexedSensor {
    sensorId: string;
    countryISO: string;
    geoPartitionKey: string;
    location: {
        type: string;
        coordinates: number[];
    };
    observes: string;
}

const shardKeySpec = { countryISO: 1, geoPartitionKey: 1 };

export const IndexedSensor = new Model<IndexedSensor>('SensorMetadata', {
    sensorId: { type: String, required: true, index: true },
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
    observes: { type: String, required: true }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    },
    schemaConf: (schema): void => {
        schema.index({location: '2dsphere', type: 1, sensorId: 1});
    }
});
