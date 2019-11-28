import * as mongoose from 'mongoose';

export const GeoPointSchema = new mongoose.Schema({
    _id: {type: String},
    relativeLocation: { type: String }
});