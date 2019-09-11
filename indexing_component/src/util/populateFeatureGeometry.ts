import { App } from "../app";
import * as countryGeometry from '../data/countryGeometry.json';
import { CountryGeometry } from "../models/countryGeometry";

// Connect to the database
export const app = new App(0);

// // Recreate the collection with the new contents
CountryGeometry.Model.collection.drop();
CountryGeometry.Model.createIndexes();

interface GeoFeature {
    type: string;
    properties: {
        ADM: string;
        ISO: string;
    };
    geometry: {
        type: string;
        coordinates: number[][][] | number[][][][];
    };
}

const countryGeometryDocs = countryGeometry.features.map((feature: GeoFeature) => new CountryGeometry.Model({
    countryISO: feature.properties.ISO,
    geometry: feature.geometry
}));

CountryGeometry.Model.insertMany(countryGeometryDocs)
    .then(() => console.info('Succesfully inserted country geometry into the database.'))
    .catch(() => console.error('Failed to insert country geometry into the database'))
    .finally(() => process.exit());
