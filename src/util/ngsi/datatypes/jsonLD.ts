import { contextProp, Context } from './context';

export const idProp = '@id';
export const typeProp = '@type';
export const languageProp = '@language';
export const valueProp = '@value';
export const setProp = '@set';
export const listProp = '@list';
export const containerProp = '@container';
export const vocabProp = '@vocab';

export interface TypedValue {
    [typeProp]: string;
    [valueProp]: string;
}

export interface LanguageTaggedString {
    [languageProp]: string;
    [valueProp]: string;
}

type ValueObject = TypedValue | LanguageTaggedString;
type NodeObject = unknown;
type SetValue = string | number | boolean | null | ValueObject | NodeObject;

/// Unordered set of values
export interface Set {
    [setProp]: SetValue | SetValue[];
}

/// Ordered set of values
export interface List {
    [listProp]: SetValue | SetValue[];
}

export type Value = ValueObject | Set | List;

export interface WithContext {
    [contextProp]: Context;
}