export const PointType = 'http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23Point';
export const SensorType = 'http%3A%2F%2Fwww.w3.org%2Fns%2Fsosa%2FSensor';
export const locationPropName = 'https%3A%2F%2Furi.etsi.org%2Fngsi-ld%2Flocation';
export const hasQuantityKindPropName = 'http%3A%2F%2Fpurl.oclc.org%2FNET%2FUNIS%2Ffiware%2Fiot-lite%23hasQuantityKind';

export type ngsiTypes = typeof PointType | typeof SensorType;

export interface NgsiGeoProperty {
    type: 'Point';
    coordinates: number[];
}

export interface Entity {
    id: string;
    type: string;
    [locationPropName]?: NgsiGeoProperty | string;
    [hasQuantityKindPropName]?: string;
    "@context": string[];
}

export interface Notification {
    subscriptionId: string;
    data: Entity[];
}