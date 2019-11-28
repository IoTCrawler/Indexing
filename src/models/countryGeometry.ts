import { Model } from '../util/model';
import * as mongoose from 'mongoose';
import { CountryIsoList } from '../util/geoHelpers';

export interface CountryGeometry {
    countryISO: string;
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
}

export const CountryGeometry = new Model<CountryGeometry>('CountryGeometry', {
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geometry: {
        type: {
            type: String,
            enum: ['Polygon', 'MultiPolygon'],
            required: true
        },
        coordinates: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
    }
}, {
    schemaConf: (schema): void => {
        schema.index({ geometry: '2dsphere', countryISO: 1 });
    }
});
