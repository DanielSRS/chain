import './server';
import { paxos } from './utils/paxos.ts';
import { Logger } from './utils/logger.ts';
import { Elysia, t } from 'elysia';
import { interpret } from 'xstate';
import { mqttClient } from './mqtt-server.ts';
import ip from 'ip';
import { startupMachine } from './machines/startup.machine.ts';
import { STATIONS } from './data/data.ts';
import { waitFor } from 'xstate/lib/waitFor.js';

const log = Logger.extend('Server');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000');
const JOIN_SERVER_IP = process.env.JOIN_SERVER_IP;

const startup = interpret(startupMachine).start();
startup.send({
  type: 'SET_CONTEXT',
  data: {
    address: ip.address() + ':' + SERVER_PORT,
    name: process.env.SERVER_NAME || 'Server' + process.pid,
    log: Logger.extend('Startup-Machine'),
    groupMemberAddress: JOIN_SERVER_IP,
    stations: STATIONS,
  },
});

const state = await waitFor(
  startup,
  state => state.matches('Joined') || state.matches('CreateGroup'),
);

log.warn('end value', state.value);
log.warn('IP address', state.context.address);

const app = new Elysia()
  .decorate('machine', interpret(paxos).start())
  .decorate('mqttClient', mqttClient)
  .get('/', () => 'Hello Elysia')
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
  )
  .post(
    '/connect',
    ({ body }) => {
      const { event } = body;
      log.info('connection request:', event);
      return 'Connection request received';
    },
    {
      body: t.Object({
        event: t.Object({
          type: t.Literal('JOIN_GROUP'),
          data: t.Any(),
        }),
      }),
      response: t.String(),
    },
  )
  .listen(SERVER_PORT);

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
