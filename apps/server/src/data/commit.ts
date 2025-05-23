import { z } from 'zod';
import type { City } from '../utils/cities.ts';
import type { Station, StationGroup } from '../utils/types.ts';

export interface Company {
  readonly name: string;
  readonly id: string;
  readonly address: string;
}

export const companySchema = z.object({
  name: z.string(),
  address: z.string(),
});

type CommitType =
  | 'RESERVE_STATION'
  | 'CANCEL_RESERVATION'
  | 'CHARGE'
  | 'PAYMENT'
  | 'CONFIRM'
  | 'REJECT'
  | 'ABORT'
  | 'GROUP_CREATION'
  | 'APROVE_MEMBER_JOIN';

interface CommitTypeMap {
  RESERVE_STATION: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
  };
  CANCEL_RESERVATION: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
  };
  CHARGE: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    chargeAmount: number;
  };
  PAYMENT: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    paymentAmount: number;
  };
  CONFIRM: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    chargeAmount: number;
    paymentAmount: number;
    transactionId: string;
  };
  REJECT: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    chargeAmount: number;
    paymentAmount: number;
    transactionId: string;
  };
  ABORT: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    chargeAmount: number;
    paymentAmount: number;
    transactionId: string;
  };
  COMMIT: {
    stationId: number;
    userId: string;
    startTime: number;
    endTime: number;
    chargeAmount: number;
    paymentAmount: number;
    transactionId: string;
    commitId: string;
  };
  APROVE_MEMBER_JOIN: {
    company: Company;
    stations: Record<number, Station>;
  };
  GROUP_CREATION: {
    creationDate: number;
    members: Array<Company>;
    // commits: CommitIndex;s
    stations: Record<City, Station[]>;
  };
}

export interface Commit<
  Type extends CommitType = CommitType,
  Data = CommitTypeMap[Type],
> {
  readonly id: string;
  readonly company: Company;
  readonly timestamp: number;
  readonly type: Type;
  readonly data: Data;
  readonly index: number;
  readonly previousCommitId: string;
}

type GroupCreationCommit = Commit<'GROUP_CREATION'> & {
  previousCommitId: 'none';
};

export interface CommitIndex {
  firstCommitId: string;
  lastCommitId: string;
  lastCommitIndex: number;
  commitRegistryById: Record<string, Commit>;
  commitRegistryByIndex: Record<number, Commit>;
}

export interface CompanyStationsIndex {
  stationRegistryById: Record<number, Station>;
  stationRegistryByCity: Record<City, Station[]>;
}

export interface CompanyGroup {
  creationDate: number;
  members: Array<Company>;
  commits: CommitIndex;
  stations: Record<City, Station[]>;
}

export function CreateCompany(address: string, name: string): Company {
  return {
    address,
    id: `${process.pid}${Date.now()}`,
    name,
  };
}

export function createCompanyGroup(
  address: string,
  name: string,
  _stations: StationGroup,
): CompanyGroup {
  const stationByCity = {} as Record<City, Station[]>;
  Object.values(_stations).forEach(station => {
    const city = station.city as City;
    if (!stationByCity[city]) {
      stationByCity[city] = [];
    }
    stationByCity[city].push(station);
  });
  const date = Date.now();
  const company = CreateCompany(address, name);
  const commitId = 'alsdkfj';
  const firstCommit: GroupCreationCommit = {
    company: company,
    timestamp: date,
    type: 'GROUP_CREATION',
    index: 0,
    previousCommitId: 'none',
    id: commitId,
    data: {
      members: [company],
      stations: stationByCity,
      creationDate: date,
    },
  };
  return {
    creationDate: date,

    commits: {
      commitRegistryById: {
        [commitId]: firstCommit,
      },
      commitRegistryByIndex: {
        [0]: firstCommit,
      },
      firstCommitId: commitId,
      lastCommitId: commitId,
      lastCommitIndex: 0,
    },
    members: firstCommit.data.members,
    stations: firstCommit.data.stations,
  };
}
