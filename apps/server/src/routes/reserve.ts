import { blockchain } from '../blockchain-server.ts';
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
  async (
    stations: StationGroup,
    users: UserGroup,
    data: Handler['data'],
  ): Promise<Handler['res']> => {
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

    // Submit to blockchain synchronously - no optimistic updates allowed
    const currentTime = Date.now();
    const endTime = currentTime + 2 * 60 * 60 * 1000; // 2 hours from now

    try {
      const success = await blockchain.submitTransaction({
        type: 'RESERVE_STATION',
        data: {
          stationId,
          userId: userId.toString(),
          startTime: currentTime,
          endTime: endTime,
        },
      });

      if (success) {
        log.info(
          `✅ Reservation ${userId}->${stationId} confirmed on blockchain`,
        );

        // Only update local state after blockchain confirmation
        station.reservations.push(userId);
        station.state = 'reserved';

        return {
          success: true,
          message: `Reserved station ${station.id} via blockchain consensus`,
          data: undefined,
        };
      } else {
        log.error(
          `❌ Failed to submit reservation ${userId}->${stationId} to blockchain`,
        );
        return {
          success: false,
          message: 'Blockchain reservation failed',
          error: undefined,
        };
      }
    } catch (error) {
      log.error('Blockchain submission error:', error);
      return {
        success: false,
        message: 'Blockchain consensus failed',
        error: undefined,
      };
    }
  },
);
