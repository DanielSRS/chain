import { blockchain } from '../index.ts';
import { curry } from '../utils/curry.ts';
import { Logger } from '../utils/logger.ts';
import {
  ERROR_CODES,
  type RequestHandler,
  type StationGroup,
  type UserGroup,
} from '../utils/types.ts';

const log = Logger.extend('ReserveRoute');

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

    // Check if user already has reservation on this station
    const hasReservationOnThisStation = station.reservations.includes(userId);
    if (hasReservationOnThisStation) {
      return {
        success: true,
        message: `You already have a reservation on this station: ${station.id}`,
        data: undefined,
      };
    }

    // Check if user has any other reservation
    const hasAnyOtherReservation = Object.entries(stations).reduce(
      (prev, stationEntry) => {
        return stationEntry[1].reservations.includes(userId) || prev;
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

    // Submit to blockchain asynchronously (fire-and-forget for now)
    const currentTime = Date.now();
    const endTime = currentTime + 2 * 60 * 60 * 1000; // 2 hours from now

    blockchain
      .submitTransaction({
        type: 'RESERVE_STATION',
        data: {
          stationId,
          userId: userId.toString(),
          startTime: currentTime,
          endTime: endTime,
        },
      })
      .then(success => {
        if (success) {
          log.info(
            `✅ Reservation ${userId}->${stationId} submitted to blockchain`,
          );
        } else {
          log.info(
            `❌ Failed to submit reservation ${userId}->${stationId} to blockchain`,
          );
        }
      })
      .catch(error => {
        log.error('Blockchain submission error:', error);
      });

    // Update local state immediately (optimistic update)
    station.reservations.push(userId);
    station.state = 'reserved';

    return {
      success: true,
      message: `Reserved station ${station.id} (blockchain consensus pending)`,
      data: undefined,
    };
  },
);
