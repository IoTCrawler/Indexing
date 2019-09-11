import { Entity, SensorType, locationPropName, hasQuantityKindPropName } from "../clients/ngsiObjects/ngsiNotification";

export class Sensor {
    public readonly id: string;
    public readonly location: string;
    public readonly quantityKind: string;

    constructor(ngsiPoint: Entity) {
        this.id = ngsiPoint.id;
        this.location = ngsiPoint[locationPropName] as string;
        this.quantityKind = ngsiPoint[hasQuantityKindPropName] as string;
    }
}