import { NgsiPropertyType } from "./ngsiProperty";

interface EntityBaseType {
    id: string;
    type: string;
    "@context": string[];
}

export type Entity = EntityBaseType & {
    [property: string]: NgsiPropertyType<unknown>;
}

export abstract class EntityBase implements EntityBaseType {
    public readonly id: string;
    public abstract readonly type: string;
    public readonly '@context': string[];

    constructor(id: string, context: string[] = ['https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld']) {
        this.id = id;
        this['@context'] = context;
    }
}