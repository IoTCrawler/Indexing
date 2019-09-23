import { locationPropName, hasQuantityKindPropName, SensorType } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { RelationshipType } from "../clients/ngsiObjects/ngsiProperty";

export class Sensor extends EntityBase {
    public readonly type: typeof SensorType;
    public readonly location: string;
    public readonly quantityKind: string;

    constructor(ngsiSensor: Entity) {
        super(ngsiSensor.id);
        this.type = SensorType;
        this.location = (ngsiSensor[locationPropName] as RelationshipType).object;
        this.quantityKind = (ngsiSensor[hasQuantityKindPropName] as RelationshipType).object;
    }
}

export type SensorType = Omit<Sensor, 'type' | '@context'>;