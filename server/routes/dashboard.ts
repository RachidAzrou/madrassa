import { Router, Request, Response } from 'express';
import { authenticate, authorize, requireSchoolContext } from '../middleware/auth';
import path from 'path';

const router = Router();

// Serve login page
router.get('/login', (req: Request, res: Response) => {
  res.render('login');
});

// Dashboard routes for each role
router.get('/dashboard/superadmin', 
  authenticate, 
  authorize(['superadmin']), 
  (req: Request, res: Response) => {
    res.render('superadmin/Dashboard', { user: req.user });
  }
);

router.get('/dashboard/directeur', 
  authenticate, 
  authorize(['directeur']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.render('directeur/Dashboard', { user: req.user });
  }
);

router.get('/dashboard/docent', 
  authenticate, 
  authorize(['docent']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.render('docent/Dashboard', { user: req.user });
  }
);

router.get('/dashboard/student', 
  authenticate, 
  authorize(['student']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.render('student/Dashboard', { user: req.user });
  }
);

router.get('/dashboard/ouder', 
  authenticate, 
  authorize(['ouder']), 
  requireSchoolContext,
  (req: Request, res: Response) => {
    res.render('ouder/Dashboard', { user: req.user });
  }
);

export default router;