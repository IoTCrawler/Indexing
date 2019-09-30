import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CREATED, NO_CONTENT, OK } from 'http-status-codes';
import { Subscription } from './ngsiObjects/ngsiSubscription';
import { NgsiError } from './ngsiObjects/ngsiError';
import { env } from '../validateEnv';
import { SensorType, PointType, locationPropName, sensorObservesPropName } from "../iotObjects/ontology";
import { Point } from '../iotObjects/point';
import { BrokerRegistration } from '../../models/brokerRegistration';
import * as mongoose from 'mongoose';
import { Entity } from './ngsiObjects/ngsiEntity';

export class NgsiClient {
    private readonly client: AxiosInstance;
    private readonly contentType: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };
    private readonly credentials: {
        username: string;
        password: string;
    };

    constructor(brokerData: BrokerRegistration) {
        this.client = axios.create({
            baseURL: `${brokerData.host}`,
            headers: {
                'Accept': 'application/ld+json'
            }
        });

        this.credentials = {
            username: brokerData.user,
            password: brokerData.password
        };
    }

    public async auth(): Promise<void> {
        const result = await this.client.post('/login', this.credentials, this.contentType);
        if (result.status !== OK) {
            throw new Error('Failed to authenticate with the broker');
        }

        this.client.defaults.headers['X-AUTH-TOKEN'] = result.data.token;
    }

    public async createSubscription(): Promise<{ id: string }> {
        const reqData: Subscription = {
            id: (new mongoose.Types.ObjectId()).toHexString(),
            type: 'Subscription',
            entities: [
                {
                    type: SensorType
                },
                {
                    type: PointType
                }
            ],
            watchedAttributes: [
                'location',
                locationPropName,
                sensorObservesPropName
            ],
            notification: {
                endpoint: {
                    uri: `${env.INDEXER_HOST}/api/notification`,
                    accept: 'application/json'
                },
                format: 'normalized',
                attributes: [
                    'location',
                    locationPropName,
                    sensorObservesPropName
                ]
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

    public async getPoints(ids: string[]): Promise<Point[]> {
        const result = await this.client.get<Entity[]>(`/ngsi-ld/v1/entities`, {
            params: {
                options: 'keyValues',
                idPattern: `(${ids.join('|')})`,
                // type: PointType // Does not work with Orion broker
            }
        });

        if (result.status !== OK) {
            throw new NgsiError(result.status, 'Failed to retrieve points');
        }

        if (result.data.length !== ids.length) {
            console.warn(`Some of the points are missing. Requested: ${ids.length}. Found: ${result.data.length}`);
        }

        return result.data.map(p => new Point(p));
    }
}