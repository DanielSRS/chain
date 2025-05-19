import './server';
import { Elysia, t } from 'elysia';
import Paho from 'paho-mqtt';
import { Logger } from './utils/logger.ts';
import { interpret } from 'xstate';
import { paxos } from './utils/paxos.ts';

const log = Logger.extend('Server');

const mqttHost = process.env.MQTT_HOST || 'localhost';
const mqttPort = parseInt(process.env.MQTT_PORT || '9001');
const wsPath = process.env.MQTT_PATH || '/';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000');

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

const app = new Elysia()
  .decorate('machine', interpret(paxos).start())
  .get('/', () => 'Hello Elysia')
  .listen(SERVER_PORT)
  .post(
    '/event',
    ({ body, machine }) => {
      const { event } = body;
      log.info('Received event:', event);
      const res = machine.send(event);
      return res.value.toString();
    },
    {
      body: t.Object({
        event: t.Object({
          type: t.Literal('PROMISE'),
          data: t.Any(),
        }),
      }),
      response: t.String(),
    },
  );

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
