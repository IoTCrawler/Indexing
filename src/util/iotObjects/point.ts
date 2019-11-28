import { PointType, relativeLocationPropName } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { PropertyType } from "../clients/ngsiObjects/ngsiProperty";

export class Point extends EntityBase {
    public readonly type: typeof PointType;
    public readonly relativeLocation: string;

    constructor(ngsiPoint: Entity) {
        super(ngsiPoint.id);
        this.type = PointType;
        this.relativeLocation = (ngsiPoint[relativeLocationPropName] as PropertyType<string>).value;
    }
}