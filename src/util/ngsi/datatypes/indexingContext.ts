import * as jsonLD from './jsonLD'
import { contextProp } from './context';
import { QualityType, IotStreamType, SensorType, relativeLocationPropName, locationPropName, observesPropName, generatedByPropName, hasQualityPropName } from '../../iotObjects/ontology';
import { PointType } from '../../clients/ngsiObjects/geoJson';

export const IndexingContext: jsonLD.WithContext = {
    [contextProp]: {
        Point: PointType,
        Sensor: SensorType,
        IotStream: IotStreamType,
        Quality: QualityType,

        relativeLocation: relativeLocationPropName,

        metaLocation: {
            [jsonLD.typeProp]: jsonLD.idProp,
            [jsonLD.idProp]: locationPropName
        },
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
