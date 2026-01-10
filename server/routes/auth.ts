import { Router } from "express";
import { db } from "../lib/db";
import { userTable } from "../lib/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { validate } from "../utils/validation";
import { signupSchema, loginSchema } from "../validators/auth";
import {
  asyncHandler,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors";
import { sendSuccess } from "../utils/response";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/signup - Create a new user account
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password } = validate(signupSchema, req.body);

    // Check if user already exists
    const existing = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email));

    if (existing && existing.length > 0) {
      throw new ConflictError("An account with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await db
      .insert(userTable)
      .values({
        email,
        password_hash: passwordHash,
      })
      .returning({
        id: userTable.id,
        email: userTable.email,
        createdAt: userTable.createdAt,
      });

    const user = result[0];

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email },
        token,
      },
      201
    );
  })
);

// POST /api/auth/login - Login user
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = validate(loginSchema, req.body);

    // Find user by email with password hash
    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (!result || result.length === 0) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const user = result[0];

    // Verify password
    if (!user.password_hash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    sendSuccess(res, {
      user: { id: user.id, email: user.email },
      token,
    });
  })
);

// GET /api/auth/me - Get current authenticated user
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const result = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, req.userId));

    if (!result || result.length === 0) {
      throw new NotFoundError("User");
    }

    const user = result[0];
    sendSuccess(res, { user: { id: user.id, email: user.email } });
  })
);

export { router as authRoutes };
