import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword, verifyPassword } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email en wachtwoord zijn verplicht' });
    }

    const user = await storage.getSystemUserByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }

    // Update last login
    await storage.updateSystemUser(user.id, { lastLogin: new Date() });

    // Set session
    req.session.userId = user.id;

    // Get school info if applicable
    let school = null;
    if (user.schoolId) {
      school = await storage.getSchool(user.schoolId);
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

    const user = await storage.getSystemUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Ongeldige sessie' });
    }

    // Get school info if applicable
    let school = null;
    if (user.schoolId) {
      school = await storage.getSchool(user.schoolId);
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