/**
 * Listing-office names, asked for together.
 *
 * Every listing card names its listing office — IdxDisclosure tells the reader
 * that listings from other firms "are marked with the name of the listing
 * office", and until 2026-10-20 only the listing page itself did. A grid of 24
 * cards asking one at a time would be 24 requests; each card asks here instead,
 * and every request made in the same tick goes out as one `office_id IN (…)`.
 *
 * Never throws. An office that cannot be read is null, and the card simply
 * shows no line — the listing page still names it.
 */
import { supabase } from '@/integrations/supabase/client';

type Resolve = (name: string | null) => void;

let queue = new Map<string, Resolve[]>();
let scheduled = false;

/** PostgREST puts the list in the URL; this keeps it well short of any limit. */
const CHUNK = 150;

const flush = async () => {
  const batch = queue;
  queue = new Map();
  scheduled = false;

  const ids = [...batch.keys()];
  const names = new Map<string, string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    try {
      const { data, error } = await supabase
        .from('idx_offices')
        .select('office_id, name')
        .in('office_id', ids.slice(i, i + CHUNK));
      if (error) throw error;
      for (const row of data ?? []) {
        if (row.office_id && row.name) names.set(row.office_id, row.name);
      }
    } catch {
      // Left unnamed. See the header.
    }
  }
  for (const [id, waiting] of batch) for (const resolve of waiting) resolve(names.get(id) ?? null);
};

export const officeNameBatched = (officeId: string): Promise<string | null> =>
  new Promise((resolve) => {
    const waiting = queue.get(officeId);
    if (waiting) waiting.push(resolve);
    else queue.set(officeId, [resolve]);
    if (!scheduled) {
      scheduled = true;
      setTimeout(() => void flush(), 0);
    }
  });
