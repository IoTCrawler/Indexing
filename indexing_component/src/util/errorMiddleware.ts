import * as express from 'express';

export class HttpException extends Error {
    public readonly status: number;
    public readonly message: string;
    public readonly innerException?: Error;

    constructor(status: number, message: string, innerException?: Error) {
        super(message);
        this.status = status;
        this.message = message;
        this.innerException = innerException;
    }
}

export function errorMiddleware(error: HttpException, req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    const exception = req.app.get('env') === 'production' ? undefined : error.innerException;

    res.status(status)
        .json({
            status,
            message,
            stack: exception && exception.stack
        });
}