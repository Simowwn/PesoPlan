import { Router, Request, Response } from 'express';
import { User } from '../types';
import { sql } from '../lib/db';

const router = Router();

// GET /api/users - Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      SELECT * FROM users 
      ORDER BY created_at DESC
    `;
    res.json(result || []);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE id = ${req.params.id}
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await sql`
      INSERT INTO users (email, created_at)
      VALUES (${email}, ${new Date().toISOString()})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Get existing user first
    const existing = await sql`
      SELECT * FROM users WHERE id = ${req.params.id}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await sql`
      UPDATE users 
      SET email = ${email}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM users 
      WHERE id = ${req.params.id}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

export { router as userRoutes };


