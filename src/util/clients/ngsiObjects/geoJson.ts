export const PointType = 'Point';
export const MultiPointType = 'MultiPoint';
export const LineStringType = 'LineString';
export const MultiLineStringType = 'MultiLineString';
export const PolygonType = 'Polygon';
export const MultiPolygonType = 'MultiPolygon';

type GeometryType = typeof PointType | typeof MultiPointType | typeof LineStringType | typeof MultiLineStringType | typeof PolygonType | typeof MultiPolygonType;

interface GeometryObjectBase {
    type: GeometryType;
    coordinates: unknown[];
}

type Longitude = number;
type Latitude = number;
type Altitude = number;
type Position = [Longitude, Latitude] | [Longitude, Latitude, Altitude];

export interface Point extends GeometryObjectBase {
    type: typeof PointType;
    coordinates: Position;
}

export interface MultiPoint extends GeometryObjectBase {
    type: typeof MultiPointType;
    coordinates: [Position] & Position[];
}

export interface LineString extends GeometryObjectBase {
    type: typeof LineStringType;
    coordinates: Pick<[Position, Position], '0' | '1'> & Position[];
}

export interface MultiLineString extends GeometryObjectBase {
    type: typeof MultiLineStringType;
    coordinates: [LineString['coordinates']] & LineString['coordinates'][];
}

type LinearRing = Pick<[Position, Position, Position, Position], '0' | '1' | '2' | '3'> & Position[];
export interface Polygon extends GeometryObjectBase {
    type: typeof PolygonType;
    coordinates: Pick<[LinearRing], '0'> & LinearRing[];
}

export interface MultiPolygon extends GeometryObjectBase {
    type: typeof MultiPolygonType;
    coordinates: [Polygon['coordinates']] & Polygon['coordinates'][];
}

type GeometryBase = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;
export type Geometry = GeometryBase;
