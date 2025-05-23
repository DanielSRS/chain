import type { ChargeRecord, StationGroup, UserGroup } from '../utils/types.ts';

export const STATIONS: StationGroup = {
  2: {
    id: 2,
    location: {
      x: 200,
      y: 50,
    },
    city: 'Feira de Santana',
    companyId: '234WFSW#$',
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
    city: 'Feira de Santana',
    companyId: '234234SW#$',
    reservations: [],
    state: 'avaliable',
    suggestions: [],
  },
};

export const USERS: UserGroup = {};

export const CHARGES: ChargeRecord = {};
