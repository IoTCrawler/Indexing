import axios from 'axios';
import { ContextObject, Context as ContextT, contextProp } from "./datatypes/context";
import { CoreContext as RawCoreContextObj, CoreContextLocation } from './datatypes/coreContext';
import { OK, SERVICE_UNAVAILABLE, BAD_REQUEST } from 'http-status-codes';
import { LdContextNotAvailableErrorType, BadRequestDataErrorType } from './datatypes/problemDetails';
import * as jsonLD from './datatypes/jsonLD';
import { NgsiError } from './ngsiError';
import { IndexingContext as IndexingContextObj } from './datatypes/indexingContext';
import { IotcContext as IotcContextObj } from './datatypes/iotcContext';

export class Context {
    public static readonly Core = new Context(RawCoreContextObj[contextProp] as ContextObject, CoreContextLocation);
    public static readonly Indexing = new Context(IndexingContextObj[contextProp] as ContextObject, 'http://indexing/context');
    public static readonly Iotc = new Context(IotcContextObj[contextProp] as ContextObject, 'https://iotcrawler.eu/context');
    private static readonly KeyParser = new RegExp('^(([A-Za-z0-9_-]+):|)(([A-Za-z0-9_-]+)(|#[0-9]+))$');

    public readonly OriginalContext: Readonly<ContextT>;
    private readonly context: Readonly<ContextObject>;

    private constructor(context: ContextObject, originalContext: ContextT) {
        this.OriginalContext = originalContext;
        this.context = context;
    }

    public static async Create(rawContext: ContextT): Promise<Context> {
        const contextObjects = await Context.Parse(rawContext);
        const mergedCtxObject = Context.Merge(contextObjects);
        return new Context(mergedCtxObject, rawContext);
    }

    public expand<T extends Record<string, unknown>>(obj: T, includeCore = false): { [key: string]: unknown } {
        const result: { [key: string]: unknown } = {};

        for (const key in obj) {
            if (key === contextProp || key.includes('/')) {
                result[key] = obj[key];
                continue;
            }

            const parsedKey = key.match(Context.KeyParser);
            if (!parsedKey) {
                throw new NgsiError({
                    type: BadRequestDataErrorType,
                    title: 'Request is not a valid JSON-LD document',
                    status: BAD_REQUEST,
                    detail: `Property '${key}' is not a valid property name`
                });
            }

            const value = obj[key];

            if (parsedKey[1]) { // if key has prefix
                const prefix = this.context[parsedKey[2]] || Context.Core.context[parsedKey[2]];
                if (!prefix || prefix instanceof Object) {
                    throw new NgsiError({
                        type: BadRequestDataErrorType,
                        title: 'Request is not a valid JSON-LD document',
                        status: BAD_REQUEST,
                        detail: `Prefix '${parsedKey[2]}' of property '${key}' is not defined in the ${contextProp}`
                    });
                }

                const propName = parsedKey[3];
                result[`${prefix}${propName}`] = value;
            } else {
                const propFromContext = this.context[parsedKey[3]] || Context.Core.context[parsedKey[3]];
                const propName = propFromContext ? (propFromContext instanceof Object ? propFromContext[jsonLD.idProp] : propFromContext) : `${Context.Core.context[jsonLD.vocabProp]}${parsedKey[3]}`;

                result[`${propName}`] = value;
            }
        }

        if (includeCore) { return result; }

        // Compact Core context
        return this.compactCore(result);
    }

    public compact<T extends Record<string, unknown>>(obj: T): { [key: string]: unknown } {
        return this.compactImpl(this.compactCore(obj));
    }

    private compactImpl(obj: { [key: string]: unknown }): { [key: string]: unknown } {
        const result: { [key: string]: unknown } = {};

        // First match full keys
        for (const key in this.context) {
            const propFromContext = this.context[key];
            const fullProp = propFromContext instanceof Object ? propFromContext[jsonLD.idProp] : propFromContext!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

            if (obj[fullProp] !== undefined) {
                result[key] = obj[fullProp];
                obj[fullProp] = undefined;
            }
        }

        // Iterate through remaining properties and replace with prefixes
        for (const key in obj) {
            const prop = obj[key];

            let propName: string | undefined = undefined;
            for (const prefix in this.context) {
                const prefixProp = this.context[prefix]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (prefixProp instanceof Object) { continue; }

                if (key.startsWith(prefixProp)) {
                    propName = `${prefix}:${key.slice(prefixProp.length)}`;
                    break;
                }
            }

            propName = propName || key;
            result[propName] = prop;
        }

        return result;
    }

    private compactCore<T extends Record<string, unknown>>(obj: T): { [key: string]: unknown } {
        return Context.Core.compactImpl(obj);
    }

    private static async Parse(rawContext: ContextT): Promise<ContextObject[]> {
        let contextObjects = [] as ContextObject[];

        if (rawContext instanceof Array) {
            for (const ctxEntry of rawContext) {
                if (ctxEntry instanceof Object) {
                    contextObjects.push(ctxEntry);
                } else { // ctxEntry instanceof string
                    if (ctxEntry !== CoreContextLocation) {
                        const remoteCtx = await Context.LoadRemoteContext(ctxEntry);
                        contextObjects = contextObjects.concat(remoteCtx);
                    }
                }
            }
        } else if (rawContext instanceof Object) {
            contextObjects.push(rawContext);
            return contextObjects;
        } else { // context instanceof string
            if (rawContext !== CoreContextLocation) {
                const remoteCtx = await Context.LoadRemoteContext(rawContext);
                contextObjects = contextObjects.concat(remoteCtx);
            }
        }

        return contextObjects;
    }

    private static async LoadRemoteContext(location: string): Promise<ContextObject[]> {
        const res = await axios.get(location, {
            headers: {
                'Accept': 'application/ld+json'
            }
        });

        if (res.status !== OK || !(contextProp in res.data)) {
            throw new NgsiError({
                type: LdContextNotAvailableErrorType,
                status: SERVICE_UNAVAILABLE,
                title: 'Remote JSON-LD @context cannot be retrieved',
                detail: res.data instanceof Object ? JSON.stringify(res.data) : res.data
            });
        }

        // Recursively parse retrieved context
        return await Context.Parse(res.data[contextProp]);
    }

    private static Merge(contextObjects: ContextObject[]): ContextObject {
        const mergedContextObject: ContextObject = {};

        for (const ctx of contextObjects) {
            for (const key in ctx) {
                if (!(key in Context.Core.context)) {
                    mergedContextObject[key] = ctx[key];
                }
            }
        }

        return mergedContextObject;
    }
}

export const CoreContext = Context.Core;
export const IndexingContext = Context.Indexing;
export const IotcContext = Context.Iotc;