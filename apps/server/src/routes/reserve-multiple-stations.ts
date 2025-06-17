import { blockchain } from '../blockchain-server.ts';
import { curry } from '../utils/curry.ts';
import { Logger } from '../utils/logger.ts';
import {
  ERROR_CODES,
  type RequestHandler,
  type StationGroup,
  type UserGroup,
} from '../utils/types.ts';
import type { MultiPointReservation } from '../../../shared/src/utils/main.types.ts';

const log = Logger.extend('AtomicReserveRoute');

type Handler = RequestHandler<'reserveMultipleStations'>;

/**
 * Reserva múltiplas estações atomicamente usando blockchain
 * Todas as estações devem ser reservadas ou nenhuma será reservada
 */
export const reserveMultipleStations = curry(
  async (
    stations: StationGroup,
    users: UserGroup,
    data: MultiPointReservation,
  ): Promise<Handler['res']> => {
    const { stationIds, userId, estimatedStopTimes } = data;

    log.info(
      `🔄 Starting atomic reservation for user ${userId}, stations: ${stationIds.join(', ')}`,
    );

    // Validações básicas
    if (stationIds.length === 0) {
      return {
        success: false,
        message: 'No stations provided for reservation',
        error: 'Invalid input',
      };
    }

    if (stationIds.length !== estimatedStopTimes.length) {
      return {
        success: false,
        message: 'Number of stations must match number of estimated stop times',
        error: 'Invalid input',
      };
    }

    // Verificar se o usuário existe
    const user = users[userId];
    if (!user) {
      return {
        success: false,
        message: 'User does not exist',
        error: ERROR_CODES.USER_NOT_FOUND,
      };
    }

    // Verificar se todas as estações existem localmente
    const nonExistentStations: number[] = [];
    const unavailableStations: { stationId: number; reason: string }[] = [];

    for (const stationId of stationIds) {
      const station = stations[stationId];
      if (!station) {
        nonExistentStations.push(stationId);
      } else {
        // Check station availability status
        if (station.state === 'charging-car') {
          unavailableStations.push({
            stationId,
            reason: 'Station is currently charging another vehicle',
          });
        } else if (
          station.state === 'reserved' &&
          station.reservations.length > 0
        ) {
          unavailableStations.push({
            stationId,
            reason: 'Station is already reserved by other users',
          });
        }
      }
    }

    if (nonExistentStations.length > 0) {
      return {
        success: false,
        message: `Stations do not exist: ${nonExistentStations.join(', ')}`,
        error: 'Station not found',
      };
    }

    if (unavailableStations.length > 0) {
      const unavailableDetails = unavailableStations
        .map(({ stationId, reason }) => `Station ${stationId}: ${reason}`)
        .join('; ');

      return {
        success: false,
        message: `Some stations are not available for reservation: ${unavailableDetails}`,
        error: 'Stations not available',
      };
    }

    // Verificar se o usuário já tem reservas ativas
    const hasActiveReservations = Object.values(stations).some(station =>
      station.reservations.includes(userId),
    );

    if (hasActiveReservations) {
      return {
        success: false,
        message: 'User already has active reservations',
        error: 'User has active reservations',
      };
    }

    // Preparar tempos para blockchain
    const endTimes = estimatedStopTimes.map(time => time + 2 * 60 * 60 * 1000); // 2 horas para cada parada

    try {
      log.info(`📡 Submitting atomic reservation to blockchain...`);

      // Executar reserva atômica na blockchain
      const reservationIds = await blockchain.createAtomicReservation(
        stationIds,
        estimatedStopTimes,
        endTimes,
      );

      if (reservationIds.length === stationIds.length) {
        // Atualizar estado local apenas após confirmação da blockchain
        stationIds.forEach(stationId => {
          const station = stations[stationId];
          if (station) {
            station.reservations.push(userId);
            station.state = 'reserved';
          }
        });

        log.info(
          `✅ Atomic reservation successful. Reservation IDs: ${reservationIds.join(', ')}`,
        );

        return {
          success: true,
          message: `Successfully reserved ${stationIds.length} stations atomically`,
          data: {
            success: true,
            reservationIds,
            message: `Successfully reserved ${stationIds.length} stations atomically`,
            stationErrors: [],
          },
        };
      } else {
        log.error(
          `❌ Blockchain returned unexpected number of reservation IDs`,
        );
        return {
          success: false,
          message: 'Blockchain returned unexpected results',
          error: 'Unexpected blockchain response',
        };
      }
    } catch (error) {
      log.error('Atomic reservation failed:', error);

      // Preparar detalhes do erro
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: `Atomic reservation failed: ${errorMessage}`,
        error: errorMessage,
      };
    }
  },
);
