import { Router, Request, Response } from 'express';
import { User } from '../types';

const router = Router();

// In-memory storage (replace with database in production)
let users: User[] = [
  {
    id: '1',
    email: 'user@example.com',
    created_at: new Date().toISOString(),
  },
];

// GET /api/users - Get all users
router.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// POST /api/users - Create a new user
router.post('/', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /api/users/:id - Update user
router.put('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { email } = req.body;
  if (email) {
    users[userIndex] = { ...users[userIndex], email };
  }

  res.json(users[userIndex]);
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.status(204).send();
});

export { router as userRoutes };

