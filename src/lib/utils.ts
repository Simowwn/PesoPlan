import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency with proper rounding to 2 decimal places
 * Fixes floating-point precision errors (e.g., 3994.002 -> 3994.00)
 */
export function formatCurrency(amount: number): string {
  // Round to 2 decimal places to fix floating-point errors
  const rounded = Math.round(amount * 100) / 100;
  return `₱${rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Rounds a number to 2 decimal places (for calculations)
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}
