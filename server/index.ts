// Load environment variables first
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { incomeRoutes } from "./routes/income";
import { expenseRoutes } from "./routes/expense";
import { budgetPlanRoutes } from "./routes/budgetPlan";
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/auth";
import { handleError } from "./utils/errors";
import { validateEnv } from "./utils/env";

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error(
    "❌ Environment validation failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : NODE_ENV === "production"
    ? false
    : ["http://localhost:8080", "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware (development only)
if (NODE_ENV === "development") {
  app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budget-plans", budgetPlanRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use(
  (err: Error, req: Request, res: Response, next: express.NextFunction) => {
    handleError(err, res);
  }
);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
});
