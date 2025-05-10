export const ERROR_CODES = {
  /**
   * * Error code for when a user is does not exist
   */
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
  STATION_NOT_FOUND: {
    code: 'STATION_NOT_FOUND',
    message: 'Station not found',
  },
} as const;

export type ErrorCode = {
  code: keyof typeof ERROR_CODES;
  message: string;
};
