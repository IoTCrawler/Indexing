import { Model } from '../util/model';
import { CountryIsoList } from '../util/geoHelpers'
import { LocationSchema } from './schemas/locationSchema';
import { Geometry } from '../util/clients/ngsiObjects/geoJson';
import { NgsiPropertyType } from '../util/clients/ngsiObjects/ngsiProperty';
import { GeoPointSchema } from './schemas/geoPointSchema';

export interface IndexedIotStream {
    _id: string;
    countryISO: string;
    geoPartitionKey: string;
    generatedBy: { // sosa:Sensor
        _id: string;
        location: Geometry;
        metaLocation?: { // geo:Point
            _id: string;
            relativeLocation?: string;
        };
        observes: string;
    };
    hasQuality?: { // qoi:Quality
        _id: string;
    } & { [prop: string]: NgsiPropertyType<unknown> | undefined };
}

const shardKeySpec = { countryISO: 1, geoPartitionKey: 1 };

export const IndexedIotStream = new Model<IndexedIotStream>('IndexedIotStream', {
    _id: { type: String },
    countryISO: { type: String, enum: CountryIsoList, required: true },
    geoPartitionKey: { type: String, required: true, default: '00' },
    generatedBy: {
        _id: { type: String, required: true, index: true },
        location: { type: LocationSchema, required: true },
        metaLocation: { type: GeoPointSchema, required: false },
        observes: { type: String, required: true }
    },
    hasQuality: Object
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    },
    schemaConf: (schema): void => {
        schema.index({ 'generatedBy.location': '2dsphere', 'generatedBy.observes': 1 });
        schema.index({ 'metaLocation._id': 1 }, { sparse: true });
        schema.index({ 'hasQuality._id': 1 }, { sparse: true });
    }
});
