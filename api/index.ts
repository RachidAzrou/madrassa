import { createServerlessApp } from './server';

// Express request handler voor Vercel serverless functies
export default async function handler(req: any, res: any) {
  try {
    // Initialiseer Express app voor serverless
    const app = await createServerlessApp();
    
    // Vercel serverless handler - correcte manier om Express app te runnen
    app(req, res);
    
    // We hoeven geen Promise terug te geven omdat Express de response afhandelt
  } catch (error) {
    console.error('Serverless error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Er is een fout opgetreden bij het verwerken van het verzoek.',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}