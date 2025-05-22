// Minimale API voor studenten endpoints
import { createPool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema';

// Database connectie voor serverless
const pool = createPool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Handler voor studenten API
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS request afhandelen
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Alleen GET verzoeken verwerken
  if (req.method === 'GET') {
    try {
      const students = await db.select().from(schema.students);
      return res.status(200).json(students);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
  }
  
  // Andere methodes niet ondersteund
  return res.status(405).json({ error: 'Method not allowed' });
}