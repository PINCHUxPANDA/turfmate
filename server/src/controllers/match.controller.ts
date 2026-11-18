import { Request, Response, NextFunction } from 'express';
import { SportType } from '@prisma/client';
import { MatchService } from '../services/match.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getIO } from '../sockets/socket';

export class MatchController {
  static async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.id as string;
      const match = await MatchService.completeMatchAndRate(
        matchId,
        req.user!.userId,
        req.body.attendance
      );
      res.status(200).json({ status: 'success', data: match });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await MatchService.getMatches({
        city: req.query.city as string | undefined,
        sport: req.query.sport as SportType | undefined,
      });
      res.status(200).json({ status: 'success', data: matches });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.id as string;
      const match = await MatchService.getMatchById(matchId);
      if (!match) return res.status(404).json({ status: 'fail', message: 'Match not found' });
      res.status(200).json({ status: 'success', data: match });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await MatchService.createMatch(req.user!.userId, req.body);
      res.status(201).json({ status: 'success', data: match });
    } catch (err) {
      next(err);
    }
  }

  static async join(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.id as string;
      const updatedMatch = await MatchService.joinMatch(matchId, req.user!.userId);

      // Broadcast real-time slot count & roster update to the match lobby
      getIO().to(`match:${matchId}`).emit('lobby_updated', {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        participants: updatedMatch.participants,
        currentPlayers: updatedMatch.participants.length,
      });

      res.status(200).json({ status: 'success', data: updatedMatch });
    } catch (err) {
      next(err);
    }
  }
}