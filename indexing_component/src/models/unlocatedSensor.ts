import { Model } from '../util/model';
import { SensorType } from '../util/iotObjects/sensor';

export const UnlocatedSensor = new Model<SensorType & { createdAt: Date }>('UnlocatedSensor', {
    id: { type: String, required: true },
    location: { type: String, required: true, index: true },
    quantityKind: { type: String, required: true },
    createdAt: { type: Date, expires: 24 * 60 * 60, default: (): number => Date.now() }
}, {
    schemaOptions: {
        shardKey: { location: 'hashed' }
    }
});
