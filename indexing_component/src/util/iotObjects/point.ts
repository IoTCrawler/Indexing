import { Entity, PointType, locationPropName, NgsiGeoProperty } from "../clients/ngsiObjects/ngsiNotification";

export class Point {
    public readonly id: string;
    public readonly type: typeof PointType;
    public readonly location: {
        coordinates: number[];
    };

    constructor(ngsiPoint: Entity) {
        this.id = ngsiPoint.id;
        this.type = PointType;
        this.location = ngsiPoint[locationPropName] as NgsiGeoProperty;
    }
}