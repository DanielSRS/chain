import type Paho from 'paho-mqtt';
import { Logger } from '../../../shared/src/utils/utils.js';
import {
  addTopiclListner,
  mqttClient as _mqttClient,
} from '../utils/mqtt-client.js';
import type {
  MqttApiEndpointsKeys,
  MqttApiEndpointsMap,
} from '../../../shared/src/api/mqtt-client.types.js';
type HHH<ResponseData extends object> =
  | { success: true; data: ResponseData }
  | {
      success: false;
      error: {
        type: 'timeout' | 'not_connected';
        data: unknown;
      };
    };

const log = Logger.extend('useTravelData');

export function settupMqttApiClient(mqttClient: Paho.Client) {
  log.info('MQTT client id: ', mqttClient.clientId);
  async function YYY<
    EndpointKey extends MqttApiEndpointsKeys,
    RequestTopic extends
      string = MqttApiEndpointsMap[EndpointKey]['requestTopic'],
    ResponseTopic extends
      string = MqttApiEndpointsMap[EndpointKey]['responseTopic'],
    RequestData = MqttApiEndpointsMap[EndpointKey]['requestData'],
    ResponseData extends
      object = MqttApiEndpointsMap[EndpointKey]['responseData'],
  >(
    requestTopic: RequestTopic,
    responseTopic: ResponseTopic,
    dataToSend: RequestData,
  ): Promise<HHH<ResponseData>> {
    return new Promise(resolve => {
      // Check if the client is connected
      if (!mqttClient.isConnected()) {
        resolve({
          success: false,
          error: { type: 'not_connected', data: undefined },
        });
      }

      // Set a timeout for the request
      // Atomic blockchain operations can take longer, so we use 15 seconds
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: { type: 'timeout', data: undefined },
        });
      }, 15000);

      /**
       * Subscribe to the response topic and add a listener
       * When a message arrives, clear the timeout and resolve the promise
       * with the data received
       * Unsubscribe from the response topic to avoid memory leaks
       * and multiple listeners
       */
      addTopiclListner(responseTopic, t => {
        clearTimeout(timeout);
        mqttClient.unsubscribe(responseTopic);
        resolve({
          success: true,
          data: JSON.parse(t.payloadString),
        });
      });

      // Subscribe to the response topic
      mqttClient.subscribe(responseTopic);

      // Send the request to the request topic
      mqttClient.send(requestTopic, JSON.stringify(dataToSend), 2);
    });
  }

  return YYY;
}

export const mqttApiClient = settupMqttApiClient(_mqttClient);

/**
 * This function is a no-op for the MQTT client setup.
 * It exists only to provide an import to be called
 * earlier in the app lifecycle, to ensure the side effect
 * of setting up the MQTT client is executed.
 */
export function NOOPMqttClientSetup() {
  return;
}
