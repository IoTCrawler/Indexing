import * as mongoose from 'mongoose';

export const LocationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'],
        required: true
    },
    coordinates: {
        type: [],
        required: true
    }
}, { _id: false });