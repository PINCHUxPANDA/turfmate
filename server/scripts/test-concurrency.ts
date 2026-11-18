import { prisma } from '../src/config/db';
import { MatchService } from '../src/services/match.service';

async function runConcurrencyTest() {
  // 1. Create a host and 5 test players
  const host = await prisma.user.create({
    data: { name: 'Host', email: `host_${Date.now()}@test.com`, city: 'Jaipur' },
  });

  const players = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: { name: `Player ${i}`, email: `p${i}_${Date.now()}@test.com`, city: 'Jaipur' },
      })
    )
  );

  // 2. Create a 2-player match (1 spot taken by host, ONLY 1 SPOT LEFT)
  const match = await MatchService.createMatch(host.id, {
    title: 'Concurrency Test Match',
    customLocation: 'Central Park Turf',
    city: 'Jaipur',
    sportType: 'BADMINTON',
    skillLevel: 'INTERMEDIATE',
    date: new Date(Date.now() + 86400000).toISOString(),
    maxPlayers: 2,
    costPerPerson: 100,
  });

  // 3. Fire all 5 join requests simultaneously via Promise.allSettled
  const results = await Promise.allSettled(
    players.map((p) => MatchService.joinMatch(match.id, p.id))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const rejected = results.filter((r) => r.status === 'rejected').length;

  console.log(`Total simultaneous requests: 5 | Spots available: 1`);
  console.log(`Succeeded: ${succeeded} (Expected: 1)`);
  console.log(`Rejected:  ${rejected} (Expected: 4)`);

  await prisma.$disconnect();
}

runConcurrencyTest();