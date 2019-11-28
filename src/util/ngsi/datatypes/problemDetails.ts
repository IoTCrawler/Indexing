export const InvalidRequestErrorType = 'https://uri.etsi.org/ngsi-ld/errors/InvalidRequest';
export const BadRequestDataErrorType = 'https://uri.etsi.org/ngsi-ld/errors/BadRequestData';
export const AlreadyExistsErrorType = 'https://uri.etsi.org/ngsi-ld/errors/AlreadyExists';
export const OperationNotSupportedErrorType = 'https://uri.etsi.org/ngsi-ld/errors/OperationNotSupported';
export const ResourceNotFoundErrorType = 'https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound';
export const InternalErrorErrorType = 'https://uri.etsi.org/ngsi-ld/errors/InternalError';
export const TooComplexQueryErrorType = 'https://uri.etsi.org/ngsi-ld/errors/TooComplexQuery';
export const TooManyResultsErrorType = 'https://uri.etsi.org/ngsi-ld/errors/TooManyResults';
export const LdContextNotAvailableErrorType = 'https://uri.etsi.org/ngsi-ld/errors/LdContextNotAvailable';

export interface ProblemDetails {
    type: string;
    title: string;
    status?: number;
    detail: string;
    instance?: string;
}

