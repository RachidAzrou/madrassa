import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure websocket for Neon database
neonConfig.webSocketConstructor = ws;

// Verify DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL moet ingesteld zijn. Heb je vergeten een database toe te voegen?",
  );
}

// Database connection options for better serverless performance
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients
  connectionTimeoutMillis: 5000, // 5 seconds
  idleTimeoutMillis: 30000, // 30 seconds
};

// Create the pool and db connection
export const pool = new Pool(connectionOptions);

// Set up connection error handler
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Don't crash the app - let it attempt reconnection
});

// Create drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

// Health check function to test the connection
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { connected: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Database connection check failed:', error);
    return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}