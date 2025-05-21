import express, { Express, Request, Response } from 'express';
import path from 'path';
import { registerRoutes } from '../server/routes';
import { log } from '../server/vite';

export async function createServerlessApp() {
  // Maak Express app
  const app = express();
  
  // JSON body parsing
  app.use(express.json());
  
  // Registreer API routes
  await registerRoutes(app);
  
  // Statische bestanden uit dist folder
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(publicPath));
  }

  // Algemene error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    log(`Error: ${err.message}`);
    res.status(500).json({ error: 'Er is een fout opgetreden op de server' });
  });

  return app;
}