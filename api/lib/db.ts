import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create a variable to hold the initialized client
let sqlInstance: any = null;

export function getSql() {
  if (sqlInstance) return sqlInstance;

  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL is not set.');
    return async () => { throw new Error('DATABASE_URL is missing'); };
  }

  try {
    sqlInstance = neon(connectionString);
    return sqlInstance;
  } catch (err) {
    console.error('❌ ERROR: Failed to initialize Neon client:', err);
    throw err;
  }
}

// Proxy the sql object so we don't have to change all the route files
export const sql = new Proxy(() => {}, {
  get(target, prop) {
    return getSql()[prop];
  },
  apply(target, thisArg, argumentsList) {
    return getSql()(...argumentsList);
  }
});

// Create Drizzle ORM instance lazily
export const db = drizzle(sql as any, { schema });

export const getDb = () => getSql();

