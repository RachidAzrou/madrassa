import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { UserRole } from '../../shared/schema';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: UserRole;
        schoolId: number | null;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// Middleware to check if user is authenticated
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // In development, simulate authentication by checking session or headers
    const userId = req.session?.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, Number(userId)));
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Middleware to check if user has required role(s)
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient privileges',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

// Middleware to filter data by school (multi-tenancy)
export function enforceSchoolAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Superadmin can access all schools
  if (req.user.role === 'superadmin') {
    next();
    return;
  }

  // Other users can only access their own school data
  if (!req.user.schoolId) {
    return res.status(403).json({ message: 'No school access' });
  }

  // Add school filter to request for database queries
  req.query.schoolId = req.user.schoolId.toString();
  
  next();
}

// Development helper: Set a test user in session
export function setTestUser(userId: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      req.session = {} as any;
    }
    req.session.userId = userId;
    next();
  };
}