import { z } from 'zod';
import { carSchema } from './carSchema.ts';
import { stationSchema } from './stationSchema.ts';
import { userSchema } from './userSchema.ts';

export const connectionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('reserve'),
    data: z.object({
      userId: z.number(),
      stationId: z.number(),
    }),
  }),
  z.object({
    type: z.literal('getSuggestions'),
    data: carSchema,
  }),
  z.object({
    type: z.literal('registerStation'),
    data: stationSchema,
  }),
  z.object({
    type: z.literal('registerUser'),
    data: userSchema,
  }),
  z.object({
    type: z.literal('startCharging'),
    data: z.object({
      stationId: z.number(),
      userId: z.number(),
      battery_level: z.number(),
    }),
  }),
  z.object({
    type: z.literal('endCharging'),
    data: z.object({
      stationId: z.number(),
      userId: z.number(),
      battery_level: z.number(),
    }),
  }),
  z.object({
    type: z.literal('rechargeList'),
    data: z.object({
      userId: z.number(),
    }),
  }),
  z.object({
    type: z.literal('payment'),
    data: z.object({
      userId: z.number(),
      chargeId: z.number(),
      hasPaid: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal('getStationInfo'),
    data: z.object({
      id: z.number(),
    }),
  }),
]);
