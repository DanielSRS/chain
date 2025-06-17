import type Paho from 'paho-mqtt';
import { curry } from '../utils/curry.ts';
import type {
  MqttApiRequest,
  MqttApiRequestHandler,
  MqttApiEndpointsKeys,
} from '../utils/types.ts';
import { z } from 'zod';

export type ServerRouter = (request: MqttApiRequest) => () => void;

type Routes<T extends MqttApiEndpointsKeys> = Record<
  T,
  MqttApiRequestHandler<T>
>;

export const mqttConnectionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cities'),
    data: z.object({}),
  }),
  z.object({
    type: z.literal('routes'),
    data: z.object({
      departure: z.string(),
      destination: z.string(),
    }),
  }),
  z.object({
    type: z.literal('reserveMultipleStations'),
    data: z.object({
      stationIds: z.array(z.number()),
      userId: z.number(),
      startTime: z.number(),
      estimatedStopTimes: z.array(z.number()),
    }),
  }),
]);

export function createRouter() {
  const routes: Partial<Routes<MqttApiEndpointsKeys>> = {};
  const s = {
    add<T extends MqttApiEndpointsKeys>(path: T, fn: MqttApiRequestHandler<T>) {
      routes[path] = fn as unknown as (typeof routes)[T];
      return s;
    },
    all() {
      return routes;
    },
    validateAndDispach(request: Paho.Message) {
      // verifica se os dados estão no formato esperado
      const data = mqttConnectionSchema.safeParse({
        type: request.destinationName,
        data: JSON.parse(request.payloadString),
      });
      if (!data.success) {
        return {
          responseTopic: request.destinationName,
          data: {
            message: 'erro',
            success: false,
            error: data.error,
          },
        };
      }
      return s.all()[data.data.type]?.(data.data.data);
    },
  };
  return s;
}

export const serverRouter = curry(
  (routes: Routes<MqttApiEndpointsKeys>, request: MqttApiRequest) => {
    return routes[request.type];
  },
);
