import { App } from "../app";
import * as countryGeometry from '../data/countryGeometry.json';
import { CountryGeometry } from "../models/countryGeometry";

// Connect to the database
export const app = new App(0);

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

// Create country geometry collection
async function run(): Promise<void> {
    if (await CountryGeometry.Model.exists({})) {
        console.log('Collection already exists: dropping...');
        await CountryGeometry.Model.collection.drop();
        await CountryGeometry.Model.createIndexes();
    }

    const countryGeometryDocs = countryGeometry.features.map((feature: GeoFeature) => new CountryGeometry.Model({
        countryISO: feature.properties.ISO,
        geometry: feature.geometry
    }));

    await CountryGeometry.Model.insertMany(countryGeometryDocs);
}

// Call the asynchronous function and wait for completion
run().then(() => {
    console.log('Succesfully inserted country geometry into the database');
}).catch((err) => {
    console.log(`Failed to insert country geometry into the database: ${err}`);
}).finally(() => {
    process.exit();
});