import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// Create a variable to hold the initialized client
let sqlInstance: any = null;
let dbInstance: any = null;

export function getSql() {
  if (sqlInstance) return sqlInstance;

  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Please set it in Vercel settings.');
  }

  try {
    sqlInstance = neon(connectionString);
    return sqlInstance;
  } catch (err) {
    console.error('❌ Failed to initialize Neon client:', err);
    throw err;
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = drizzle(getSql(), { schema });
  return dbInstance;
}

// Export raw SQL client as a function proxy
export const sql = new Proxy(() => {}, {
  get(target, prop) {
    const s = getSql();
    return typeof s[prop] === 'function' ? s[prop].bind(s) : s[prop];
  },
  apply(target, thisArg, argumentsList) {
    return getSql()(...argumentsList);
  }
});

// Proxy for the db instance
export const db = new Proxy({} as any, {
  get(target, prop) {
    return getDb()[prop];
  }
});

