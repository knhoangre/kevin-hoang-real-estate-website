/**
 * Saved analyses and Kevin's cost book, in the database. Decides nothing: what
 * an analysis contains is scenario.ts's, and what a cost line means is
 * rehabCosts.ts's.
 *
 * Every read of analyses filters by user even though RLS already scopes a
 * visitor to their own rows — the admin's policy is every row, so without the
 * filter Kevin's own list would be every client's (the mistake /rentals made
 * with applications; see CLAUDE.md).
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { CostOverride } from '@/lib/rehabCosts';
import type { Scenario } from '@/lib/scenario';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  mls_number: string;
  strategy: string;
  inputs: unknown;
  address: string | null;
  town: string | null;
  prop_type: string | null;
  list_price: number | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS = 'id, user_id, mls_number, strategy, inputs, address, town, prop_type, list_price, created_at, updated_at';

export const loadAnalysis = async (userId: string, mls: string): Promise<SavedAnalysis | null> => {
  const { data, error } = await supabase
    .from('investment_analyses')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('mls_number', mls)
    .maybeSingle();
  if (error) throw error;
  return data as SavedAnalysis | null;
};

export const listAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  const { data, error } = await supabase
    .from('investment_analyses')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SavedAnalysis[];
};

/**
 * Saves the scenario. An existing analysis is updated by its id — never an
 * upsert, which would run the INSERT trigger (and its snapshot and cap) on
 * every save of a row that already exists.
 */
export const saveAnalysis = async (
  existingId: string | null,
  mls: string,
  scenario: Scenario
): Promise<SavedAnalysis> => {
  const inputs = scenario as unknown as Json;
  const query = existingId
    ? supabase.from('investment_analyses').update({ inputs, strategy: scenario.tab }).eq('id', existingId)
    : supabase.from('investment_analyses').insert({ mls_number: mls, inputs, strategy: scenario.tab });
  const { data, error } = await query.select(COLUMNS).single();
  if (error) throw error;
  return data as SavedAnalysis;
};

export const deleteAnalysis = async (id: string): Promise<void> => {
  const { error } = await supabase.from('investment_analyses').delete().eq('id', id);
  if (error) throw error;
};

/* -------------------------------------------------------------------------- */
/* Kevin's prices                                                              */
/* -------------------------------------------------------------------------- */

/** Every override. Never throws: without them the researched book stands. */
export const costOverrides = async (): Promise<CostOverride[]> => {
  try {
    const { data, error } = await supabase
      .from('investment_cost_overrides')
      .select('key, low, mid, high, note, updated_at');
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, low: Number(r.low), mid: Number(r.mid), high: Number(r.high) }));
  } catch {
    return [];
  }
};

export const saveCostOverride = async (o: Omit<CostOverride, 'updated_at'>): Promise<void> => {
  const { error } = await supabase
    .from('investment_cost_overrides')
    .upsert({ key: o.key, low: o.low, mid: o.mid, high: o.high, note: o.note?.trim() || null }, { onConflict: 'key' });
  if (error) throw error;
};

export const deleteCostOverride = async (key: string): Promise<void> => {
  const { error } = await supabase.from('investment_cost_overrides').delete().eq('key', key);
  if (error) throw error;
};
