import { IotStreamType, generatedByPropName, hasQualityPropName } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { RelationshipType } from "../clients/ngsiObjects/ngsiProperty";

export class IotStream extends EntityBase {
    public readonly type: typeof IotStreamType;
    public readonly generatedBy: string;
    public readonly hasQuality?: string;

    constructor(ngsiSensor: Entity) {
        super(ngsiSensor.id);
        this.type = IotStreamType;
        this.generatedBy = (ngsiSensor[generatedByPropName] as RelationshipType).object;
        this.hasQuality = hasQualityPropName in ngsiSensor ? (ngsiSensor[hasQualityPropName] as RelationshipType).object : undefined;
    }
}
