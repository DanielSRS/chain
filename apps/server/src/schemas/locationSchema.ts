import { z } from 'zod';

export const locationSchema = z.object({
  x: z.number(),
  y: z.number(),
});
