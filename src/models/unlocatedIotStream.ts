import { Model } from '../util/model';

export interface UnlocatedIotStream {
    _id: string;
    generatedBy: string;
    hasQuality?: string;
}

const shardKeySpec = { _id: 'hashed' };

export const UnlocatedIotStream = new Model<UnlocatedIotStream>('UnlocatedIotStream', {
    _id: { type: String },
    generatedBy: { type: String, required: true, index: true },
    hasQuality: { type: String }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    }
});
