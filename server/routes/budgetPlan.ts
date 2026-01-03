import { Router, Request, Response } from 'express';
import { BudgetPlan } from '../types';
import { sql } from '../lib/db';

const router = Router();

// GET /api/budget-plans - Get all budget plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, active } = req.query;
    
    let result;
    if (user_id && active !== undefined) {
      result = await sql`
        SELECT * FROM budget_plans 
        WHERE user_id = ${user_id} AND active = ${active === 'true'}
        ORDER BY created_at DESC
      `;
    } else if (user_id) {
      result = await sql`
        SELECT * FROM budget_plans 
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
      `;
    } else if (active !== undefined) {
      result = await sql`
        SELECT * FROM budget_plans 
        WHERE active = ${active === 'true'}
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM budget_plans 
        ORDER BY created_at DESC
      `;
    }

    res.json(result || []);
  } catch (error: any) {
    console.error('Error fetching budget plans:', error);
    res.status(500).json({ error: 'Failed to fetch budget plans', details: error.message });
  }
});

// GET /api/budget-plans/:id - Get budget plan by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      SELECT * FROM budget_plans 
      WHERE id = ${req.params.id}
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching budget plan:', error);
    res.status(500).json({ error: 'Failed to fetch budget plan', details: error.message });
  }
});

// POST /api/budget-plans - Create a new budget plan
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      needs_percentage,
      wants_percentage,
      savings_percentage,
      active,
    } = req.body;

    if (
      !user_id ||
      needs_percentage === undefined ||
      wants_percentage === undefined ||
      savings_percentage === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, needs_percentage, wants_percentage, savings_percentage',
      });
    }

    const total = Number(needs_percentage) + Number(wants_percentage) + Number(savings_percentage);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        error: 'Percentages must sum to 100',
      });
    }

    // Deactivate other plans for the same user if this one is active
    if (active !== false) {
      await sql`
        UPDATE budget_plans 
        SET active = false 
        WHERE user_id = ${user_id} AND active = true
      `;
    }

    const now = new Date().toISOString();
    const result = await sql`
      INSERT INTO budget_plans (
        user_id, needs_percentage, wants_percentage, savings_percentage, 
        active, created_at, updated_at
      )
      VALUES (
        ${user_id},
        ${Number(needs_percentage)},
        ${Number(wants_percentage)},
        ${Number(savings_percentage)},
        ${active !== false},
        ${now},
        ${now}
      )
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Error creating budget plan:', error);
    res.status(500).json({ error: 'Failed to create budget plan', details: error.message });
  }
});

// PUT /api/budget-plans/:id - Update budget plan
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      needs_percentage,
      wants_percentage,
      savings_percentage,
      active,
    } = req.body;

    // Get existing plan first
    const existing = await sql`
      SELECT * FROM budget_plans WHERE id = ${req.params.id}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    // If percentages are being updated, validate they sum to 100
    if (
      needs_percentage !== undefined ||
      wants_percentage !== undefined ||
      savings_percentage !== undefined
    ) {
      const needs = needs_percentage !== undefined 
        ? Number(needs_percentage) 
        : existing[0].needs_percentage;
      const wants = wants_percentage !== undefined 
        ? Number(wants_percentage) 
        : existing[0].wants_percentage;
      const savings = savings_percentage !== undefined 
        ? Number(savings_percentage) 
        : existing[0].savings_percentage;

      const total = needs + wants + savings;
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({
          error: 'Percentages must sum to 100',
        });
      }
    }

    // If activating this plan, deactivate others for the same user
    if (active === true) {
      await sql`
        UPDATE budget_plans 
        SET active = false 
        WHERE user_id = ${existing[0].user_id} AND id != ${req.params.id} AND active = true
      `;
    }

    const updatedAt = new Date().toISOString();
    const result = await sql`
      UPDATE budget_plans 
      SET 
        needs_percentage = ${needs_percentage !== undefined ? Number(needs_percentage) : existing[0].needs_percentage},
        wants_percentage = ${wants_percentage !== undefined ? Number(wants_percentage) : existing[0].wants_percentage},
        savings_percentage = ${savings_percentage !== undefined ? Number(savings_percentage) : existing[0].savings_percentage},
        active = ${active !== undefined ? Boolean(active) : existing[0].active},
        updated_at = ${updatedAt}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating budget plan:', error);
    res.status(500).json({ error: 'Failed to update budget plan', details: error.message });
  }
});

// DELETE /api/budget-plans/:id - Delete budget plan
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM budget_plans 
      WHERE id = ${req.params.id}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Budget plan not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting budget plan:', error);
    res.status(500).json({ error: 'Failed to delete budget plan', details: error.message });
  }
});

export { router as budgetPlanRoutes };


