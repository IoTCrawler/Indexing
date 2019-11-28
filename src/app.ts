import * as express from 'express';
import { NOT_FOUND } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { errorMiddleware } from './util/errorMiddleware';
import { env } from './util/validateEnv';
import { NotificationController } from './controllers/notificationController';
import { BrokerController } from './controllers/brokerController';
import { QueryController } from './controllers/queryController';

export class App {
    public app: express.Application;
    public port: number;

    constructor(port: number) {
        this.app = express();
        this.port = port;

        this.connectToTheDatabase();
        mongoose.connection.on('disconnect', this.connectToTheDatabase.bind(this));

        this.initializeMiddleware();
        this.initializeControllers();
        this.initializeErrorHandling();
    }

    private initializeMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, _, next) => {
            console.info(`${req.method} ${req.path}`);
            next();
        });
    }

    private initializeControllers(): void {
        // Initialize controllers
        this.app.use('/api', new BrokerController().router);
        this.app.use('/api', new NotificationController().router);
        this.app.use('/ngsi-ld/v1', new QueryController().router);

        // Setup default handler
        this.app.use('*', (_, res) => {
            res.sendStatus(NOT_FOUND);
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(errorMiddleware);
    }

    private connectToTheDatabase(): void {
        const {
            MONGO_USER: user,
            MONGO_PASSWORD: password,
            MONGO_HOST: host,
            MONGO_DB: db,
        } = env;

        mongoose.connect(
            `mongodb://${user}:${password}@${host}/${db}`,
            { 
                useNewUrlParser: true,
                useCreateIndex: true,
                useFindAndModify: false
            }
        ).then(() => {
            console.info(`Succesfully connected to mongodb://${host}/${db}`);
        }).catch(error => {
            console.error(`Error connecting to database: ${error}`);
            process.exit(1);
        });
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.info(`App listening on the port ${this.port}`);
        });
    }
}
