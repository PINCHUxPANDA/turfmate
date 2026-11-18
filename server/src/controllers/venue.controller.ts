import { Request, Response, NextFunction } from 'express';
import { SportType } from '@prisma/client';
import { VenueService } from '../services/venue.service';
import { AppError } from '../utils/AppError';

export class VenueController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const venues = await VenueService.getVenues({
        city: req.query.city as string | undefined,
        sport: req.query.sport as SportType | undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      });
      res.status(200).json({ status: 'success', data: venues });
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
        const venue = await VenueService.getVenueById(req.params.id as string);
      if (!venue) return next(new AppError('Venue not found.', 404));
      res.status(200).json({ status: 'success', data: venue });
    } catch (err) {
      next(err);
    }
  }
}