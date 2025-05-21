// Simpele adapter voor Vercel serverless
import express from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';

// Maak een Express app voor serverless
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers
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
let routesRegistered = false;
let routePromise = null;

// Handler voor Vercel serverless
export default async function handler(req, res) {
  try {
    // Registreer routes alleen één keer
    if (!routesRegistered) {
      if (!routePromise) {
        routePromise = registerRoutes(app);
      }
      await routePromise;
      
      // Error handler
      app.use((err, _req, res, _next) => {
        console.error('Server error:', err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Interne Server Fout";
        
        res.status(status).json({ message });
      });
      
      // Statische bestanden serveren
      serveStatic(app);
      
      routesRegistered = true;
    }
    
    // Verwerk aanvraag
    app(req, res);
  } catch (error) {
    console.error('Serverless error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Er is een fout opgetreden bij het verwerken van het verzoek.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}