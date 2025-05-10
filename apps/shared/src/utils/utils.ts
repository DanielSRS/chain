import { consoleTransport, logger } from 'react-native-logs';
import { LOG_PATH, LOG_SERVER } from '../contants.js';

type ConsoleTransport = typeof consoleTransport;
const remoteTransoport: ConsoleTransport = props => {
  fetch(`http://${LOG_SERVER}${LOG_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(props),
  }).catch(() => {});
};

const _Logger = logger.createLogger({
  transport: remoteTransoport,
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
});

export const Logger: ReturnType<typeof logger.createLogger<ConsoleTransport>> =
  _Logger;
