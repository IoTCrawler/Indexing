import { locationPropName, sensorObservesPropName, SensorType } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { RelationshipType } from "../clients/ngsiObjects/ngsiProperty";

export class Sensor extends EntityBase {
    public readonly type: typeof SensorType;
    public readonly location: string;
    public readonly observes: string;

    constructor(ngsiSensor: Entity) {
        super(ngsiSensor.id);
        this.type = SensorType;
        this.location = (ngsiSensor[locationPropName] as RelationshipType).object;
        this.observes = (ngsiSensor[sensorObservesPropName] as RelationshipType).object;
    }
}

export type SensorType = Omit<Sensor, 'type' | '@context'>;