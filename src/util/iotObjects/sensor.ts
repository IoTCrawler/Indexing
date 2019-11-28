import { locationPropName, observesPropName, SensorType } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { RelationshipType, GeoPropertyType, PropertyType } from "../clients/ngsiObjects/ngsiProperty";

export class Sensor extends EntityBase {
    public readonly type: typeof SensorType;
    public readonly location: GeoPropertyType['value'];
    public readonly metaLocation?: string;
    public readonly observes: string;

    constructor(ngsiSensor: Entity) {
        super(ngsiSensor.id);
        this.type = SensorType;
        
        const locationValue = (ngsiSensor['location'] as (PropertyType<string> | GeoPropertyType)).value;
        this.location = typeof locationValue === 'string' ? JSON.parse(locationValue) : locationValue;

        this.metaLocation = locationPropName in ngsiSensor ? (ngsiSensor[locationPropName] as RelationshipType).object : undefined;
        this.observes = (ngsiSensor[observesPropName] as RelationshipType).object;
    }
}
