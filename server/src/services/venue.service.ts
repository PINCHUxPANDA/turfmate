import { SportType } from '@prisma/client';
import { prisma } from '../config/db';

export class VenueService {
  static async getVenues(filters: { city?: string; sport?: SportType; maxPrice?: number }) {
    return prisma.venue.findMany({
      where: {
        ...(filters.city && { city: { equals: filters.city, mode: 'insensitive' } }),
        ...(filters.sport && { sports: { has: filters.sport } }),
        ...(filters.maxPrice && { pricePerHour: { lte: Number(filters.maxPrice) } }),
      },
      include: {
        timeSlots: { where: { isBooked: false, startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getVenueById(id: string) {
    return prisma.venue.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        timeSlots: { where: { startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' } },
      },
    });
  }
}