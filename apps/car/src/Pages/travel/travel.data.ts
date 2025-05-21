import { Logger } from '../../../../shared/index.js';
import { mqttApiClient } from '../../api/mqtt-client.js';

const log = Logger.extend('useTravelData');

export function useTravelData() {
  return {
    getTravelData,
  };
}

async function getTravelData() {
  log.info('Requesting travel data');
  const t = await mqttApiClient('cities', 'cities/response', {});
  return t;
}
