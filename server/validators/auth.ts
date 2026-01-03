import { z } from 'zod';
import { schemas } from '../utils/validation';

export const signupSchema = z.object({
  email: schemas.email,
  password: schemas.password,
});

export const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Password is required'),
});

export const getMeSchema = z.object({
  userId: schemas.uuid,
});

