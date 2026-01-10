// Load environment variables first
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not set. Database operations will fail.');
}

// Create Neon HTTP client (returns a tagged template function)
const sql = neon(connectionString);

// Create Drizzle ORM instance (optional, for type-safe queries)
export const db = drizzle(sql, { schema });

// Export raw SQL client for direct queries
// Usage: await sql`SELECT * FROM income WHERE id = ${id}`
export { sql };

// Helper function to get a database connection
export const getDb = () => sql;

