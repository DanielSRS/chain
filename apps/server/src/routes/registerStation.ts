import { curry } from '../utils/curry.ts';
import { type RequestHandler, type StationGroup } from '../utils/types.ts';

type Handler = RequestHandler<'registerStation'>;

export const registerStation = curry(
  (stations: StationGroup, data: Handler['data']): Handler['res'] => {
    const exists = Object.values(stations).find(
      station => station.id === data.id,
    );

    if (exists) {
      return {
        message:
          'Try another id or check if the station is already registered on the server.',
        success: false,
        error: 'ERROR: This id already belongs to another station!',
      };
    } else {
      stations[data.id] = data;
      return {
        message: 'The station has been successfully registered!',
        success: true,
        data: data,
      };
    }
  },
);
