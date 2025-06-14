import { Logger } from '../../../shared/src/utils/utils.js';
import { mqttApiClient } from './mqtt-client.js';
import type {
  MqttApiEndpointsKeys,
  MqttApiEndpointsMap,
} from '../../../shared/src/api/mqtt-client.types.js';

const log = Logger.extend('MqttHelpers');

/**
 * Generic MQTT request helper that mimics the TCP API structure
 */
export async function mqttRequest<K extends MqttApiEndpointsKeys>(
  type: K,
  data: MqttApiEndpointsMap[K]['requestData'],
): Promise<
  | {
      type: 'success';
      data: MqttApiEndpointsMap[K]['responseData'];
    }
  | {
      type: 'error';
      message: string;
      error: unknown;
    }
> {
  const requestTopic = type as MqttApiEndpointsMap[K]['requestTopic'];
  const responseTopic =
    `${type}/response` as MqttApiEndpointsMap[K]['responseTopic'];

  try {
    const result = await mqttApiClient(requestTopic, responseTopic, data);

    if (result.success) {
      return {
        type: 'success',
        data: result.data as MqttApiEndpointsMap[K]['responseData'],
      };
    } else {
      return {
        type: 'error',
        message: result.error.type,
        error: result.error.data,
      };
    }
  } catch (error) {
    log.error('MQTT request failed:', error);
    return {
      type: 'error',
      message: 'MQTT request failed',
      error,
    };
  }
}

/**
 * Type-safe MQTT request helpers for specific endpoints
 */
export const mqttHelpers = {
  getSuggestions: (
    data: MqttApiEndpointsMap['getSuggestions']['requestData'],
  ) => mqttRequest('getSuggestions', data),

  reserve: (data: MqttApiEndpointsMap['reserve']['requestData']) =>
    mqttRequest('reserve', data),

  registerUser: (data: MqttApiEndpointsMap['registerUser']['requestData']) =>
    mqttRequest('registerUser', data),

  startCharging: (data: MqttApiEndpointsMap['startCharging']['requestData']) =>
    mqttRequest('startCharging', data),

  endCharging: (data: MqttApiEndpointsMap['endCharging']['requestData']) =>
    mqttRequest('endCharging', data),

  rechargeList: (data: MqttApiEndpointsMap['rechargeList']['requestData']) =>
    mqttRequest('rechargeList', data),

  payment: (data: MqttApiEndpointsMap['payment']['requestData']) =>
    mqttRequest('payment', data),

  getStationInfo: (
    data: MqttApiEndpointsMap['getStationInfo']['requestData'],
  ) => mqttRequest('getStationInfo', data),
};
