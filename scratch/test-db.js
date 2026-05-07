import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const sql = neon(connectionString);

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  console.log(`Testing signup with email: ${email}`);
  
  try {
    const result = await sql`
      INSERT INTO users (email, created_at)
      VALUES (${email}, ${new Date().toISOString()})
      RETURNING id, email, created_at
    `;
    console.log('Success:', JSON.stringify(result[0]));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSignup();
