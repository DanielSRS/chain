import type Paho from 'paho-mqtt';
import { addTopiclListner, mqttClient } from '../../utils/mqtt-client.js';
import { Logger } from '../../../../shared/index.js';

const log = Logger.extend('useTravelData');

export function useTravelData() {
  return {
    getTravelData,
  };
}

async function getTravelData() {
  log.info('Requesting travel data');
  const t = new Promise<
    { data: Paho.Message; success: true } | { error: unknown; success: false }
  >(resolve => {
    if (!mqttClient.isConnected()) {
      resolve({ success: false, error: new Error('Mqtt not connected') });
    }
    const timeout = setTimeout(() => {
      resolve({ success: false, error: new Error('Timeout') });
    }, 5000);

    addTopiclListner('cities/response', t => {
      clearTimeout(timeout);
      mqttClient.unsubscribe('cities/response');
      resolve({
        success: true,
        data: t,
      });
    });
    mqttClient.subscribe('cities/response');
    mqttClient.send('cities', 'getTravelData', 2);
  });
  return t;
}
