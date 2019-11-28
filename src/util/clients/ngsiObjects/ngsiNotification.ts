import { Entity } from "./ngsiEntity";

export interface Notification {
    id: string;
    type: 'Notification';
    subscriptionId: string;
    notifiedAt: string;
    data: Entity | Entity[];
}