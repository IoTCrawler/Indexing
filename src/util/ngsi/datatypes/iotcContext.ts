import * as jsonLD from './jsonLD'
import { contextProp } from './context';
import { QualityType, IotStreamType, SensorType, relativeLocationPropName, observesPropName, generatedByPropName, hasQualityPropName } from '../../iotObjects/ontology';
import { PointType } from '../../clients/ngsiObjects/geoJson';

export const IotcContext: jsonLD.WithContext = {
    [contextProp]: {
        'iot-stream': 'http://purl.org/iot/ontology/iot-stream#',
        sosa: 'http://www.w3.org/ns/sosa/',
        'iot-lite': 'https://www.w3.org/Submission/iot-lite/#term_',
        geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
        qoi: 'https://w3id.org/iot/qoi#',

        Point: PointType,
        Sensor: SensorType,
        IotStream: IotStreamType,
        Quality: QualityType,

        relativeLocation: relativeLocationPropName,

        observes: {
            [jsonLD.typeProp]: jsonLD.idProp,
            [jsonLD.idProp]: observesPropName
        },

        generatedBy: {
            [jsonLD.typeProp]: jsonLD.idProp,
            [jsonLD.idProp]: generatedByPropName
        },
        hasQuality: {
            [jsonLD.typeProp]: jsonLD.idProp,
            [jsonLD.idProp]: hasQualityPropName
        }
    }
}
