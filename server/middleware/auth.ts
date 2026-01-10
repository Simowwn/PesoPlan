import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided. Please include a Bearer token in the Authorization header.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      req.userId = decoded.userId;
      req.user = { id: decoded.userId, email: decoded.email };
      next();
    } catch (error) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Failed to authenticate request'
    });
    return;
  }
};

/**
 * Optional authentication - doesn't fail if no token is provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
        req.userId = decoded.userId;
        req.user = { id: decoded.userId, email: decoded.email };
      } catch {
        // Invalid token, but continue without auth
      }
    }
    next();
  } catch {
    next();
  }
};


