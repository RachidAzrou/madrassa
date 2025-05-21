import express from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';

// Een express app instance voor serverless omgeving
export async function createServerlessApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // CORS headers toevoegen voor API routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Registreer routes
  const server = await registerRoutes(app);
  
  // Foutafhandeling
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Interne Server Fout";
    
    res.status(status).json({ message });
  });
  
  // Statische bestanden serveren in productie
  serveStatic(app);
  
  return app;
}