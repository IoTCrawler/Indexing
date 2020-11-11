import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '../validateEnv';
import { CREATED } from 'http-status-codes';
import { HttpException } from '../errorMiddleware';

import https = require('https');

class IdmClient {
    private readonly client: AxiosInstance;
    private readonly credentials: {
        name: string;
        password: string;
    };
    private token?: {
        expiresAt: Date;
        value: string;
    };

    constructor() {
        this.client = axios.create({
            baseURL: env.IDM_HOST,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
              })
        });

        this.credentials = {
            name: env.INDEXER_IDM_USER,
            password: env.INDEXER_IDM_PASS
        }
    }

    public async getToken(): Promise<string> {
        if (this.token && Date.now() - this.token.expiresAt.getTime() > 5 * 60 * 1000) {
            return this.token.value;
        }

        const result = await this.client.post('/v1/auth/tokens', this.credentials);
        if (result.status !== CREATED) {
            throw new HttpException(result.status, `Failed to get authentication token: ${result.data}`);
        }

        this.token = {
            expiresAt: new Date(result.data.token.expires_at),
            value: result.headers['x-subject-token']
        };

        return this.token.value;
    }
}

type HttpMethod = AxiosRequestConfig['method'];
interface CapabilityTokenRequest {
    token: string; // Token from Identity Manager
    ac: HttpMethod; // HTTP method to be executed
    de: string; // Host / Device
    re: string; // NGSI-LD endpoint 
}

class AuthClientT {
    private readonly client: AxiosInstance;
    private readonly idmClient: IdmClient;

    constructor() {
        this.client = axios.create({
            baseURL: env.CPM_HOST,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        this.idmClient = new IdmClient();
    }

    public async getToken(action: HttpMethod, resource: string): Promise<string> {
        const req: CapabilityTokenRequest = {
            token: await this.idmClient.getToken(),
            ac: action,
            // de: 'localhost',
            de: env.BROKER_HOST,
            re: resource
        };

        const result = await this.client.post('/', req);
        return JSON.stringify(result.data);
    }
}

export const AuthClient = new AuthClientT();