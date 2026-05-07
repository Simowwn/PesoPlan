import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not set in environment variables.');
}

// Create Neon HTTP client with a fallback to prevent immediate crash
let sql: any;
try {
  if (connectionString) {
    sql = neon(connectionString);
  } else {
    // Mock sql function to prevent crashes during initialization
    sql = async () => { 
      throw new Error('Database connection string is missing. Please set DATABASE_URL.'); 
    };
  }
} catch (err) {
  console.error('❌ ERROR: Failed to initialize Neon client:', err);
  sql = async () => { throw err; };
}

// Create Drizzle ORM instance
export const db = drizzle(sql, { schema });

// Export raw SQL client
export { sql };

export const getDb = () => sql;

