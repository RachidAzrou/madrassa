// Serverless functie voor Vercel deployment
import express from 'express';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';
import path from 'path';

// Configureer WebSocket voor Neon database
neonConfig.webSocketConstructor = ws;

// Controleer Database connectie
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL moet ingesteld zijn voor database verbinding');
}

// Serverless-vriendelijke pool configuratie
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

// Database instantie
const db = drizzle(getPool(), { schema });

// Express app instellen
const app = express();
app.use(express.json());

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

// API Gezondheidscheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Studenten endpoint
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.query.students.findMany();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Specifieke student endpoint
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.id, id)
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student niet gevonden' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Statische bestanden (voor productie)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(process.cwd(), 'dist/public');
  app.use(express.static(publicPath));
  
  // Alle overige routes naar index.html voor client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(500).json({ 
    error: 'Server Error', 
    message: err.message || 'Er is een onverwachte fout opgetreden' 
  });
});

// Vercel serverless handler
export default function(req, res) {
  return app(req, res);
}