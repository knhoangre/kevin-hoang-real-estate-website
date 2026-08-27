import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The message from a caught value.
 *
 * `catch (err: any)` followed by `err.message` was the pattern across the
 * admin pages, which silently yields `undefined` whenever what was thrown is
 * not an Error — a plain string, or a Supabase/Deno rejection shaped as an
 * object. That `undefined` then rendered straight into a toast. Catch clauses
 * are `unknown`, which is what they actually are, and this narrows them.
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return fallback;
}
