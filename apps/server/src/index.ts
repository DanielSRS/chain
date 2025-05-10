import { Elysia } from 'elysia';
import Paho from 'paho-mqtt';
import { Logger } from './utils/logger';

const log = Logger.extend('Server');

const mqttHost = process.env.MQTT_HOST || 'localhost';
const mqttPort = parseInt(process.env.MQTT_PORT || '9001');
const wsPath = process.env.MQTT_PATH || '/';

log.info(
  `Connecting to MQTT broker at ${mqttHost}:${mqttPort} with path ${wsPath}`,
);

const mqttClient = new Paho.Client(
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
};

mqttClient.connect({
  onSuccess: () => {
    log.info('Connected to MQTT broker successfully');
    mqttClient.subscribe('test/topic', {
      onSuccess: () => {
        log.info('Subscribed to topic');

        const message = new Paho.Message('Hello from server');
        message.destinationName = 'test/topic';
        mqttClient.send(message);
      },
      onFailure: err => {
        log.error('Failed to subscribe to topic', err);
      },
    });
  },
  onFailure: error => {
    log.error('Failed to connect to MQTT broker', error);
  },
  useSSL: false,
  reconnect: true,
  timeout: 10,
});

const app = new Elysia().get('/', () => 'Hello Elysia').listen(3000);

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
