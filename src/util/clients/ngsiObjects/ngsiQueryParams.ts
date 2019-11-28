export interface NgsiQueryParams {
    id?: string; //csv
    type?: string; //csv
    idPattern?: string; // RegEx
    attrs?: string; // csv
    q?: string; // query
    csf?: string; // query (context source)
    georel?: string; // geo relationship
    geometry?: string; // GeoJson type
    coordinates?: string; // GeoJson coordinates
    geoproperty?: string; // prop name
}
