import { Router, Request, Response } from 'express';
import { BudgetPlan } from '../types';

const router = Router();

// In-memory storage (replace with database in production)
let budgetPlans: BudgetPlan[] = [
  {
    id: '1',
    user_id: '1',
    needs_percentage: 50,
    wants_percentage: 30,
    savings_percentage: 20,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// GET /api/budget-plans - Get all budget plans
router.get('/', (req: Request, res: Response) => {
  const { user_id, active } = req.query;
  
  let filteredPlans = budgetPlans;
  if (user_id) {
    filteredPlans = filteredPlans.filter((p) => p.user_id === user_id);
  }
  if (active !== undefined) {
    filteredPlans = filteredPlans.filter((p) => p.active === (active === 'true'));
  }

  res.json(filteredPlans);
});

// GET /api/budget-plans/:id - Get budget plan by ID
router.get('/:id', (req: Request, res: Response) => {
  const plan = budgetPlans.find((p) => p.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Budget plan not found' });
  }
  res.json(plan);
});

// POST /api/budget-plans - Create a new budget plan
router.post('/', (req: Request, res: Response) => {
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

  // Deactivate other plans for the same user
  if (active !== false) {
    budgetPlans.forEach((plan) => {
      if (plan.user_id === user_id) {
        plan.active = false;
      }
    });
  }

  const now = new Date().toISOString();
  const newPlan: BudgetPlan = {
    id: Date.now().toString(),
    user_id,
    needs_percentage: Number(needs_percentage),
    wants_percentage: Number(wants_percentage),
    savings_percentage: Number(savings_percentage),
    active: active !== false,
    created_at: now,
    updated_at: now,
  };

  budgetPlans.push(newPlan);
  res.status(201).json(newPlan);
});

// PUT /api/budget-plans/:id - Update budget plan
router.put('/:id', (req: Request, res: Response) => {
  const planIndex = budgetPlans.findIndex((p) => p.id === req.params.id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Budget plan not found' });
  }

  const {
    needs_percentage,
    wants_percentage,
    savings_percentage,
    active,
  } = req.body;

  // If percentages are being updated, validate they sum to 100
  if (
    needs_percentage !== undefined ||
    wants_percentage !== undefined ||
    savings_percentage !== undefined
  ) {
    const needs = needs_percentage !== undefined 
      ? Number(needs_percentage) 
      : budgetPlans[planIndex].needs_percentage;
    const wants = wants_percentage !== undefined 
      ? Number(wants_percentage) 
      : budgetPlans[planIndex].wants_percentage;
    const savings = savings_percentage !== undefined 
      ? Number(savings_percentage) 
      : budgetPlans[planIndex].savings_percentage;

    const total = needs + wants + savings;
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        error: 'Percentages must sum to 100',
      });
    }
  }

  // If activating this plan, deactivate others for the same user
  if (active === true) {
    budgetPlans.forEach((plan) => {
      if (plan.user_id === budgetPlans[planIndex].user_id && plan.id !== req.params.id) {
        plan.active = false;
      }
    });
  }

  const updatedPlan: BudgetPlan = {
    ...budgetPlans[planIndex],
    ...(needs_percentage !== undefined && { needs_percentage: Number(needs_percentage) }),
    ...(wants_percentage !== undefined && { wants_percentage: Number(wants_percentage) }),
    ...(savings_percentage !== undefined && { savings_percentage: Number(savings_percentage) }),
    ...(active !== undefined && { active: Boolean(active) }),
    updated_at: new Date().toISOString(),
  };

  budgetPlans[planIndex] = updatedPlan;
  res.json(updatedPlan);
});

// DELETE /api/budget-plans/:id - Delete budget plan
router.delete('/:id', (req: Request, res: Response) => {
  const planIndex = budgetPlans.findIndex((p) => p.id === req.params.id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Budget plan not found' });
  }

  budgetPlans.splice(planIndex, 1);
  res.status(204).send();
});

export { router as budgetPlanRoutes };

