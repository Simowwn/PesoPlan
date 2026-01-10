import { Router } from "express";
import { db } from "../lib/db";
import { budgetPlanTable } from "../lib/schema";
import { eq, and, desc, not } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../utils/validation";
import {
  createBudgetPlanSchema,
  updateBudgetPlanSchema,
  getBudgetPlansQuerySchema,
} from "../validators/budgetPlan";
import {
  asyncHandler,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { schemas } from "../utils/validation";

const router = Router();

// All budget plan routes require authentication
router.use(authenticate);

// GET /api/budget-plans - Get all budget plans
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const query = validate(getBudgetPlansQuerySchema, req.query);
    const userId = req.userId!;

    // Users can only see their own budget plans
    const user_id = query.user_id || userId;

    if (user_id !== userId) {
      throw new UnauthorizedError("You can only access your own budget plans");
    }

    // Transform active string to boolean
    const active =
      query.active === "true"
        ? true
        : query.active === "false"
        ? false
        : undefined;

    const conditions = [eq(budgetPlanTable.userId, user_id)];
    if (active !== undefined) {
      conditions.push(eq(budgetPlanTable.active, active));
    }

    const result = await db
      .select()
      .from(budgetPlanTable)
      .where(and(...conditions))
      .orderBy(desc(budgetPlanTable.createdAt));

    sendSuccess(res, result || []);
  })
);

// GET /api/budget-plans/:id - Get budget plan by ID
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const id = validate(schemas.uuid, req.params.id);
    const userId = req.userId!;

    const result = await db
      .select()
      .from(budgetPlanTable)
      .where(
        and(eq(budgetPlanTable.id, id), eq(budgetPlanTable.userId, userId))
      );

    if (!result || result.length === 0) {
      throw new NotFoundError("Budget plan");
    }

    sendSuccess(res, result[0]);
  })
);

// POST /api/budget-plans - Create a new budget plan
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const data = validate(createBudgetPlanSchema, {
      ...req.body,
      user_id: userId,
    });

    // Deactivate other plans for the same user if this one is active
    if (data.active !== false) {
      await db
        .update(budgetPlanTable)
        .set({ active: false })
        .where(
          and(
            eq(budgetPlanTable.userId, userId),
            eq(budgetPlanTable.active, true)
          )
        );
    }

    const result = await db
      .insert(budgetPlanTable)
      .values({
        userId: data.user_id,
        needsPercentage: data.needs_percentage,
        wantsPercentage: data.wants_percentage,
        savingsPercentage: data.savings_percentage,
        active: data.active !== false,
      })
      .returning();

    sendSuccess(res, result[0], 201);
  })
);

// PUT /api/budget-plans/:id - Update budget plan
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const id = validate(schemas.uuid, req.params.id);
    const userId = req.userId!;
    const data = validate(updateBudgetPlanSchema, req.body);

    // Get existing plan first and verify ownership
    const existingResult = await db
      .select()
      .from(budgetPlanTable)
      .where(
        and(eq(budgetPlanTable.id, id), eq(budgetPlanTable.userId, userId))
      );

    if (!existingResult || existingResult.length === 0) {
      throw new NotFoundError("Budget plan");
    }
    const existing = existingResult[0];

    // If percentages are being updated, validate they sum to 100
    if (
      data.needs_percentage !== undefined ||
      data.wants_percentage !== undefined ||
      data.savings_percentage !== undefined
    ) {
      const needs =
        data.needs_percentage !== undefined
          ? Number(data.needs_percentage)
          : Number(existing.needsPercentage);
      const wants =
        data.wants_percentage !== undefined
          ? Number(data.wants_percentage)
          : Number(existing.wantsPercentage);
      const savings =
        data.savings_percentage !== undefined
          ? Number(data.savings_percentage)
          : Number(existing.savingsPercentage);

      const total = needs + wants + savings;
      if (Math.abs(total - 100) > 0.01) {
        throw new ValidationError("Percentages must sum to 100");
      }
    }

    // If activating this plan, deactivate others for the same user
    if (data.active === true) {
      await db
        .update(budgetPlanTable)
        .set({ active: false })
        .where(
          and(
            eq(budgetPlanTable.userId, userId),
            not(eq(budgetPlanTable.id, id)),
            eq(budgetPlanTable.active, true)
          )
        );
    }

    const result = await db
      .update(budgetPlanTable)
      .set({
        needsPercentage:
          data.needs_percentage !== undefined
            ? data.needs_percentage
            : existing.needsPercentage,
        wantsPercentage:
          data.wants_percentage !== undefined
            ? data.wants_percentage
            : existing.wantsPercentage,
        savingsPercentage:
          data.savings_percentage !== undefined
            ? data.savings_percentage
            : existing.savingsPercentage,
        active: data.active !== undefined ? Boolean(data.active) : existing.active,
        updatedAt: new Date(),
      })
      .where(
        and(eq(budgetPlanTable.id, id), eq(budgetPlanTable.userId, userId))
      )
      .returning();

    sendSuccess(res, result[0]);
  })
);

// DELETE /api/budget-plans/:id - Delete budget plan
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const id = validate(schemas.uuid, req.params.id);
    const userId = req.userId!;

    const result = await db
      .delete(budgetPlanTable)
      .where(
        and(eq(budgetPlanTable.id, id), eq(budgetPlanTable.userId, userId))
      )
      .returning({ id: budgetPlanTable.id });

    if (!result || result.length === 0) {
      throw new NotFoundError("Budget plan");
    }

    res.status(204).send();
  })
);

export { router as budgetPlanRoutes };
