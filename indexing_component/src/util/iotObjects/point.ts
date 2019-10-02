import { PointType } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { GeoPropertyType } from "../clients/ngsiObjects/ngsiProperty";

export class Point extends EntityBase {
    public readonly type: typeof PointType;
    //public readonly location: GeoPropertyType['value'];
    public readonly location: {
        type: 'Point';
        coordinates: number[];
    };

    constructor(ngsiPoint: Entity) {
        super(ngsiPoint.id);
        this.type = PointType;
        //this.location = (ngsiPoint['location'] as GeoPropertyType).value;
        this.location = JSON.parse((ngsiPoint['location'] as GeoPropertyType).value) as Point['location'];
    }
}