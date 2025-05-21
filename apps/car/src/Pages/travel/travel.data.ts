import type Paho from 'paho-mqtt';
import { addTopiclListner, mqttClient } from '../../utils/mqtt-client.js';
import { Logger } from '../../../../shared/index.js';

const log = Logger.extend('useTravelData');

export function useTravelData() {
  async function getTravelData() {
    log.info('Requesting travel data');
    const t = new Promise<Paho.Message | Error>(resolve => {
      const timeout = setTimeout(() => {
        resolve(new Error('Timeout'));
      }, 5000);

      addTopiclListner('cities/response', t => {
        clearTimeout(timeout);
        mqttClient.unsubscribe('cities/response');
        resolve(t);
      });
      mqttClient.subscribe('cities/response');
      mqttClient.send('cities', 'getTravelData', 2);
    });
    return t;
  }

  return {
    getTravelData,
  };
}
