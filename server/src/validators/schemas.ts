import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    city: z.string().default('Jaipur'),
    role: z.enum(['PLAYER', 'VENUE_OWNER']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const completeMatchSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    attendees: z
      .array(
        z.object({
          userId: z.string().uuid(),
          attended: z.boolean(),
        })
      )
      .min(1, 'At least one participant attendance record is required'),
  }),
});