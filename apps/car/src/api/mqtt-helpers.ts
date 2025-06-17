import { Logger } from '../../../shared/src/utils/utils.js';
import { mqttApiClient } from './mqtt-client.js';
import type {
  MqttApiEndpointsKeys,
  MqttApiEndpointsMap,
} from '../../../shared/src/api/mqtt-client.types.js';
import { deleteUser } from '../store/shared-data.js';

const log = Logger.extend('MqttHelpers');

/**
 * Check if the response contains a USER_NOT_FOUND error and handle logout
 */
function handleUserNotFoundError(response: unknown): boolean {
  if (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    !response.success
  ) {
    const errorResponse = response as {
      success: false;
      error?: unknown;
      message?: string;
    };

    // Check for USER_NOT_FOUND error in different formats
    const isUserNotFound =
      (typeof errorResponse.error === 'string' &&
        errorResponse.error.includes('USER_NOT_FOUND')) ||
      (typeof errorResponse.error === 'object' &&
        errorResponse.error !== null &&
        'code' in errorResponse.error &&
        errorResponse.error.code === 'USER_NOT_FOUND') ||
      (typeof errorResponse.message === 'string' &&
        errorResponse.message.includes('User does not exist'));

    if (isUserNotFound) {
      log.error(
        'Server reports user does not exist, logging out user',
        response,
      );
      deleteUser();
      return true;
    }
  }
  return false;
}

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
      // Check for user authentication errors in successful responses
      if (handleUserNotFoundError(result.data)) {
        return {
          type: 'error',
          message: 'User not found, logged out',
          error: new Error('User not found'),
        };
      }

      return {
        type: 'success',
        data: result.data as MqttApiEndpointsMap[K]['responseData'],
      };
    } else {
      // Check for user authentication errors in error responses
      if (handleUserNotFoundError(result.error.data)) {
        return {
          type: 'error',
          message: 'User not found, logged out',
          error: new Error('User not found'),
        };
      }

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

  reserveMultipleStations: (
    data: MqttApiEndpointsMap['reserveMultipleStations']['requestData'],
  ) => mqttRequest('reserveMultipleStations', data),
};
