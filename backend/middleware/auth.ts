import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { Model, Document } from 'mongoose';

// Extend Express Request to include user and resource
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      resource?: any;
    }
    interface SessionData {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// Check if user is authenticated
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  // Check session first
  if (req.session && req.session.user) {
    const user = await User.findById(req.session.user.id);
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JWTPayload;
      
      // Fetch full user object from database using userId from token
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not found' }
        });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
    }
  }
  
  return res.status(401).json({
    success: false,
    error: { message: 'Authentication required' }
  });
};

// Check if user is the owner of a resource
export const isOwner = <T extends Document & { author: string }>(Model: Model<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: { message: 'Resource not found' }
        });
      }
      
      if (!req.user || resource.author !== req.user.username) {
        return res.status(403).json({
          success: false,
          error: { message: 'Unauthorized: You do not own this resource' }
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't fail if not authenticated)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.session && req.session.user) {
    const user = await User.findById(req.session.user.id);
    if (user) {
      req.user = user;
    }
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JWTPayload;
      
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }
  
  next();
};
