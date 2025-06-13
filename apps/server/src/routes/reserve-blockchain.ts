import { blockchain } from '../blockchain-server.ts';
import {
  ERROR_CODES,
  type RequestHandler,
  type StationGroup,
  type UserGroup,
} from '../utils/types.ts';

type Handler = RequestHandler<'reserve'>;

// Helper function to create a blockchain-enabled reservation
async function createBlockchainReservation(
  stationId: number,
  userId: number,
  stations: StationGroup,
  users: UserGroup,
): Promise<Handler['res']> {
  const station = stations[stationId];
  const user = users[userId];

  if (!station) {
    return {
      success: false,
      message: 'station does not exist',
      error: undefined,
    };
  }

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

  try {
    // Submit reservation to blockchain for consensus
    const currentTime = Date.now();
    const endTime = currentTime + 2 * 60 * 60 * 1000; // 2 hours from now

    const blockchainSuccess = await blockchain.submitTransaction({
      type: 'RESERVE_STATION',
      data: {
        stationId,
        userId: userId.toString(),
        startTime: currentTime,
        endTime: endTime,
      },
    });

    if (!blockchainSuccess) {
      return {
        success: false,
        message: 'Failed to create reservation on blockchain',
        error: undefined,
      };
    }

    // Update local state after blockchain confirmation
    station.reservations.push(userId);
    station.state = 'reserved';

    return {
      success: true,
      message: `Reserved station ${station.id} via blockchain consensus`,
      data: undefined,
    };
  } catch {
    return {
      success: false,
      message: 'Blockchain consensus failed',
      error: undefined,
    };
  }
}

// Curry-compatible reserve function
export function reserve(stations: StationGroup, users: UserGroup) {
  return async (data: Handler['data']): Promise<Handler['res']> => {
    const { stationId, userId } = data;
    return await createBlockchainReservation(
      stationId,
      userId,
      stations,
      users,
    );
  };
}
