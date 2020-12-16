import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CREATED, NO_CONTENT, UNAUTHORIZED } from 'http-status-codes';
import { Subscription } from './ngsiObjects/ngsiSubscription';
import { NgsiError } from './ngsiObjects/ngsiError';
import { env } from '../validateEnv';
import * as mongoose from 'mongoose';
import { AuthClient } from './authClient';
import { HttpException } from '../errorMiddleware';
import https = require('https');

export class NgsiClient {
    private readonly client: AxiosInstance;
    private readonly contentType: AxiosRequestConfig = { headers: { 'Content-Type': 'application/ld+json' } };

    constructor(brokerHost: string) {
        this.client = axios.create({
            baseURL: `${brokerHost}`,
            headers: {
                'Accept': 'application/ld+json'
            },
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
              })
        });

        if (env.ENABLE_AUTH) {
            this.client.interceptors.request.use(async function (config) {
                try {
                    const token = await AuthClient.getToken(config.method, config.url as string);
                    config.headers['x-auth-token'] = token; // eslint-disable-line require-atomic-updates

                    return config;
                }
                catch (e) {
                    throw new HttpException(UNAUTHORIZED, 'Failed to get token', e);
                }
            }, (error: unknown) => Promise.reject(error));
        }
    }

    public async createSubscription(handler: string, type: string, attributes: string[] = []): Promise<{ id: string }> {
        const reqData: Subscription = {
            id: "indexing:" + (new mongoose.Types.ObjectId()).toHexString(),
            type: 'Subscription',
            entities: [
                {
                    type: type
                }
            ],
            watchedAttributes: attributes,
            notification: {
                endpoint: {
                    uri: `${env.INDEXER_HOST}/api/notification/${handler}`,
                    accept: 'application/ld+json'
                },
                format: 'normalized',
                attributes: attributes
            },
            '@context': [
                'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
            ]
        };

        const result = await this.client.post<Subscription>(`/ngsi-ld/v1/subscriptions/`, reqData, this.contentType);
        if (result.status !== CREATED) {
            throw new NgsiError(result.status, "Failed to create subscription")
        }

        const subscriptionPath = (result.headers.location as string).split('/');
        return { id: subscriptionPath[subscriptionPath.length - 1] };
    }

    public async deleteSubscription(id: string): Promise<void> {
        const result = await this.client.delete(`/ngsi-ld/v1/subscriptions/${id}`);
        if (result.status !== NO_CONTENT) {
            throw new NgsiError(result.status, 'Failed to delete subscription');
        }
    }
}