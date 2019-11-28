import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { ProblemDetails, InternalErrorErrorType } from './datatypes/problemDetails';

export class NgsiError extends Error implements ProblemDetails {
    public type: string;
    public title: string;
    public status: number;
    public instance?: string;

    get detail(): string {
        return this.message;
    }

    set detail(value: string) {
        this.message = value;
    }

    constructor (error: ProblemDetails) {
        super(error.detail || 'There has been an error during the operation execution');

        this.type = error.type || InternalErrorErrorType;
        this.title = error.title || 'Internal Server Error';
        this.status = error.status || INTERNAL_SERVER_ERROR;
        this.instance = error.instance;
    }
}