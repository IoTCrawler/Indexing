import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { CREATED, NO_CONTENT, OK } from 'http-status-codes';
import { Subscription } from './ngsiObjects/ngsiSubscription';
import { NgsiError } from './ngsiObjects/ngsiError';
import { env } from '../validateEnv';
import { SensorType, PointType, locationPropName, hasQuantityKindPropName, Entity } from './ngsiObjects/ngsiNotification';
import { Point } from '../iotObjects/point';

export class NgsiClient {
    private readonly client: AxiosInstance;
    private readonly contentType: AxiosRequestConfig = { headers: { 'Content-Type': 'application/json' } };

    constructor(host: string) {
        this.client = axios.create({
            baseURL: `${host}`,
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    public async createSubscription(): Promise<{ id: string }> {
        const reqData: Subscription = {
            subject: {
                entities: [
                    {
                        idPattern: "urn:ngsi-ld:Sensor:.*",
                        type: SensorType
                    },
                    {
                        idPattern: "urn:ngsi-ld:Point:.*",
                        type: PointType
                    }
                ],
                condition: {
                    attrs: [
                        locationPropName,
                        hasQuantityKindPropName
                    ]
                }
            },
            notification: {
                http: {
                    url: `${env.INDEXER_HOST}/api/notification`
                },
                attrsFormat: "keyValues",
                attrs: [
                    locationPropName,
                    hasQuantityKindPropName
                ]
            }
        };

        const result = await this.client.post<Subscription>('/v2/subscriptions/', reqData, this.contentType);

        if (result.status !== CREATED) {
            throw new NgsiError(result.status, "Failed to create subscription")
        }

        const subscriptionPath = (result.headers.location as string).split('/');
        return { id: subscriptionPath[subscriptionPath.length - 1] };
    }

    public async deleteSubscription(id: string): Promise<void> {
        const result = await this.client.delete(`/v2/subscriptions/${id}`);
        if (result.status !== NO_CONTENT) {
            throw new NgsiError(result.status, 'Failed to delete subscription');
        }
    }

    public async getPoints(ids: string[]): Promise<Point[]> {
        const result = await this.client.get<Entity[]>(`/v2/entities`, {
            params: {
                options: 'keyValues',
                idPattern: `(${ids.join('|')})`,
                // type: PointType // Does not work with Orion broker
            }
        });

        if(result.status !== OK) {
            throw new NgsiError(result.status, 'Failed to retrieve points');
        }

        if(result.data.length !== ids.length) {
            console.warn(`Some of the points are missing. Requested: ${ids.length}. Found: ${result.data.length}`);
        }

        return result.data.map(p => new Point(p));
    }
}