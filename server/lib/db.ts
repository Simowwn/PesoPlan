// Load environment variables first
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.warn("⚠️  DATABASE_URL not set. Database operations will fail.");
}

// Create a connection pool
const pool = new Pool({
  connectionString,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Helper function to get the pool for direct access if needed
export const getDb = () => pool;
