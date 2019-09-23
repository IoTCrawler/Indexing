interface EntityInfo {
    id?: string;
    idPattern?: string;
    type: string;
}

interface NotificationParams {
    attributes: string[];
    format: 'keyValues' | 'normalized';
    endpoint: {
        uri: string;
        accept: 'application/json' | 'application/ld+json';
    };
    readonly status?: 'ok' | 'failed';
}

export interface Subscription {
    readonly id?: string;
    type: 'Subscription';
    name?: string;
    description?: string;
    entities?: EntityInfo[];
    watchedAttributes?: string[];
    timeInterval?: number;
    q?: string;
    geoQ?: string;
    csf?: string;
    isActive?: boolean;
    notification: NotificationParams;
    expires?: string;
    throttling?: number;
    temporalQ?: {};
    readonly status?: 'active' | 'paused' | 'expired';
    '@context': string[];
}