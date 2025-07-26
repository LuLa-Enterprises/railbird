import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { User } from '@railbird/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      io?: any;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Allow guest access for now
    req.user = {
      id: 'guest',
      isGuest: true,
      subscriptionTier: 'free',
      createdAt: new Date(),
      lastActiveAt: new Date()
    };
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
    if (err) {
      logger.warn('Invalid token provided:', err.message);
      // Still allow as guest
      req.user = {
        id: 'guest',
        isGuest: true,
        subscriptionTier: 'free',
        createdAt: new Date(),
        lastActiveAt: new Date()
      };
      return next();
    }

    req.user = decoded as User;
    next();
  });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.isGuest) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }
  next();
};

export const requireSubscription = (tier: 'premium' | 'pro') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const tierLevels = { free: 0, premium: 1, pro: 2 };
    const requiredLevel = tierLevels[tier];
    const userLevel = tierLevels[req.user.subscriptionTier];

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: `${tier} subscription required`
      });
      return;
    }

    next();
  };
};