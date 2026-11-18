import { PrismaClient, Role, SportType, SkillLevel, MatchStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Sample Users
  const owner = await prisma.user.upsert({
    where: { email: 'owner@turfmate.com' },
    update: {},
    create: {
      name: 'Vikram Rathore',
      email: 'owner@turfmate.com',
      passwordHash,
      role: Role.VENUE_OWNER,
      city: 'Jaipur',
    },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'aarav@turfmate.com' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      email: 'aarav@turfmate.com',
      passwordHash,
      role: Role.PLAYER,
      city: 'Jaipur',
      reliabilityRating: 4.9,
      sportsProfile: { preferredSports: ['FOOTBALL', 'CRICKET'], skillLevel: 'INTERMEDIATE' },
    },
  });

  // 2. Create Sample Verified Venue
  const venue = await prisma.venue.create({
    data: {
      ownerId: owner.id,
      name: 'KickOff Arena, Vaishali Nagar',
      city: 'Jaipur',
      location: 'Plot 42, Queens Road, Vaishali Nagar, Jaipur',
      coordinates: { lat: 26.9124, lng: 75.7873 },
      pricePerHour: 1800,
      sports: [SportType.FOOTBALL, SportType.CRICKET],
      amenities: ['Floodlights', 'Parking', 'Bibs', 'Drinking Water'],
      images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'],
      isVerified: true,
    },
  });

  // 3. Create Sample Open Match
  const match = await prisma.match.create({
    data: {
      hostId: player1.id,
      venueId: venue.id,
      title: '5v5 Floodlight Turf Showdown',
      city: 'Jaipur',
      sportType: SportType.FOOTBALL,
      skillLevel: SkillLevel.INTERMEDIATE,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      maxPlayers: 10,
      costPerPerson: 200,
      status: MatchStatus.OPEN,
      participants: {
        create: { userId: player1.id },
      },
    },
  });

  console.log('Seed completed:', { owner: owner.email, venue: venue.name, match: match.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });