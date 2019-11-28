// Controller for managing brokers
import * as express from 'express';
import { OK, CREATED, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, NO_CONTENT } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { Controller } from '../util/Controller';
import { BrokerRegistration } from '../models/brokerRegistration';
import { HttpException } from '../util/errorMiddleware';
import { NgsiClient } from '../util/clients/ngsiClient';
import { IotStreamType, generatedByPropName, hasQualityPropName, SensorType, locationPropName, observesPropName, QualityType, relativeLocationPropName, PointType } from '../util/iotObjects/ontology';

export class BrokerController implements Controller {
    public readonly path = '/broker';
    public readonly router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    private intializeRoutes(): void {
        this.router.get(this.path, this.listBrokerRegistrations.bind(this));
        this.router.post(this.path, this.registerBroker.bind(this));
        this.router.get(`${this.path}/:id`, this.getBrokerRegistration.bind(this));
        this.router.delete(`${this.path}/:id`, this.unregisterBroker.bind(this));
    }

    public async listBrokerRegistrations(_: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        try {
            const brokerList = await BrokerRegistration.Model.find().exec();

            res.status(OK).json({
                count: brokerList.length,
                result: brokerList.map((x: InstanceType<typeof BrokerRegistration.Model>) => x.toObject({ versionKey: false }))
            });
        } catch (e) {
            return next(new HttpException(INTERNAL_SERVER_ERROR, `Failed to retrieve Broker Registrations from database: ${e.message}`, e));
        }
    }

    public async registerBroker(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const brokerData: BrokerRegistration = req.body;
        if (!brokerData.host) {
            return next(new HttpException(BAD_REQUEST, 'Missing required property: "host"'));
        }

        const ngsiClient = new NgsiClient(brokerData.host);

        // Create subscription in the Broker to be notififed about any changes to IoTStream entities
        try {
            const subscription = await ngsiClient.createSubscription('stream', IotStreamType, [generatedByPropName, hasQualityPropName]);
            brokerData.streamSubscriptionId = subscription.id;
        } catch (e) {
            const msg = `Failed to subscribe to Stream notifications from the broker: ${e.message}`;
            console.error(msg);
            return next(new HttpException(INTERNAL_SERVER_ERROR, msg, e));
        }

        // Create subscription in the Broker to be notififed about any changes to Sensor entities
        try {
            const subscription = await ngsiClient.createSubscription('sensor', SensorType, ['location', locationPropName, observesPropName]);
            brokerData.sensorSubscriptionId = subscription.id;
        } catch (e) {
            const msg = `Failed to subscribe to Sensor notifications from the broker: ${e.message}`;
            console.error(msg);
            try { await ngsiClient.deleteSubscription(brokerData.streamSubscriptionId); } catch { /* Ignore Errors */ }
            return next(new HttpException(INTERNAL_SERVER_ERROR, msg, e));
        }

        // Create subscription in the Broker to be notififed about any changes to Quality entities
        try {
            const subscription = await ngsiClient.createSubscription('qoi', QualityType);
            brokerData.qoiSubscriptionId = subscription.id;
        } catch (e) {
            const msg = `Failed to subscribe to QoI notifications from the broker: ${e.message}`;
            console.error(msg);
            try { await ngsiClient.deleteSubscription(brokerData.streamSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.sensorSubscriptionId) } catch { /* Ignore Errors */ };
            return next(new HttpException(INTERNAL_SERVER_ERROR, msg, e));
        }

        // Create subscription in the Broker to be notififed about any changes to Point entities
        try {
            const subscription = await ngsiClient.createSubscription('point', PointType, [relativeLocationPropName]);
            brokerData.pointSubscriptionId = subscription.id;
        } catch (e) {
            const msg = `Failed to subscribe to Point notifications from the broker: ${e.message}`;
            console.error(msg);

            try { await ngsiClient.deleteSubscription(brokerData.streamSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.sensorSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.qoiSubscriptionId) } catch { /* Ignore Errors */ };

            return next(new HttpException(INTERNAL_SERVER_ERROR, msg, e));
        }

        // Save the registration in the database
        try {
            const broker = new BrokerRegistration.Model(brokerData);
            const result = await broker.save();

            res.status(CREATED)
                .location(`${req.originalUrl}/${result.id}`)
                .json(result.toObject({ versionKey: false }));
        } catch (e) {
            const msg = `Failed to create Broker Registration in the database: ${e.message}`;
            console.error(msg);
            try { await ngsiClient.deleteSubscription(brokerData.streamSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.sensorSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.qoiSubscriptionId) } catch { /* Ignore Errors */ };
            try { await ngsiClient.deleteSubscription(brokerData.pointSubscriptionId) } catch { /* Ignore Errors */ };
            return next(new HttpException(INTERNAL_SERVER_ERROR, msg, e));
        }

        // TODO Retrieve Initial data from the broker

    }

    public async getBrokerRegistration(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpException(BAD_REQUEST, `Requested 'id' is inavalid`));
        }
        const id = mongoose.Types.ObjectId(req.params.id);

        try {
            const broker = await BrokerRegistration.Model.findById(id).exec();
            if (!broker) {
                return next(new HttpException(NOT_FOUND, `Broker registration with id='${id}' does not exist`));
            }

            res.status(OK).json(broker.toObject({ versionKey: false }));
        } catch (e) {
            return next(new HttpException(INTERNAL_SERVER_ERROR, `Failed to retrieve Broker Registration from database: ${e.message}`, e));
        }
    }

    public async unregisterBroker(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpException(BAD_REQUEST, `Requested 'id' is inavalid`));
        }
        const id = mongoose.Types.ObjectId(req.params.id);

        // Retrieve BrokerRegistration and delete a subscription from the broker
        try {
            const broker = await BrokerRegistration.Model.findById(id).exec();
            if (!broker) {
                return next(new HttpException(NOT_FOUND, `Broker registration with id='${id}' does not exist`));
            }

            const ngsiClient = new NgsiClient(broker.host);
            await Promise.all([
                ngsiClient.deleteSubscription(broker.streamSubscriptionId),
                ngsiClient.deleteSubscription(broker.sensorSubscriptionId),
                ngsiClient.deleteSubscription(broker.qoiSubscriptionId),
                ngsiClient.deleteSubscription(broker.pointSubscriptionId)
            ]);
        } catch (e) {
            return next(new HttpException(INTERNAL_SERVER_ERROR, `Failed to delete subscription from the broker: ${e.message}`, e));
        }

        // Delete Brokerregistration from DB
        try {
            await BrokerRegistration.Model.deleteOne({ _id: id }).exec();
            res.sendStatus(NO_CONTENT);
        } catch (e) {
            return next(new HttpException(INTERNAL_SERVER_ERROR, `Failed to delete Broker Registration from database: ${e.message}`, e));
        }
    }
}
