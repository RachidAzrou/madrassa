import { Router, Request, Response } from 'express';
import { authenticate, authorize, requireSchoolContext } from '../middleware/auth';
import path from 'path';

const router = Router();

// Serve login page
router.get('/login', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'views', 'login.html'));
});

// Dashboard routes for each role
router.get('/dashboard/superadmin', 
  authenticate, 
  authorize(['superadmin']), 
  (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'views', 'superadmin', 'Dashboard.html'));
  }
);

router.get('/dashboard/directeur', 
  authenticate, 
  authorize(['directeur']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'views', 'directeur', 'Dashboard.html'));
  }
);

router.get('/dashboard/docent', 
  authenticate, 
  authorize(['docent']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'views', 'docent', 'Dashboard.html'));
  }
);

router.get('/dashboard/student', 
  authenticate, 
  authorize(['student']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'views', 'student', 'Dashboard.html'));
  }
);

router.get('/dashboard/ouder', 
  authenticate, 
  authorize(['ouder']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'views', 'ouder', 'Dashboard.html'));
  }
);

export default router;