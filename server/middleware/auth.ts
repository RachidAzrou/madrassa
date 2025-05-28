import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        schoolId?: number;
        school?: {
          id: number;
          name: string;
          code: string;
        };
      };
    }
  }
}

// Authentication middleware
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getSystemUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid user session' });
    }

    // Get school information if user has a school
    let school = null;
    if (user.schoolId) {
      school = await storage.getSchool(user.schoolId);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      school
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Authorization middleware
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// School isolation middleware - filters data by school_id
export function requireSchoolContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Superadmin can access all schools
  if (req.user.role === 'superadmin') {
    return next();
  }

  // All other roles must have a school_id
  if (!req.user.schoolId) {
    return res.status(403).json({ message: 'School context required' });
  }

  next();
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}