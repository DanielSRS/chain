import { z } from 'zod';
import { locationSchema } from './locationSchema';

export const carSchema = z.object({
  id: z.number(),
  location: locationSchema,
});
