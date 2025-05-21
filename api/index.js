// Serverless adapter voor Vercel
import express from 'express';
import bodyParser from 'body-parser';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Configureer WebSocket voor serverless
neonConfig.webSocketConstructor = ws;

// Controleer of DATABASE_URL beschikbaar is
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL moet ingesteld zijn voor Vercel deployment');
}

// Singleton pattern voor database connectie in serverless
let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1 // Beperkt aantal verbindingen voor serverless
    });
  }
  return poolInstance;
}

// Creëer drizzle instance met pool
const db = drizzle(getPool(), { schema });

// Express app instellen
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS headers voor API aanvragen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basis API routes instellen
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Studenten route voorbeeld
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.query.students.findMany({
      orderBy: (students, { desc }) => [desc(students.createdAt)]
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Meer routes hier...
// Voeg meer routes toe op basis van je behoeften

// Foutafhandeling voor API
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(500).json({ 
    error: 'Server Error', 
    message: err.message || 'Er is een onverwachte fout opgetreden'
  });
});

// Vercel serverless handler
export default async function handler(req, res) {
  return new Promise((resolve) => {
    app(req, res, (result) => {
      resolve(result);
    });
  });
}