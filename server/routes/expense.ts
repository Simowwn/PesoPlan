import { Router, Request, Response } from 'express';
import { Expense } from '../types';

const router = Router();

// In-memory storage (replace with database in production)
let expenses: Expense[] = [
  {
    id: '1',
    user_id: '1',
    name: 'Groceries',
    amount: 5000,
    category: 'needs',
    subcategory: 'food',
    is_recurring: true,
    recurring_interval: 'monthly',
    next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// GET /api/expenses - Get all expense records
router.get('/', (req: Request, res: Response) => {
  const { user_id, category } = req.query;
  
  let filteredExpenses = expenses;
  if (user_id) {
    filteredExpenses = filteredExpenses.filter((e) => e.user_id === user_id);
  }
  if (category) {
    filteredExpenses = filteredExpenses.filter((e) => e.category === category);
  }

  res.json(filteredExpenses);
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', (req: Request, res: Response) => {
  const expense = expenses.find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json(expense);
});

// POST /api/expenses - Create a new expense record
router.post('/', (req: Request, res: Response) => {
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
  const newExpense: Expense = {
    id: Date.now().toString(),
    user_id,
    name,
    amount: Number(amount),
    category,
    subcategory,
    is_recurring: Boolean(is_recurring),
    ...(is_recurring && recurring_interval && { recurring_interval }),
    ...(is_recurring && next_due_date && { next_due_date }),
    created_at: now,
    updated_at: now,
  };

  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id - Update expense record
router.put('/:id', (req: Request, res: Response) => {
  const expenseIndex = expenses.findIndex((e) => e.id === req.params.id);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const {
    name,
    amount,
    category,
    subcategory,
    is_recurring,
    recurring_interval,
    next_due_date,
  } = req.body;

  const updatedExpense: Expense = {
    ...expenses[expenseIndex],
    ...(name && { name }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(category && { category }),
    ...(subcategory && { subcategory }),
    ...(is_recurring !== undefined && { is_recurring: Boolean(is_recurring) }),
    ...(recurring_interval && { recurring_interval }),
    ...(next_due_date && { next_due_date }),
    updated_at: new Date().toISOString(),
  };

  expenses[expenseIndex] = updatedExpense;
  res.json(updatedExpense);
});

// DELETE /api/expenses/:id - Delete expense record
router.delete('/:id', (req: Request, res: Response) => {
  const expenseIndex = expenses.findIndex((e) => e.id === req.params.id);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expenses.splice(expenseIndex, 1);
  res.status(204).send();
});

export { router as expenseRoutes };

