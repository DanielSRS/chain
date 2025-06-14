import Paho from 'paho-mqtt';
import { Logger } from './utils/logger.ts';
import { CITIES, type City } from './utils/cities.ts';
import { ComputedRoutes } from './utils/computed-routes.ts';
import type { MqttApiEndpointsKeys } from './utils/types.ts';

// Import TCP route handlers to adapt them for MQTT
import { getSuggestions } from './routes/stationSuggetions.ts';
import { reserve } from './routes/reserve.ts';
import { registerUser } from './routes/registerCar.ts';
import { startCharging } from './routes/startCharging.ts';
import { endCharging } from './routes/endCharging.ts';
import { rechargeList } from './routes/rechargeList.ts';
import { payment } from './routes/payment.ts';
import { getStationInfo } from './routes/getStationInfo.ts';
import { CHARGES, STATIONS, USERS } from './data/data.ts';

const mqttHost = process.env.MQTT_HOST || 'localhost';
const mqttPort = parseInt(process.env.MQTT_PORT || '9001');
const wsPath = process.env.MQTT_PATH || '/';

const log = Logger.extend('MQTT-Server');

log.info(
  `Connecting to MQTT broker at ${mqttHost}:${mqttPort} with path ${wsPath}`,
);

export const mqttClient = new Paho.Client(
  mqttHost,
  mqttPort,
  wsPath,
  Date.now().toString() + 'Server',
);

const MAX_RADIUS = 8000;

mqttClient.onConnectionLost = responseObject => {
  if (responseObject.errorCode !== 0) {
    log.warn('MQTT connection lost: ' + responseObject.errorMessage);
  }
};

mqttClient.onMessageArrived = async message => {
  log.info(
    'Message arrived at topic: ',
    message.destinationName,
    message.payloadString,
  );

  const topic = message.destinationName;
  let responseData: unknown;
  let responseTopic: string;

  try {
    const requestData = JSON.parse(message.payloadString);

    switch (topic) {
      case 'cities':
        responseData = CITIES;
        responseTopic = 'cities/response';
        break;

      case 'routes':
        responseData =
          ComputedRoutes[requestData.departure as City][
            requestData.destination as City
          ];
        responseTopic = 'routes/response';
        break;

      case 'getSuggestions':
        responseData = getSuggestions(MAX_RADIUS, STATIONS, requestData);
        responseTopic = 'getSuggestions/response';
        break;

      case 'reserve':
        responseData = await reserve(STATIONS, USERS, requestData);
        responseTopic = 'reserve/response';
        break;

      case 'registerUser':
        responseData = registerUser(USERS, requestData);
        responseTopic = 'registerUser/response';
        break;

      case 'startCharging':
        responseData = startCharging(STATIONS, USERS, CHARGES, requestData);
        responseTopic = 'startCharging/response';
        break;

      case 'endCharging':
        responseData = endCharging(STATIONS, USERS, CHARGES, requestData);
        responseTopic = 'endCharging/response';
        break;

      case 'rechargeList':
        responseData = rechargeList(USERS, CHARGES, requestData);
        responseTopic = 'rechargeList/response';
        break;

      case 'payment':
        responseData = payment(USERS, CHARGES, requestData);
        responseTopic = 'payment/response';
        break;

      case 'getStationInfo':
        responseData = getStationInfo(STATIONS, requestData);
        responseTopic = 'getStationInfo/response';
        break;

      default:
        log.error('Unknown topic:', topic);
        return;
    }

    mqttClient.send(responseTopic, JSON.stringify(responseData), 2);
    log.debug('Response sent to:', responseTopic);
  } catch (error) {
    log.error('Error processing MQTT message:', error);
  }
};

const topicSubscriptionSuccess = (topic: string) => () => {
  log.info('Subscribed to topic: ' + topic);
};
const topicSubscriptionError =
  (topic: string) => (err: Paho.ErrorWithInvocationContext) => {
    log.error('Failed to subscribe to topic: ', topic, err);
  };

mqttClient.connect({
  onSuccess: () => {
    log.info('Connected to MQTT broker successfully');
    // subscribe to topics exposed as endpoints
    const endpointsTopics: MqttApiEndpointsKeys[] = [
      'cities',
      'routes',
      'getSuggestions',
      'reserve',
      'registerUser',
      'startCharging',
      'endCharging',
      'rechargeList',
      'payment',
      'getStationInfo',
    ];
    endpointsTopics.forEach(topic => {
      mqttClient.subscribe(topic, {
        onSuccess: topicSubscriptionSuccess(topic),
        onFailure: topicSubscriptionError(topic),
      });
    });
  },
  onFailure: error => {
    log.error('Failed to connect to MQTT broker', error);
  },
  useSSL: false,
  reconnect: true,
  timeout: 10,
});
