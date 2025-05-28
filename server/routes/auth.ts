import { Router, Request, Response } from 'express';
import { db } from '../db';
import { systemUsers, schools } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email en wachtwoord zijn verplicht' });
    }

    // Find user by email
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
    
    if (!user) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.schoolId = user.schoolId || undefined;

    // Get school info if applicable
    let school = null;
    if (user.schoolId) {
      const [schoolData] = await db.select().from(schools).where(eq(schools.id, user.schoolId));
      school = schoolData;
    }

    res.json({
      message: 'Succesvol ingelogd',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        school
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server fout bij inloggen' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Fout bij uitloggen' });
    }
    res.json({ message: 'Succesvol uitgelogd' });
  });
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Niet ingelogd' });
    }

    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, userId));
    if (!user) {
      return res.status(401).json({ message: 'Ongeldige sessie' });
    }

    // Get school info if applicable
    let school = null;
    if (user.schoolId) {
      const [schoolData] = await db.select().from(schools).where(eq(schools.id, user.schoolId));
      school = schoolData;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      school
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Fout bij ophalen gebruiker' });
  }
});

export default router;