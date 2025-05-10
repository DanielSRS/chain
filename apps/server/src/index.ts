import { Elysia } from 'elysia';
import Paho from 'paho-mqtt';

const mqttHost = process.env.MQTT_HOST || 'localhost';
const mqttPort = parseInt(process.env.MQTT_PORT || '9001');
const wsPath = process.env.MQTT_PATH || '/';

console.log(
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
    console.log('MQTT connection lost: ' + responseObject.errorMessage);
  }
};

mqttClient.onMessageArrived = message => {
  console.log(
    'Message arrived at topic: ',
    message.destinationName,
    message.payloadString,
  );
};

mqttClient.connect({
  onSuccess: () => {
    console.log('Connected to MQTT broker successfully');
    mqttClient.subscribe('test/topic', {
      onSuccess: () => {
        console.log('Subscribed to topic');

        const message = new Paho.Message('Hello from server');
        message.destinationName = 'test/topic';
        mqttClient.send(message);
      },
      onFailure: err => {
        console.error('Failed to subscribe to topic', err);
      },
    });
  },
  onFailure: error => {
    console.error('Failed to connect to MQTT broker', error);
  },
  useSSL: false,
  reconnect: true,
  timeout: 10,
});

const app = new Elysia().get('/', () => 'Hello Elysia').listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
