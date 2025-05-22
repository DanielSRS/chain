import { z } from 'zod';

export interface Company {
  readonly name: string;
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
  | 'COMMIT';

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

export interface CommitIndex {
  firstCommitId: string;
  lastCommitId: string;
  lastCommitIndex: number;
  commitRegistryById: Record<string, Commit>;
  commitRegistryByIndex: Record<number, Commit>;
}

export interface CompanyGroup {
  creationDate: number;
  members: Array<Company>;
  commits: CommitIndex;
}
