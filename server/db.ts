import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configureer WebSocket voor Neon database
neonConfig.webSocketConstructor = ws;

// Controleer of DATABASE_URL beschikbaar is
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL moet ingesteld zijn. Heb je vergeten een database toe te voegen?",
  );
}

// Serverless-vriendelijke pool configuratie
let poolInstance: Pool | null = null;

// Functie om een pool te krijgen of te maken
function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1, // Beperkt aantal verbindingen voor serverless
    });
  }
  return poolInstance;
}

// Exporteer de pool en db instantie
export const pool = getPool();
export const db = drizzle(pool, { schema });