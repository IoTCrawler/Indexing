import { Model } from '../util/model';

export interface BrokerRegistration {
    host: string;
    user: string;
    password: string;
    subscriptionId: string;
}

export const BrokerRegistration = new Model<BrokerRegistration>('BrokerRegistration', {
    host: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    password: { type: String, required: true },
    subscriptionId: { type: String, required: true, unique: true }
});
