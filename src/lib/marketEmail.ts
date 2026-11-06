/**
 * The site's half of the monthly market email: the three things a visitor can
 * ask the market-email function to do. Everything else, who is due and what the
 * email says, is the function's (supabase/functions/_shared/marketEmail.ts).
 * Each throws on failure, with the function's own message where it sent one.
 */
import { supabase } from '@/integrations/supabase/client';

const call = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('market-email', { body });
  if (error) {
    // A refusal carries its reason in the body; FunctionsHttpError keeps the
    // response on `context`. The same digging as functionMessage() in
    // showingTours.ts, which is not imported because it would bring the admin's
    // tour code into a public page.
    const context = (error as { context?: unknown }).context;
    let reason: string | null = null;
    if (context instanceof Response) {
      const body = (await context.clone().json().catch(() => null)) as { error?: unknown } | null;
      if (typeof body?.error === 'string') reason = body.error;
    }
    throw new Error(reason ?? 'Something went wrong. Please try again.');
  }
  return data as T;
};

/** Always "ok" for a well-formed request, whether or not the address was new. */
export const subscribeToMarket = (email: string, towns: string[], source: string, website = '') =>
  call<{ ok: true }>({ action: 'subscribe', email: email.trim().toLowerCase(), towns, source, website });

export const confirmMarketEmail = (token: string) =>
  call<{ ok: true; towns: string[] }>({ action: 'confirm', token });

export const unsubscribeMarketEmail = (token: string) =>
  call<{ ok: true; towns: string[] }>({ action: 'unsubscribe', token });
