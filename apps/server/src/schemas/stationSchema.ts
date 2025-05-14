import { z } from 'zod';
import { locationSchema } from './locationSchema.ts';

export const stationSchema = z.object({
  id: z.number(),
  location: locationSchema,
  state: z
    .literal('avaliable')
    .or(z.literal('charging-car'))
    .or(z.literal('reserved')),
  reservations: z.array(z.number()).max(0),
  suggestions: z.array(z.number()).max(0),
});
