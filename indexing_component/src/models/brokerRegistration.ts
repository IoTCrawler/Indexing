import { Model } from '../util/model';

export interface BrokerRegistration {
    host: string;
    subscriptionId: string;
}

export const BrokerRegistration = new Model<BrokerRegistration>('BrokerRegistration', {
    host: { type: String, required: true, unique: true },
    subscriptionId: { type: String, required: true, unique: true }
});
