export class NgsiError extends Error {
    public readonly status: number;
    public readonly message: string;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}