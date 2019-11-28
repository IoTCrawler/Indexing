import * as jsonLD from './jsonLD'
import { contextProp } from './context';

const ngsiLDPrefix = 'https://uri.etsi.org/ngsi-ld/';

export const CoreContextLocation = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';

export const CoreContext: jsonLD.WithContext = {
    [contextProp]: {
        'ngsi-ld': ngsiLDPrefix,
        id: jsonLD.idProp,
        type: jsonLD.typeProp,
        value: `${ngsiLDPrefix}hasValue`,
        object: {
            [jsonLD.idProp]: `${ngsiLDPrefix}hasObject`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        Property: `${ngsiLDPrefix}Property`,
        Relationship: `${ngsiLDPrefix}Relationship`,
        DateTime: `${ngsiLDPrefix}DateTime`,
        Date: `${ngsiLDPrefix}Date`,
        Time: `${ngsiLDPrefix}Time`,
        createdAt: {
            [jsonLD.idProp]: `${ngsiLDPrefix}createdAt`,
            [jsonLD.typeProp]: 'DateTime'
        },
        modifiedAt: {
            [jsonLD.idProp]: `${ngsiLDPrefix}modifiedAt`,
            [jsonLD.typeProp]: 'DateTime'
        },
        observedAt: {
            [jsonLD.idProp]: `${ngsiLDPrefix}observedAt`,
            [jsonLD.typeProp]: 'DateTime'
        },
        datasetId: {
            [jsonLD.idProp]: `${ngsiLDPrefix}datasetId`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        instanceId: {
            [jsonLD.idProp]: `${ngsiLDPrefix}instanceId`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        unitCode: `${ngsiLDPrefix}unitCode`,
        location: `${ngsiLDPrefix}location`,
        observationSpace: `${ngsiLDPrefix}observationSpace`,
        operationSpace: `${ngsiLDPrefix}operationSpace`,
        GeoProperty: `${ngsiLDPrefix}GeoProperty`,
        TemporalProperty: `${ngsiLDPrefix}TemporalProperty`,
        ContextSourceRegistration: `${ngsiLDPrefix}ContextSourceRegistration`,
        Subscription: `${ngsiLDPrefix}Subscription`,
        Notification: `${ngsiLDPrefix}Notification`,
        ContextSourceNotification: `${ngsiLDPrefix}ContextSourceNotification`,
        title: `${ngsiLDPrefix}title`,
        detail: `${ngsiLDPrefix}detail`,
        idPattern: `${ngsiLDPrefix}idPattern`,
        name: `${ngsiLDPrefix}name`,
        description: `${ngsiLDPrefix}description`,
        information: `${ngsiLDPrefix}information`,
        observationInterval: `${ngsiLDPrefix}observationInterval`,
        managementInterval: `${ngsiLDPrefix}managementInterval`,
        expires: {
            [jsonLD.idProp]: `${ngsiLDPrefix}expires`,
            [jsonLD.typeProp]: 'DateTime'
        },
        endpoint: `${ngsiLDPrefix}endpoint`,
        entities: `${ngsiLDPrefix}entities`,
        properties: {
            [jsonLD.idProp]: `${ngsiLDPrefix}properties`,
            [jsonLD.typeProp]: jsonLD.vocabProp
        },
        relationships: {
            [jsonLD.idProp]: `${ngsiLDPrefix}relationships`,
            [jsonLD.typeProp]: jsonLD.vocabProp
        },
        start: {
            [jsonLD.idProp]: `${ngsiLDPrefix}start`,
            [jsonLD.typeProp]: 'DateTime'
        },
        end: {
            [jsonLD.idProp]: `${ngsiLDPrefix}end`,
            [jsonLD.typeProp]: 'DateTime'
        },
        watchedAttributes: {
            [jsonLD.idProp]: `${ngsiLDPrefix}watchedAttributes`,
            [jsonLD.typeProp]: jsonLD.vocabProp
        },
        timeInterval: `${ngsiLDPrefix}timeInterval`,
        q: `${ngsiLDPrefix}q`,
        geoQ: `${ngsiLDPrefix}geoQ`,
        csf: `${ngsiLDPrefix}csf`,
        isActive: `${ngsiLDPrefix}isActive`,
        notification: `${ngsiLDPrefix}notification`,
        status: `${ngsiLDPrefix}status`,
        throttling: `${ngsiLDPrefix}throttling`,
        temporalQ: `${ngsiLDPrefix}temporalQ`,
        geometry: `${ngsiLDPrefix}geometry`,
        coordinates: `${ngsiLDPrefix}coordinates`,
        georel: `${ngsiLDPrefix}georel`,
        geoproperty: `${ngsiLDPrefix}geoproperty`,
        attributes: {
            [jsonLD.idProp]: `${ngsiLDPrefix}attributes`,
            [jsonLD.typeProp]: jsonLD.vocabProp
        },
        format: `${ngsiLDPrefix}format`,
        timesSent: `${ngsiLDPrefix}timesSent`,
        lastNotification: {
            [jsonLD.idProp]: `${ngsiLDPrefix}lastNotification`,
            [jsonLD.typeProp]: 'DateTime'
        },
        lastFailure: {
            [jsonLD.idProp]: `${ngsiLDPrefix}lastFailure `,
            [jsonLD.typeProp]: 'DateTime'
        },
        lastSuccess: {
            [jsonLD.idProp]: `${ngsiLDPrefix}lastSuccess`,
            [jsonLD.typeProp]: 'DateTime'
        },
        uri: `${ngsiLDPrefix}uri`,
        accept: `${ngsiLDPrefix}accept`,
        success: {
            [jsonLD.idProp]: `${ngsiLDPrefix}success`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        errors: `${ngsiLDPrefix}errors`,
        error: `${ngsiLDPrefix}error`,
        entityId: {
            [jsonLD.idProp]: `${ngsiLDPrefix}entityId`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        updated: `${ngsiLDPrefix}updated`,
        unchanged: `${ngsiLDPrefix}unchanged`,
        attributeName: `${ngsiLDPrefix}attributeName`,
        reason: `${ngsiLDPrefix}reason`,
        timerel: `${ngsiLDPrefix}timerel`,
        time: {
            [jsonLD.idProp]: `${ngsiLDPrefix}time`,
            [jsonLD.typeProp]: 'DateTime'
        },
        endTime: {
            [jsonLD.idProp]: `${ngsiLDPrefix}endTime`,
            [jsonLD.typeProp]: 'DateTime'
        },
        timeproperty: `${ngsiLDPrefix}timeproperty`,
        subscriptionId: {
            [jsonLD.idProp]: `${ngsiLDPrefix}subscriptionId`,
            [jsonLD.typeProp]: jsonLD.idProp
        },
        notifiedAt: {
            [jsonLD.idProp]: `${ngsiLDPrefix}notifiedAt`,
            [jsonLD.typeProp]: 'DateTime'
        },
        data: `${ngsiLDPrefix}data`,
        triggerReason: `${ngsiLDPrefix}triggerReason`,
        values: {
            [jsonLD.idProp]: `${ngsiLDPrefix}hasValues`,
            [jsonLD.containerProp]: jsonLD.listProp
        },
        objects: {
            [jsonLD.idProp]: `${ngsiLDPrefix}hasObjects`,
            [jsonLD.typeProp]: jsonLD.idProp,
            [jsonLD.containerProp]: jsonLD.listProp
        },
        [jsonLD.vocabProp]: `${ngsiLDPrefix}default-context/`
    }
}
