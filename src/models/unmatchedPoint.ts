import { Model } from '../util/model';

export interface UnmatchedPoint {
    _id: string;
    relativeLocation: string;
}

const shardKeySpec = { _id: 'hashed' };

export const UnmatchedPoint = new Model<UnmatchedPoint>('UnmatchedPoint', {
    _id: { type: String },
    relativeLocation: { type: String }
}, {
    schemaOptions: {
        shardKey: shardKeySpec
    }
});
