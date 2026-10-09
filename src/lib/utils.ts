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

/**
 * "a", "a and b", "a, b and c" — a list as it is said in a sentence.
 *
 * The admin pages name people and addresses in toasts ("Sent to a and b"), and
 * two of them had grown the same four lines on the same day.
 */
export function sentenceList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
