// Controller to handle notifications from Orion broker
// APIs should be passed as a callback to the Orion broker
import * as express from 'express';
import { OK, NOT_FOUND } from 'http-status-codes';
import { Controller } from '../util/Controller';
import { Notification } from '../util/clients/ngsiObjects/ngsiNotification';
import { PointType, SensorType } from "../util/iotObjects/ontology";
import { Sensor, SensorType as SensorT } from '../util/iotObjects/sensor';
import { Point } from '../util/iotObjects/point';
import { NgsiClient } from '../util/clients/ngsiClient';
import { BrokerRegistration } from '../models/brokerRegistration';
import { HttpException } from '../util/errorMiddleware';
import { CachedPoint } from '../models/cachedPoint';
import { getCountry } from '../util/geoHelpers';
import { IndexedSensor } from '../models/indexedSensor';
import { UnlocatedSensor } from '../models/unlocatedSensor';
import { Entity } from '../util/clients/ngsiObjects/ngsiEntity';

export class NotificationController implements Controller {
    public readonly path = '/notification';
    public readonly router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    private intializeRoutes(): void {
        this.router.all(`${this.path}`, this.handleNotification.bind(this));
    }

    /// Current implementation does not support updating point locations.
    /// Create a new point and update the sensor to reference the new point instead.
    public async handleNotification(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {       
        const notification: Notification = req.body;
        let sensors: SensorT[] = [];
        const points: Point[] = [];

        // Parse data
        for (const entity of ([] as Entity[]).concat(notification.data)) {
            switch (entity.type) {
                case PointType:
                    points.push(new Point(entity));
                    break;
                case SensorType:
                    sensors.push(new Sensor(entity));
                    break;
                default:
                    console.error(`Unrecognized entity type: ${entity.type}`);
            }
        }

        // If update contains points, add Unlocated Sensors to the indexing request
        if (points.length > 0) {
            const newPointIds = points.map(p => p.id);
            const unlocatedSensors = await UnlocatedSensor.Model.find({ location: { $in: newPointIds } }).exec();
            sensors = sensors.concat(unlocatedSensors);
            await UnlocatedSensor.Model.deleteMany({ location: { $in: newPointIds } });
        }

        // Try to retrieve necessary points from cache
        const updateChachedPointsTask = this.UpdateCachedPoints(points);
        let missingPointIds = sensors.map(s => s.location).filter(loc => points.find(p => p.id === loc) === undefined);
        const getCachedPointsTask = await CachedPoint.Model.find({ pointId: { $in: missingPointIds } }).exec();

        const cachedPointsResult = await Promise.all([updateChachedPointsTask, getCachedPointsTask]);
        let cachedPoints = cachedPointsResult[0].concat(cachedPointsResult[1]);

        // Try to retrieve missing points from NGSI broker
        try {
            missingPointIds = missingPointIds.filter(loc => cachedPointsResult[1].find(p => p.pointId === loc) === undefined);
            if (missingPointIds.length > 0) {
                const broker = await BrokerRegistration.Model.findOne({ subscriptionId: notification.subscriptionId }).exec();
                if (!broker) {
                    return next(new HttpException(NOT_FOUND, `Subsctiption not found: ${notification.subscriptionId}`))
                }
                
                const client = new NgsiClient(broker);
                await client.auth();

                const missingPoints = await client.getPoints(missingPointIds);
                const missingPointInsertResult = await this.UpdateCachedPoints(missingPoints);
                cachedPoints = cachedPoints.concat(missingPointInsertResult);
            }
        } catch (e) {
            console.error(`Failed to get missing points from the broker: ${e.message}`);
        }

        // Add sensors to the index
        const sensorIndex = sensors.map(s => {
            const point = cachedPoints.find(p => s.location === p.pointId);
            return point ? new IndexedSensor.Model({
                sensorId: s.id,
                countryISO: point.countryISO,
                geoPartitionKey: point.geoPartitionKey,
                location: point.location,
                type: s.quantityKind.slice('urn:ngsi-ld:QuantityKind:'.length)
            }) : undefined;
        });

        const updateIndexTask = sensorIndex.map(async s => s && await IndexedSensor.Model.updateOne({
            countryISO: s.countryISO,
            geoPartitionKey: s.geoPartitionKey,
            sensorId: s.sensorId
        }, s, { upsert: true }).exec());
        
        // Save sensors with no corresponding points to the Unlocated Sensor collection until the point becomes available
        const unlocatedSensors = sensors.filter(s => cachedPoints.find(p => p.pointId === s.location) === undefined).map(s => new UnlocatedSensor.Model({
            id: s.id,
            location: s.location,
            quantityKind: s.quantityKind
        }));
        const saveUnlocatedSensorsTask = UnlocatedSensor.Model.insertMany(unlocatedSensors);

        await Promise.all([updateIndexTask, saveUnlocatedSensorsTask]);

        res.status(OK).json({});
    }

    private async UpdateCachedPoints(points: Point[]): Promise<CachedPoint[]> {
        if (points.length === 0) {
            return [];
        }

        const pointsToAdd = await Promise.all(points.map(async p => new CachedPoint.Model({
            pointId: p.id,
            location: p.location,
            countryISO: await getCountry(p.location.coordinates)
        })));
        await CachedPoint.Model.deleteMany({ pointId: { $in: pointsToAdd.map(p => p.pointId) } });
        await CachedPoint.Model.insertMany(pointsToAdd, { ordered: false })

        return pointsToAdd;
    }
}
