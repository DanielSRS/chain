import type { ChargeRecord, StationGroup, UserGroup } from '../utils/types';

export const STATIONS: StationGroup = {
  2: {
    id: 2,
    location: {
      x: 200,
      y: 50,
    },
    reservations: [],
    state: 'avaliable',
    suggestions: [],
  },
  12: {
    id: 12,
    location: {
      x: 0,
      y: 1,
    },
    reservations: [],
    state: 'avaliable',
    suggestions: [],
  },
};

export const USERS: UserGroup = {};

export const CHARGES: ChargeRecord = {};
