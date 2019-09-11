import * as mongoose from 'mongoose';

export class Model<T> {
    public readonly Schema: mongoose.Schema;
    public readonly Model: mongoose.Model<T & mongoose.Document>;

    constructor(modelName: string, schemaDefinition: Record<keyof T, mongoose.SchemaDefinition['']>, schemaParams: {
        schemaOptions?: mongoose.SchemaOptions;
        schemaConf?: (s: mongoose.Schema) => void;
    } = {}) {
        this.Schema = new mongoose.Schema(schemaDefinition, {
            collection: modelName,
            ... schemaParams.schemaOptions,
            strict: true
        });

        if (schemaParams.schemaConf) {
            schemaParams.schemaConf(this.Schema);
        }

        this.Model = mongoose.model<T & mongoose.Document>(modelName, this.Schema);
    }
}
