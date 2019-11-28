import { QualityType } from "./ontology";
import { Entity, EntityBase } from "../clients/ngsiObjects/ngsiEntity";
import { NgsiPropertyType, RelationshipType, PropertyType } from "../clients/ngsiObjects/ngsiProperty";

export class Quality extends EntityBase {
    public readonly type: typeof QualityType;
    public readonly props: { [prop: string]: NgsiPropertyType<unknown> } = {};

    constructor(ngsiSensor: Entity) {
        super(ngsiSensor.id);
        this.type = QualityType;

        for (const prop in ngsiSensor) {
            if (prop === 'id' || prop === 'type' || prop === '@context') { continue; }

            const escapedPropName = prop.replace(new RegExp('\\.', 'g'), '%2E');

            if (ngsiSensor[prop].type === 'Relationship') {
                this.props[escapedPropName] = {
                    type: 'Relationship',
                    object: (ngsiSensor[prop] as RelationshipType).object
                }
                continue;
            }

            this.props[escapedPropName] = {
                type: ngsiSensor[prop].type,
                value: (ngsiSensor[prop] as PropertyType<unknown>).value
            } as PropertyType<unknown>;
        }
    }
}
