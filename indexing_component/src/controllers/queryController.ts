// Controller to handle search queries from applications / orchestrator
import * as express from 'express';
import { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { Controller } from '../util/Controller';
import { SearchQuery, SearchRequest, WithinSearchRequest, NearSearchRequest } from '../util/searchRequest';
import { HttpException } from '../util/errorMiddleware';

export class QueryController implements Controller {
    public readonly path = '/query';
    public readonly router = express.Router();

    constructor() {
        this.intializeRoutes();
    }

    private intializeRoutes(): void {
        this.router.get(this.path, this.handleSearchRequest.bind(this));
    }

    public async handleSearchRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        const query = req.query as SearchQuery;
        let searchRequest: SearchRequest;
        try {
            switch (query.location.query) {
                case '$geoWithin':
                    if (query.location.coordinates.length !== 4) {
                        return next(new HttpException(BAD_REQUEST, 'Location query must contain exactly 4 coordinate pairs - one for each corner of a rectangle.'));
                    }

                    searchRequest = new WithinSearchRequest(query);

                    break;
                case '$near':
                    searchRequest = new NearSearchRequest(query);
                    break;
                default:
                    return next(new HttpException(BAD_REQUEST, 'Unsupported location query. Allowed values are: \'$geoWithin\', \'$near\''));
            }
        }
        catch (e) {
            return next(new HttpException(BAD_REQUEST, `Failed to parse the request: ${e.message}`, e));
        }

        try {
            const result = await searchRequest.exec();

            res.status(OK).json(result.map(s => ({
                id: s.sensorId,
                type: s.type,
                location: s.location,
                distance: s.distance
            })));
        } catch (e) {
            return next(new HttpException(INTERNAL_SERVER_ERROR, `Search request failed: ${e.message}`, e));
        }
    }
}

