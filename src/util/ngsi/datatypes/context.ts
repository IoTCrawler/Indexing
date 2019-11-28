import * as jsonLD from './jsonLD';

export const contextProp = '@context';

export interface ContextObject {
    [term: string]: string | undefined | {
        [jsonLD.idProp]: string;
        [jsonLD.typeProp]?: string;
        [jsonLD.containerProp]?: typeof jsonLD.setProp | typeof jsonLD.listProp;
    };
}

export type Context = string | ContextObject | (ContextObject | string)[];