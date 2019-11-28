import * as express from 'express';

export interface Controller {
    readonly path: string;
    readonly router: express.Router;
}
