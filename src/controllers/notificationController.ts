// Controller to handle notifications from NGSI-LD broker
// APIs should be passed as a callback to the NGSI-LD broker
import * as express from 'express';
import { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { Controller } from '../util/Controller';
import { Notification } from '../util/clients/ngsiObjects/ngsiNotification';
import { PointType, SensorType, QualityType, IotStreamType } from "../util/iotObjects/ontology";
import { Sensor } from '../util/iotObjects/sensor';
import { Point } from '../util/iotObjects/point';
import { Entity } from '../util/clients/ngsiObjects/ngsiEntity';
import { IotStream } from '../util/iotObjects/iotStream';
import { Quality } from '../util/iotObjects/quality';
import { HttpException } from '../util/errorMiddleware';
import { UnmatchedQuality } from '../models/unmatchedQuality';
import { UnmatchedSensor } from '../models/unmatchedSensor';
import { IndexedIotStream } from '../models/indexedIotStream';
import { getCountry } from '../util/geoHelpers';
import { UnmatchedPoint } from '../models/unmatchedPoint';
import { QoiMapping } from '../models/qoiMapping';
import { PointMapping } from '../models/pointMapping';
import { UnlocatedIotStream } from '../models/unlocatedIotStream';
import { StreamMapping } from '../models/streamMapping';

export class NotificationController implements Controller {
    public readonly path = '/notification';
    public readonly router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    private intializeRoutes(): void {
        this.router.all(`${this.path}/stream`, this.handleStreamNotification.bind(this));
        this.router.all(`${this.path}/sensor`, this.handleSensorNotification.bind(this));
        this.router.all(`${this.path}/qoi`, this.handleQoiNotification.bind(this));
        this.router.all(`${this.path}/point`, this.handlePointNotification.bind(this));
    }

    public async handleStreamNotification(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const streams: IotStream[] = [];
        if (req.body.data) {
            const notification: Notification = req.body;

            // Parse data
            for (const entity of ([] as Entity[]).concat(notification.data)) {
                switch (entity.type) {
                    case IotStreamType:
                        streams.push(new IotStream(entity));
                        break;
                    default:
                        console.error(`Unrecognized entity type: ${entity.type}`);
                }
            }
        } else {
            streams.push(new IotStream(req.body));
        }

        if (streams.length === 0) {
            return next(new HttpException(BAD_REQUEST, `Notification should only contain entities with type='${IotStreamType}'`));
        }

        try {
            await this.addStreamsToIndex(streams);
        } catch (e) {
            return next(e);
        }

        res.status(OK).json({});
    }

    public async handleSensorNotification(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const sensors: Sensor[] = [];

        if (req.body.data) {
            const notification: Notification = req.body;

            // Parse data
            for (const entity of ([] as Entity[]).concat(notification.data)) {
                switch (entity.type) {
                    case SensorType:
                        sensors.push(new Sensor(entity));
                        break;
                    default:
                        console.error(`Unrecognized entity type: ${entity.type}`);
                }
            }
        } else {
            sensors.push(new Sensor(req.body));
        }

        if (sensors.length === 0) {
            return next(new HttpException(BAD_REQUEST, `Notification should only contain entities with type='${SensorType}'`));
        }

        // Get Unmatched points for new Sensors
        const getStreamMappingsTask = StreamMapping.Model.find({ sensorId: { $in: sensors.map(s => s.id) } }).exec();
        const getUnmatchedPointsTask = (async (): Promise<InstanceType<typeof UnmatchedPoint.Model>[]> => {
            if (sensors.length === 1) {
                if (!sensors[0].metaLocation) { return [] }

                const result = await UnmatchedPoint.Model.findOneAndDelete({ _id: sensors[0].metaLocation }).exec();
                return result ? [result] : [];
            }

            const result = await UnmatchedPoint.Model.find({ _id: { $in: sensors.map(s => s.metaLocation) } }).exec();
            if (result.length > 0) {
                try {
                    await UnmatchedPoint.Model.deleteMany({ _id: { $in: result.map(s => s._id) } }).exec();
                } catch (e) {
                    console.error(`Failed to delete unmatched points: ${e.message}`);
                }
            }
            return result;
        })();
        const getUnlocatedStreamsTask = (async (): Promise<InstanceType<typeof UnlocatedIotStream.Model>[]> => {
            const result = await UnlocatedIotStream.Model.find({ generatedBy: { $in: sensors.map(s => s.id) } }).exec();
            if (result.length > 0) {
                try {
                    await UnlocatedIotStream.Model.deleteMany({ _id: { $in: result.map(s => s._id) } }).exec();
                } catch (e) {
                    console.error(`Failed to delete unlocated streams: ${e.message}`);
                }
            }
            return result;
        })();

        // Get Geo Partitioning data
        const sensorDocs = await Promise.all(sensors.map(async s => new UnmatchedSensor.Model({
            _id: s.id,
            countryISO: await getCountry(s.location),
            location: s.location,
            metaLocation: s.metaLocation ? {
                _id: s.metaLocation
            } : undefined,
            observes: s.observes
        })));

        let points: InstanceType<typeof UnmatchedPoint.Model>[];
        let streamMappings: InstanceType<typeof StreamMapping.Model>[];
        try {
            const result = await Promise.all([getUnmatchedPointsTask, getStreamMappingsTask]);
            points = result[0];
            streamMappings = result[1];
        } catch (e) {
            console.error(`Failed to get related entities: ${e}`);
            points = [];
            streamMappings = [];
        }

        // Update indexed/unmatched sensors
        await Promise.all(sensorDocs.map(async s => {
            let updateDoc: unknown = {
                'generatedBy.location': s.location,
                'generatedBy.observes': s.observes
            };

            if (s.metaLocation) {
                updateDoc = {
                    ...updateDoc,
                    'generatedBy.metaLocation._id': s.metaLocation._id
                }
            }

            // Find stream mapping 
            const streamMapping = streamMappings.find(m => m.sensorId === s.id);

            // Update indexed Sensor
            if (streamMapping) {
                const updateIndexTask = IndexedIotStream.Model.updateOne({
                    countryISO: streamMapping.countryISO,
                    geoPartitionKey: streamMapping.geoPartitionKey,
                    'generatedBy._id': s.id
                }, { $set: updateDoc }).exec();

                // If geo partition has changed, update all mappings
                if (streamMapping.countryISO !== s.countryISO || streamMapping.geoPartitionKey !== s.geoPartitionKey) {
                    await Promise.all([
                        StreamMapping.Model.updateOne({
                            sensorId: s.id
                        }, {
                            $set: {
                                countryISO: s.countryISO,
                                geoPartitionKey: s.geoPartitionKey
                            }
                        }).exec(),
                        QoiMapping.Model.updateOne({
                            sensorId: s.id
                        }, {
                            $set: {
                                countryISO: s.countryISO,
                                geoPartitionKey: s.geoPartitionKey
                            }
                        }).exec(),
                        PointMapping.Model.updateOne({
                            sensorId: s.id
                        }, {
                            $set: {
                                countryISO: s.countryISO,
                                geoPartitionKey: s.geoPartitionKey
                            }
                        }).exec()
                    ]);
                }

                // Wait for index to complete the update
                await updateIndexTask;
                return;
            }

            // This is a new Sensor,  add sensor to UnmatchedSensor collection
            // if there is a matching Unlocated Stream, it will be processed later
            updateDoc = {
                countryISO: s.countryISO,
                geoPartitionKey: s.geoPartitionKey,
                location: s.location,
                observes: s.observes,
            };

            if (s.metaLocation) {
                updateDoc = {
                    ...updateDoc,
                    'metaLocation._id': s.metaLocation._id
                };

                //-- Find a realted point, and add to the sensor
                const point = points.find(p => s.metaLocation!._id === p._id); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                if (point) {
                    updateDoc = {
                        ...updateDoc,
                        'metaLocation.relativeLocation': s.metaLocation.relativeLocation
                    };
                }
            }

            await UnmatchedSensor.Model.updateOne({
                _id: s.id
            }, {
                $setOnInsert: { _id: s.id },
                $set: updateDoc
            }, { upsert: true }).exec();
        }));

        // Process Unlocated Streams
        try {
            const streams = await getUnlocatedStreamsTask;
            if (streams.length > 0) {
                await this.addStreamsToIndex(streams.map(s => ({
                    id: s.id,
                    generatedBy: s.generatedBy,
                    hasQuality: s.hasQuality
                })));
            }
        } catch (e) {
            return next(e);
        }

        res.status(OK).json({});
    }

    public async handleQoiNotification(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const qualityEntities: Quality[] = [];

        if (req.body.data) {
            const notification: Notification = req.body;

            // Parse data
            for (const entity of ([] as Entity[]).concat(notification.data)) {
                switch (entity.type) {
                    case QualityType:
                        qualityEntities.push(new Quality(entity));
                        break;
                    default:
                        console.error(`Unrecognized entity type: ${entity.type}`);
                }
            }
        } else {
            qualityEntities.push(new Quality(req.body));
        }

        if (qualityEntities.length === 0) {
            return next(new HttpException(BAD_REQUEST, `Notification should only contain entities with type='${QualityType}'`));
        }

        const mappings = await QoiMapping.Model.find({ _id: { $in: qualityEntities.map(q => q.id) } }).exec();
        await Promise.all(qualityEntities.map(async qoi => {
            const mapping = mappings.find(m => qoi.id === m.id);

            // If related stream is indexed, update index
            if (mapping) {
                await IndexedIotStream.Model.updateOne({
                    countryISO: mapping.countryISO,
                    geoPartitionKey: mapping.geoPartitionKey,
                    'hasQuality._id': qoi.id
                }, {
                    $set: {
                        hasQuality: {
                            ...qoi.props,
                            _id: qoi.id
                        }
                    }
                }).exec();

                return;
            }

            // Stream is not indexed, store QoI in unmatched collection
            await UnmatchedQuality.Model.updateOne({
                _id: qoi.id
            }, {
                $setOnInsert: {
                    _id: qoi.id
                },
                $set: {
                    ...qoi.props
                }
            }, { upsert: true }).exec();
        }));

        res.status(OK).json({});
    }

    public async handlePointNotification(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const points: Point[] = [];

        if (req.body.data) {
            const notification: Notification = req.body;

            // Parse data
            for (const entity of ([] as Entity[]).concat(notification.data)) {
                switch (entity.type) {
                    case PointType:
                        points.push(new Point(entity));
                        break;
                    default:
                        console.error(`Unrecognized entity type: ${entity.type}`);
                }
            }
        } else {
            points.push(new Point(req.body));
        }

        if (points.length === 0) {
            return next(new HttpException(BAD_REQUEST, `Notification should only contain entities with type='${PointType}'`));
        }

        const mappings = await PointMapping.Model.find({ _id: { $in: points.map(p => p.id) } }).exec();
        await Promise.all(points.map(async point => {
            const mapping = mappings.find(m => point.id === m.id);

            // If related stream is indexed, update index
            if (mapping) {
                await IndexedIotStream.Model.updateOne({
                    countryISO: mapping.countryISO,
                    geoPartitionKey: mapping.geoPartitionKey,
                    'generatedBy.metaLocation._id': point.id
                }, {
                    $set: {
                        'generatedBy.metaLocation.relativeLocation': point.relativeLocation
                    }
                }).exec();

                return;
            }

            // Stream is not indexed, try to find a related sensor
            const result = await UnmatchedSensor.Model.updateOne({
                'metaLocation._id': point.id
            }, {
                $set: {
                    'metaLocation.relativeLocation': point.relativeLocation
                }
            }).exec();

            if (result.n > 0) { return; }

            // Stream is not indexed and no matching sensor exist - store Point in unmatched collection
            await UnmatchedPoint.Model.updateOne({
                _id: point.id
            }, {
                $setOnInsert: {
                    _id: point.id
                },
                $set: {
                    relativeLocation: point.relativeLocation
                }
            }, { upsert: true }).exec();
        }));

        res.status(OK).json({});
    }

    private async addStreamsToIndex(streams: Omit<IotStream, 'type' | '@context'>[]): Promise<void> {
        if (streams.length === 0) { return; }

        // Get related entities
        const getQualityEntitiesTask = (async (): Promise<InstanceType<typeof UnmatchedQuality.Model>[]> => {
            if (streams.length === 1) {
                if (!streams[0].hasQuality) { return [] }

                const result = await UnmatchedQuality.Model.findOneAndDelete({ _id: streams[0].hasQuality }).exec();
                return result ? [result] : [];
            }

            const result = await UnmatchedQuality.Model.find({ _id: { $in: streams.map(s => s.hasQuality).filter(x => x) } }).exec();
            if (result.length > 0) {
                try {
                    await UnmatchedQuality.Model.deleteMany({ _id: { $in: result.map(q => q._id) } }).exec();
                } catch (e) {
                    console.error(`Failed to delete unmatched QoI: ${e.message}`);
                }
            }
            return result;
        })();
        const getSensorsTask = (async (): Promise<InstanceType<typeof UnmatchedSensor.Model>[]> => {
            if (streams.length === 1) {
                const result = await UnmatchedSensor.Model.findOneAndDelete({ _id: streams[0].generatedBy }).exec();
                return result ? [result] : [];
            }

            const result = await UnmatchedSensor.Model.find({ _id: { $in: streams.map(s => s.generatedBy) } }).exec();
            if (result.length > 0) {
                try {
                    await UnmatchedSensor.Model.deleteMany({ _id: { $in: result.map(s => s.id) } }).exec();
                } catch (e) {
                    console.error(`Failed to delete unmatched sensors: ${e.message}`);
                }
            }
            return result;
        })();
        const getStreamMappingsTask = StreamMapping.Model.find({ _id: { $in: streams.map(s => s.id) } }).exec();

        let qualityEntities: InstanceType<typeof UnmatchedQuality.Model>[];
        let sensors: InstanceType<typeof UnmatchedSensor.Model>[];
        let streamMappings: InstanceType<typeof StreamMapping.Model>[];
        try {
            const result = await Promise.all([getQualityEntitiesTask, getSensorsTask, getStreamMappingsTask]);
            qualityEntities = result[0];
            sensors = result[1];
            streamMappings = result[2];
        } catch (e) {
            const msg = 'Failed to retrieve QoI or Sensors related to one of the requested IotStreams'
            console.error(`${msg}: ${e.message}`);
            throw new HttpException(INTERNAL_SERVER_ERROR, msg, e);
        }

        // Add Streams to the index
        await Promise.all(streams.map(async stream => {
            // Find related entities for this stream
            const qoi = stream.hasQuality ? qualityEntities.find(q => stream.hasQuality === q.id) : undefined;
            const sensor = sensors.find(s => stream.generatedBy === s.id);
            const streamMapping = streamMappings.find(m => stream.id === m.id);

            // If stream alrady indexed - update index
            if (streamMapping) {
                let indexUpdateObject: { [prop: string]: unknown } | undefined = undefined;
                let qoiMappingUpdateObject: { [prop: string]: unknown } | undefined = undefined;
                let upsertQoI = false;

                const oldStream = (await IndexedIotStream.Model.findOne({ // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    countryISO: streamMapping.countryISO,
                    geoPartitionKey: streamMapping.geoPartitionKey,
                    _id: stream.id
                }).exec())!;

                // Related sensor changed, need to update geo partitioning or remove stream from index if sensor does not exist
                if (stream.generatedBy !== oldStream.generatedBy._id) {
                    // Remove stream and associated mappings from index
                    if (!sensor) {
                        const oldStream = (await IndexedIotStream.Model.findOneAndDelete({ // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            countryISO: streamMapping.countryISO,
                            geoPartitionKey: streamMapping.geoPartitionKey,
                            _id: stream.id
                        }).exec())!;

                        const updateTasks: Promise<unknown>[] = [
                            IndexedIotStream.Model.deleteOne({
                                countryISO: streamMapping.countryISO,
                                geoPartitionKey: streamMapping.geoPartitionKey,
                                _id: stream.id
                            }).exec(),
                            new UnmatchedSensor.Model({ ...oldStream.generatedBy }).save(),
                            StreamMapping.Model.deleteOne({ _id: oldStream.id }).exec()
                        ];

                        // If old stream has metaLocation, delete the mapping
                        if (oldStream.generatedBy.metaLocation) {
                            updateTasks.push(PointMapping.Model.deleteOne({ _id: oldStream.generatedBy.metaLocation._id }).exec());
                        }

                        // If old stream had QoI, add it to unmatched QoI and delete the mapping
                        if (oldStream.hasQuality) {
                            updateTasks.push(QoiMapping.Model.deleteOne({ _id: oldStream.hasQuality._id }).exec());

                            if (Object.keys(oldStream.hasQuality).length > 1) {
                                updateTasks.push(new UnmatchedQuality.Model({ ...oldStream.hasQuality }).save());
                            }
                        } else if (qoi) {
                            updateTasks.push(qoi.save());
                        }

                        // Wait for update to complete
                        await Promise.all(updateTasks);
                        return;
                    }

                    // Update related sensor information in the index
                    indexUpdateObject = {
                        $set: {
                            countryISO: sensor.countryISO,
                            geoPartitionKey: sensor.geoPartitionKey,
                            generatedBy: {
                                _id: sensor.id,
                                location: sensor.location,
                                metaLocation: sensor.metaLocation,
                                observes: sensor.observes
                            }
                        }
                    };

                    // Update QoI mapping
                    if (stream.hasQuality) {
                        qoiMappingUpdateObject = {
                            $set: {
                                countryISO: sensor.countryISO,
                                geoPartitionKey: sensor.geoPartitionKey,
                                sensorId: sensor.id
                            }
                        };
                    }

                    // Uodate stream mapping
                    const updateTasks = [
                        StreamMapping.Model.updateOne({ sensorId: streamMapping.sensorId }, {
                            $set: {
                                countryISO: sensor.countryISO,
                                geoPartitionKey: sensor.geoPartitionKey,
                                sensorId: sensor.id
                            }
                        }).exec()
                    ];

                    // Add point mapping for new Sensor
                    if (sensor.metaLocation) {
                        updateTasks.push(new PointMapping.Model({
                            _id: sensor.metaLocation._id,
                            countryISO: sensor.countryISO,
                            geoPartitionKey: sensor.geoPartitionKey,
                            sensorId: sensor.id
                        }).save());
                    }

                    // Delete old Point mapping
                    if (oldStream.generatedBy.metaLocation) {
                        updateTasks.push(PointMapping.Model.deleteOne({ sensorId: streamMapping.sensorId }).exec());
                    }

                    // Save old sensor to unmatched collection
                    updateTasks.push(new UnmatchedSensor.Model({
                        ...oldStream.generatedBy,
                        countryISO: oldStream.countryISO,
                        geoPartitionKey: oldStream.geoPartitionKey
                    }).save());

                    // Wait for updates to complete
                    await Promise.all(updateTasks);
                }

                // Related Quality changed - update index and mapping and store old Quality to unmatched collection
                if (stream.hasQuality !== (oldStream.hasQuality && oldStream.hasQuality._id)) {
                    if (!stream.hasQuality) {
                        indexUpdateObject = {
                            ...indexUpdateObject,
                            $unset: { hasQuality: "" }
                        }
                    } else {
                        indexUpdateObject = {
                            ...indexUpdateObject
                        };
                        (indexUpdateObject.$set as { hasQuality: unknown }).hasQuality = qoi ? qoi.toObject({ versionKey: false }) : { _id: stream.hasQuality }
                    }

                    const updateTasks: Promise<unknown>[] = []

                    // Delete old QoI mapping
                    if (oldStream.hasQuality) {
                        updateTasks.push(QoiMapping.Model.deleteOne({ _id: oldStream.hasQuality._id }).exec());

                        // Store old QoI in unmatched collection
                        if (Object.keys(oldStream.hasQuality).length > 1) {
                            updateTasks.push(new UnmatchedQuality.Model({ ...oldStream.hasQuality }).save());
                        }
                    }

                    // Add new QoI mapping
                    if (stream.hasQuality) {
                        qoiMappingUpdateObject = qoiMappingUpdateObject ? {
                            ...qoiMappingUpdateObject,
                            $setOnInsert: {
                                _id: stream.hasQuality
                            }
                        } : {
                                $setOnInsert: {
                                    _id: stream.hasQuality
                                },
                                $set: {
                                    countryISO: streamMapping.countryISO,
                                    geoPartitionKey: streamMapping.geoPartitionKey,
                                    sensorId: streamMapping.sensorId
                                }
                            };
                        upsertQoI = true;
                    }

                    await Promise.all(updateTasks);
                }

                const updateTasks: Promise<unknown>[] = [];
                if (indexUpdateObject) {
                    updateTasks.push(IndexedIotStream.Model.updateOne({
                        countryISO: streamMapping.countryISO,
                        geoPartitionKey: streamMapping.geoPartitionKey,
                        _id: streamMapping.id
                    }, indexUpdateObject).exec());
                }

                if (qoiMappingUpdateObject) {
                    updateTasks.push(QoiMapping.Model.updateOne({
                        sensorId: stream.hasQuality
                    }, qoiMappingUpdateObject, { upsert: upsertQoI }).exec())
                }

                await Promise.all(updateTasks);
                return;
            }

            // Stream is not indexed yet, but a matching sensor is found - add stream to the index
            if (sensor) {
                const updateTasks: Promise<unknown>[] = [
                    new IndexedIotStream.Model({
                        _id: stream.id,
                        countryISO: sensor.countryISO,
                        geoPartitionKey: sensor.geoPartitionKey,
                        generatedBy: { // sosa:Sensor
                            _id: stream.generatedBy,
                            location: sensor.location,
                            metaLocation: sensor.metaLocation,
                            observes: sensor.observes
                        },
                        hasQuality: stream.hasQuality ? {
                            ...((qoi && qoi.toObject({ versionKey: false })) || {}),
                            _id: stream.hasQuality
                        } : undefined
                    }).save(),
                    new StreamMapping.Model({
                        _id: stream.id,
                        countryISO: sensor.countryISO,
                        geoPartitionKey: sensor.geoPartitionKey,
                        sensorId: sensor.id
                    }).save()
                ];

                // Add QoI mapping
                if (stream.hasQuality) {
                    updateTasks.push(new QoiMapping.Model({
                        _id: stream.hasQuality,
                        countryISO: sensor.countryISO,
                        geoPartitionKey: sensor.geoPartitionKey,
                        sensorId: sensor.id
                    }).save());
                }

                // Add Point mapping
                if (sensor.metaLocation) {
                    updateTasks.push(new PointMapping.Model({
                        _id: sensor.metaLocation._id,
                        countryISO: sensor.countryISO,
                        geoPartitionKey: sensor.geoPartitionKey,
                        sensorId: sensor.id
                    }).save());
                }

                await Promise.all(updateTasks);
                return;
            }

            // Stream in not indexed and no matching sensor found - store stream in unlocated collection
            await UnlocatedIotStream.Model.updateOne({
                _id: stream.id
            }, {
                $setOnInsert: {
                    _id: stream.id
                },
                $set: {
                    generatedBy: stream.generatedBy,
                    hasQuality: stream.hasQuality
                }
            }, { upsert: true }).exec();
        }));
    }
}
