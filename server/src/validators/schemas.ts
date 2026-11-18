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

export const createMatchSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    venueId: z.string().uuid().optional(),
    customLocation: z.string().optional(),
    city: z.string().min(2),
    sportType: z.enum(['FOOTBALL', 'CRICKET', 'BASKETBALL', 'PICKLEBALL', 'BADMINTON']),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
    date: z.string().datetime(),
    maxPlayers: z.number().int().min(2).max(30),
    costPerPerson: z.number().min(0),
  }),
});