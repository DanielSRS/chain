import { consoleTransport, logger } from 'react-native-logs';

export const Logger = logger.createLogger({
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
});

export type ExtendedLogger = ReturnType<typeof Logger.extend>;
