import { Logger } from '../../../../shared/index.js';
import { mqttApiClient } from '../../api/mqtt-client.js';

const log = Logger.extend('useTravelData');
export interface PathResult {
  path: string[];
  cost: number;
}

export function useTravelData() {
  return {
    getTravelData,
    getCities,
    getAvaliableRoutes,
  };
}

async function getTravelData() {
  log.info('Requesting travel data');
  const t = await mqttApiClient<'cities'>('cities', 'cities/response', {});
  return t;
}

function getCities() {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<{ cities: readonly string[] }>(async (resolve, reject) => {
    const res = await getTravelData();
    if (!res.success) {
      reject(res.error);
      return;
    }
    resolve({ cities: res.data });
  });
}

function getAvaliableRoutes({
  departure,
  destination,
}: {
  departure: string;
  destination: string;
}) {
  return new Promise<{ routes: readonly PathResult[] }>(
    // eslint-disable-next-line no-async-promise-executor
    async (resolve, reject) => {
      const res = await mqttApiClient<'routes'>('routes', 'routes/response', {
        departure,
        destination,
      });
      if (!res.success) {
        reject(res.error);
        return;
      }
      resolve({ routes: res.data });
    },
  );
}
