import { Router, Request, Response } from 'express';
import { sql } from '../lib/db';

const router = Router();

// POST /api/auth/signup - Create a new user account
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create user
    // TODO: Add password_hash column and hash password with bcrypt
    const result = await sql`
      INSERT INTO users (email, created_at)
      VALUES (${email}, ${new Date().toISOString()})
      RETURNING id, email, created_at
    `;

    const user = result[0];

    // For now, return user without token (simplified)
    // TODO: Implement JWT tokens once password hashing is added
    res.status(201).json({
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `;

    if (!result || result.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result[0];

    // TODO: Verify password hash once password_hash column is added
    // For now, we'll just return the user (temporary - no password check)
    res.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// GET /api/auth/me - Get current user by ID
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await sql`
      SELECT id, email, created_at FROM users WHERE id = ${userId}
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: result[0].id, email: result[0].email });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
});

export { router as authRoutes };

