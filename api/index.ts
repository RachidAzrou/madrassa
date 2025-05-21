import { createServerlessApp } from './server';

// Express request handler voor Vercel serverless functies
export default async function handler(req: any, res: any) {
  try {
    // Initialiseer Express app voor serverless
    const app = await createServerlessApp();
    
    // Verwerk het verzoek met Express
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