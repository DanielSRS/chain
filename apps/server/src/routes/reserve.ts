import { curry } from '../utils/curry';
import {
  ERROR_CODES,
  type RequestHandler,
  type StationGroup,
  type UserGroup,
} from '../utils/types';
type Handler = RequestHandler<'reserve'>;

export const reserve = curry(
  (
    stations: StationGroup,
    users: UserGroup,
    data: Handler['data'],
  ): Handler['res'] => {
    const { stationId, userId } = data;
    const station = stations[stationId];

    if (!station) {
      // retutn error
      return {
        success: false,
        message: 'station does not exist',
        error: undefined,
      };
    }

    const user = users[userId];
    if (!user) {
      return {
        message: 'User does not exist',
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
      };
    }

    // verificar se ja tem reserva
    const hasReservationOnThisStation = station.reservations.includes(userId);
    if (hasReservationOnThisStation) {
      return {
        success: true,
        message: `You already have a reservation on this station: ${station.id}`,
        data: undefined,
      };
    }

    const hasAnyOtherReservation = Object.entries(stations).reduce(
      (prev, station) => {
        return station[1].reservations.includes(userId) || prev;
      },
      false,
    );

    if (hasAnyOtherReservation) {
      return {
        success: false,
        message: 'You already have a reservation on another station',
        error: undefined,
      };
    }

    station.reservations.push(userId);
    station.state = 'reserved';

    // retorna sucesso
    return {
      success: true,
      message: `Reserved station ${station.id}`,
      data: undefined,
    };
  },
);
