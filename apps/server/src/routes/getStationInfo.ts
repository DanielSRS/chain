import { curry } from '../utils/curry';
import {
  ERROR_CODES,
  type RequestHandler,
  type StationGroup,
} from '../utils/types';

type Handler = RequestHandler<'getStationInfo'>;

export const getStationInfo = curry(
  (stations: StationGroup, data: Handler['data']): Handler['res'] => {
    const { id } = data;
    const station = stations[id];
    if (!station) {
      return {
        message: 'Station does not exist',
        success: false,
        error: ERROR_CODES.STATION_NOT_FOUND,
      };
    }

    return {
      message: 'Station info returned',
      success: true,
      data: station,
    };
  },
);
