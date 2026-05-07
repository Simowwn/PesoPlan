import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export default function handler(req, res) {
  try {
    const testNeon = typeof neon;
    const testDrizzle = typeof drizzle;
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Database drivers loaded successfully',
      neon_type: testNeon,
      drizzle_type: testDrizzle
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to load database drivers',
      error: err.message 
    });
  }
}
