import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: { userId: string; role: Role };
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Authentication required. Please log in.', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: Role };
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired session token.', 401));
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};