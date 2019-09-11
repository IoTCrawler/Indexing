interface EntityInfo {
    type: string;
    idPattern?: string;
}

interface NotificationParams {
    http: {
        url: string;
    };
    attrsFormat: string;
    attrs: string[];
}

export interface Subscription {
    readonly id?: string;
    description?: string;
    expires?: string;
    readonly status?: 'active' | 'inactive' | 'expired' | 'failed';
    throttling?: number;
    subject: {
        entities: EntityInfo[];
        condition: {
            attrs: string[];
        };
    };
    notification: NotificationParams;
}