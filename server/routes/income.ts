import { Router, Request, Response } from 'express';
import { Income } from '../types';
import { sql } from '../lib/db';

const router = Router();

// GET /api/income - Get all income records
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    
    let result;
    if (user_id) {
      result = await sql`
        SELECT * FROM income 
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM income 
        ORDER BY created_at DESC
      `;
    }

    res.json(result || []);
  } catch (error: any) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income records', details: error.message });
  }
});

// GET /api/income/:id - Get income by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      SELECT * FROM income 
      WHERE id = ${req.params.id}
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income record', details: error.message });
  }
});

// POST /api/income - Create a new income record
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, name, amount, source, date_received } = req.body;

    if (!user_id || !name || amount === undefined || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, name, amount, source' 
      });
    }

    const now = new Date().toISOString();
    const dateReceived = date_received || now;

    const result = await sql`
      INSERT INTO income (user_id, name, amount, source, date_received, created_at, updated_at)
      VALUES (${user_id}, ${name}, ${Number(amount)}, ${source}, ${dateReceived}, ${now}, ${now})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income record', details: error.message });
  }
});

// PUT /api/income/:id - Update income record
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, amount, source, date_received } = req.body;
    const updatedAt = new Date().toISOString();

    // First, get the existing record
    const existing = await sql`
      SELECT * FROM income WHERE id = ${req.params.id}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }

    // Update with template literal (use existing values if not provided)
    const result = await sql`
      UPDATE income 
      SET 
        name = ${name !== undefined ? name : existing[0].name},
        amount = ${amount !== undefined ? Number(amount) : existing[0].amount},
        source = ${source !== undefined ? source : existing[0].source},
        date_received = ${date_received !== undefined ? date_received : existing[0].date_received},
        updated_at = ${updatedAt}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income record', details: error.message });
  }
});

// DELETE /api/income/:id - Delete income record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM income 
      WHERE id = ${req.params.id}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income record', details: error.message });
  }
});

export { router as incomeRoutes };

