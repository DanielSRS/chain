import Paho from 'paho-mqtt';
import { Logger } from '../../../shared/index.js';

const mqttHost = process.env['MQTT_HOST'] || 'localhost';
const mqttPort = parseInt(process.env['MQTT_PORT'] || '9001');
const wsPath = process.env['MQTT_PATH'] || '/';

const log = Logger.extend('MQTT-client');

log.info(
  `Connecting to MQTT broker at ${mqttHost}:${mqttPort} with path ${wsPath}`,
);

export const mqttClient = new Paho.Client(
  mqttHost,
  mqttPort,
  wsPath,
  Date.now().toString() + 'Server',
);

export const topicListners: {
  [key: string]: Array<(msg: Paho.Message) => void>;
} = {};

export const sendMessageToListeners = (
  channelName: string,
  message: Paho.Message,
) => {
  const channels = topicListners[channelName];

  channels?.forEach(listner => listner(message));
};

export const addTopiclListner = (
  channelName: string,
  callbackFunction: (msg: Paho.Message) => void,
) => {
  const channel = topicListners[channelName];
  if (channel) {
    channel.push(callbackFunction);
    return;
  }

  topicListners[channelName] = [callbackFunction];
};

mqttClient.onConnectionLost = responseObject => {
  if (responseObject.errorCode !== 0) {
    log.warn('MQTT connection lost: ' + responseObject.errorMessage);
  }
};

mqttClient.onMessageArrived = message => {
  log.debug(
    'Message arrived at topic: ',
    message.destinationName,
    message.payloadString,
  );
  sendMessageToListeners(message.destinationName, message);
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
