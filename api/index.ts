import express, { Request, Response } from 'express';
import cors from 'cors';
import { incomeRoutes } from './routes/income.js';
import { expenseRoutes } from './routes/expense.js';
import { budgetPlanRoutes } from './routes/budgetPlan.js';
import { userRoutes } from './routes/user.js';
import { authRoutes } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Root route for testing
app.get('/api', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'PesoPlan API is running' });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget-plans', budgetPlanRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export the app for Vercel
export default app;

// Only listen if running locally
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}


