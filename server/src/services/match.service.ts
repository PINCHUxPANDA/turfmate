import { MatchStatus, SkillLevel, SportType } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';

export class MatchService {
  static async completeMatchAndScore(
    matchId: string,
    hostId: string,
    attendanceList: Array<{ userId: string; attended: boolean }>
  ) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId } });
      if (!match) throw new AppError('Match not found.', 404);
      if (match.hostId !== hostId) throw new AppError('Only the match host can complete this match.', 403);
      if (match.status === MatchStatus.COMPLETED) throw new AppError('Match is already completed.', 400);
  
      // Update each participant's attendance and recalculate reliabilityRating (1.0 - 5.0)
      for (const record of attendanceList) {
        await tx.matchParticipant.update({
          where: { matchId_userId: { matchId, userId: record.userId } },
          data: { attended: record.attended },
        });
  
        const user = await tx.user.findUnique({ where: { id: record.userId } });
        if (user) {
          // +0.1 reward for showing up, -0.5 penalty for ghosting (clamped between 1.0 and 5.0)
          const delta = record.attended ? 0.1 : -0.5;
          const nextRating = Math.min(5.0, Math.max(1.0, Number((user.reliabilityRating + delta).toFixed(2))));
  
          await tx.user.update({
            where: { id: record.userId },
            data: {
              reliabilityRating: nextRating,
              totalMatches: { increment: 1 },
            },
          });
        }
      }
  
      return tx.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.COMPLETED },
      });
    });
  }

  static async getMatches(filters: { city?: string; sport?: SportType }) {
    return prisma.match.findMany({
      where: {
        ...(filters.city && { city: { equals: filters.city, mode: 'insensitive' } }),
        ...(filters.sport && { sportType: filters.sport }),
        status: { in: [MatchStatus.OPEN, MatchStatus.FILLING_FAST, MatchStatus.FULL] },
      },
      include: {
        host: { select: { id: true, name: true, reliabilityRating: true } },
        venue: { select: { id: true, name: true, location: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { date: 'asc' },
    });
  }
  static async getMatchById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      include: {
        host: { select: { id: true, name: true, reliabilityRating: true } },
        venue: true,
        participants: {
          include: { user: { select: { id: true, name: true, reliabilityRating: true } } },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });
  }

  static async createMatch(hostId: string, data: {
    title: string;
    venueId?: string;
    customLocation?: string;
    city: string;
    sportType: SportType;
    skillLevel: SkillLevel;
    date: string;
    maxPlayers: number;
    costPerPerson: number;
  }) {
    if (!data.venueId && !data.customLocation) {
      throw new AppError('Provide either a registered venue or a custom public ground location.', 400);
    }

    return prisma.match.create({
      data: {
        ...data,
        hostId,
        date: new Date(data.date),
        status: MatchStatus.OPEN,
        participants: { create: { userId: hostId } }, // Host automatically takes spot #1
      },
      include: {
        host: { select: { id: true, name: true, reliabilityRating: true } },
        venue: true,
        participants: { include: { user: { select: { id: true, name: true, reliabilityRating: true } } } },
      },
    });
  }

  // ACID Transaction to prevent double-booking or overfilling a lobby
  static async joinMatch(matchId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Lock the match row in PostgreSQL until transaction finishes
      const lockedRows = await tx.$queryRaw<Array<{ id: string; maxPlayers: number; status: MatchStatus }>>`
        SELECT id, "maxPlayers", status FROM "Match" WHERE id = ${matchId} FOR UPDATE
      `;

      const match = lockedRows[0];
      if (!match) throw new AppError('Match not found.', 404);
      if (match.status === MatchStatus.FULL || match.status === MatchStatus.CANCELLED || match.status === MatchStatus.COMPLETED) {
        throw new AppError(`Cannot join a match with status ${match.status}.`, 400);
      }

      const alreadyJoined = await tx.matchParticipant.findUnique({
        where: { matchId_userId: { matchId, userId } },
      });
      if (alreadyJoined) throw new AppError('You have already joined this match.', 409);

      const currentCount = await tx.matchParticipant.count({ where: { matchId } });
      if (currentCount >= match.maxPlayers) {
        throw new AppError('Match lobby is already full.', 400);
      }

      // Insert participant
      await tx.matchParticipant.create({ data: { matchId, userId } });

      // Update match lifecycle status dynamically
      const newCount = currentCount + 1;
      let nextStatus: MatchStatus = MatchStatus.OPEN;
      if (newCount >= match.maxPlayers) {
        nextStatus = MatchStatus.FULL;
      } else if (newCount / match.maxPlayers >= 0.75) {
        nextStatus = MatchStatus.FILLING_FAST;
      }

      return tx.match.update({
        where: { id: matchId },
        data: { status: nextStatus },
        include: {
          participants: { include: { user: { select: { id: true, name: true, reliabilityRating: true } } } },
        },
      });
    });
  }
}