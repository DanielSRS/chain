import { Logger } from '../../../../shared/index.js';
import { mqttApiClient } from '../../api/mqtt-client.js';

const log = Logger.extend('useTravelData');

export function useTravelData() {
  return {
    getTravelData,
    getCities,
    getAvaliableRoutes,
  };
}

async function getTravelData() {
  log.info('Requesting travel data');
  const t = await mqttApiClient('cities', 'cities/response', {});
  return t;
}

function getCities() {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<{ cities: string[] }>(async (resolve, reject) => {
    const res = await getTravelData();
    if (!res.success) {
      reject(res.error);
      return;
    }
    resolve({ cities: res.data });
  });
}

function getAvaliableRoutes() {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<{ routes: 'fsn' }>(async resolve => {
    setTimeout(() => {
      resolve({
        routes: 'fsn',
      });
    }, 2001);
  });
}
