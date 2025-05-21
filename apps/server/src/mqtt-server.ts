import Paho from 'paho-mqtt';
import { Logger } from './utils/logger.ts';
import { CITIES } from './utils/cities.ts';
import { createRouter } from './routes/mqtt-router.ts';

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

mqttClient.onConnectionLost = responseObject => {
  if (responseObject.errorCode !== 0) {
    log.warn('MQTT connection lost: ' + responseObject.errorMessage);
  }
};

mqttClient.onMessageArrived = message => {
  log.info(
    'Message arrived at topic: ',
    message.destinationName,
    message.payloadString,
  );
  const router = createRouter().add('cities', () => ({
    data: CITIES,
    responseTopic: 'cities/response',
  }));

  const response = router.validateAndDispach(message);
  if (!response) {
    log.error('No response found for topic: ', message.destinationName);
    return;
  }
  mqttClient.send(response.responseTopic, JSON.stringify(response.data), 2);
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
    mqttClient.subscribe('cities', {
      onSuccess: topicSubscriptionSuccess('cities'),
      onFailure: topicSubscriptionError('cities'),
    });
  },
  onFailure: error => {
    log.error('Failed to connect to MQTT broker', error);
  },
  useSSL: false,
  reconnect: true,
  timeout: 10,
});
