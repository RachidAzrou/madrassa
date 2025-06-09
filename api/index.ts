import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error('Server error:', err);
  res.status(status).json({ message });
});

// Initialize app for serverless
async function initServerlessApp() {
  try {
    await registerRoutes(app);
    serveStatic(app);
    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

let appPromise: Promise<express.Application> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appPromise) {
      appPromise = initServerlessApp();
    }
    
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}