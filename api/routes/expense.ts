import { Router, Request, Response } from 'express';
import { Expense } from '../types';
import { sql } from '../lib/db';

const router = Router();

// GET /api/expenses - Get all expense records
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, category } = req.query;
    
    let result;
    if (user_id && category) {
      result = await sql`
        SELECT * FROM expenses 
        WHERE user_id = ${user_id} AND category = ${category}
        ORDER BY created_at DESC
      `;
    } else if (user_id) {
      result = await sql`
        SELECT * FROM expenses 
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
      `;
    } else if (category) {
      result = await sql`
        SELECT * FROM expenses 
        WHERE category = ${category}
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM expenses 
        ORDER BY created_at DESC
      `;
    }

    res.json(result || []);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      SELECT * FROM expenses 
      WHERE id = ${req.params.id}
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense', details: error.message });
  }
});

// POST /api/expenses - Create a new expense record
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      name,
      amount,
      category,
      subcategory,
      is_recurring,
      recurring_interval,
      next_due_date,
    } = req.body;

    if (!user_id || !name || amount === undefined || !category || !subcategory) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, name, amount, category, subcategory',
      });
    }

    if (category !== 'needs' && category !== 'wants') {
      return res.status(400).json({ error: 'Category must be "needs" or "wants"' });
    }

    const validSubcategories = [
      'food',
      'transportation',
      'clothes',
      'toys',
      'gadgets',
      'travel',
      'utilities',
      'rent',
      'entertainment',
      'other',
    ];
    if (!validSubcategories.includes(subcategory)) {
      return res.status(400).json({ error: 'Invalid subcategory' });
    }

    const now = new Date().toISOString();
    const result = await sql`
      INSERT INTO expenses (
        user_id, name, amount, category, subcategory, 
        is_recurring, recurring_interval, next_due_date, 
        created_at, updated_at
      )
      VALUES (
        ${user_id}, 
        ${name}, 
        ${Number(amount)}, 
        ${category}, 
        ${subcategory},
        ${Boolean(is_recurring)},
        ${is_recurring && recurring_interval ? recurring_interval : null},
        ${is_recurring && next_due_date ? next_due_date : null},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense', details: error.message });
  }
});

// PUT /api/expenses/:id - Update expense record
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name,
      amount,
      category,
      subcategory,
      is_recurring,
      recurring_interval,
      next_due_date,
    } = req.body;
    const updatedAt = new Date().toISOString();

    // Get existing expense first
    const existing = await sql`
      SELECT * FROM expenses WHERE id = ${req.params.id}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate category if provided
    if (category && category !== 'needs' && category !== 'wants') {
      return res.status(400).json({ error: 'Category must be "needs" or "wants"' });
    }

    // Validate subcategory if provided
    if (subcategory) {
      const validSubcategories = [
        'food', 'transportation', 'clothes', 'toys', 'gadgets',
        'travel', 'utilities', 'rent', 'entertainment', 'other',
      ];
      if (!validSubcategories.includes(subcategory)) {
        return res.status(400).json({ error: 'Invalid subcategory' });
      }
    }

    const result = await sql`
      UPDATE expenses 
      SET 
        name = ${name !== undefined ? name : existing[0].name},
        amount = ${amount !== undefined ? Number(amount) : existing[0].amount},
        category = ${category !== undefined ? category : existing[0].category},
        subcategory = ${subcategory !== undefined ? subcategory : existing[0].subcategory},
        is_recurring = ${is_recurring !== undefined ? Boolean(is_recurring) : existing[0].is_recurring},
        recurring_interval = ${recurring_interval !== undefined ? recurring_interval : existing[0].recurring_interval},
        next_due_date = ${next_due_date !== undefined ? next_due_date : existing[0].next_due_date},
        updated_at = ${updatedAt}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense', details: error.message });
  }
});

// DELETE /api/expenses/:id - Delete expense record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM expenses 
      WHERE id = ${req.params.id}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense', details: error.message });
  }
});

export { router as expenseRoutes };


