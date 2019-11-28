import { Model } from '../util/model';

const shardKeySpec = { _id: 'hashed' };

export const UnmatchedQuality = new Model<unknown>('UnmatchedQuality', {
    _id: { type: String }
}, {
    schemaOptions: {
        shardKey: shardKeySpec,
        strict: false
    }
});
