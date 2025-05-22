import './server';
import { paxos } from './utils/paxos.ts';
import { Logger } from './utils/logger.ts';
import { Elysia, t } from 'elysia';
import { interpret } from 'xstate';
import { mqttClient } from './mqtt-server.ts';
// import ip from 'ip';

const log = Logger.extend('Server');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000');
// const JOIN_SERVER_IP = process.env.JOIN_SERVER_IP;

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
  .listen(SERVER_PORT);

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
