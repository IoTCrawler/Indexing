import { Model } from '../util/model';

export interface BrokerRegistration {
    host: string;
    streamSubscriptionId: string;
    sensorSubscriptionId: string;
    pointSubscriptionId: string;
    qoiSubscriptionId: string;
}

export const BrokerRegistration = new Model<BrokerRegistration>('BrokerRegistration', {
    host: { type: String, required: true, unique: true },
    streamSubscriptionId: { type: String, required: true, unique: true },
    sensorSubscriptionId: { type: String, required: true, unique: true },
    pointSubscriptionId: { type: String, required: true, unique: true },
    qoiSubscriptionId: { type: String, required: true, unique: true }
});
