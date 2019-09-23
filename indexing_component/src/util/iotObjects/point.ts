import { PointType, locationPropName } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { GeoPropertyType } from "../clients/ngsiObjects/ngsiProperty";

export class Point extends EntityBase {
    public readonly type: typeof PointType;
    public readonly location: GeoPropertyType['value'];

    constructor(ngsiPoint: Entity) {
        super(ngsiPoint.id);
        this.type = PointType;
        this.location = (ngsiPoint[locationPropName] as GeoPropertyType).value;
    }
}