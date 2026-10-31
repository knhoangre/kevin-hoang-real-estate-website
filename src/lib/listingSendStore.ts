/**
 * Send listings: everything that touches Supabase, and nothing that decides.
 * The decisions are in listingSend.ts. The table is admin-only under RLS, so none
 * of this works for anyone else and none of it needs to check.
 */
import type { MessagePreview } from '@/components/admin/MessagePanel';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { homesFrom, type SendHome } from '@/lib/listingSend';
import {
  functionMessage,
  isBlankPerson,
  toPeople,
  type PersonDraft,
  type TourPerson,
} from '@/lib/showingTours';

type SendRow = Database['public']['Tables']['listing_sends']['Row'];
type SendInsert = Database['public']['Tables']['listing_sends']['Insert'];

export interface ListingSend {
  id: string;
  people: TourPerson[];
  /** In the order Kevin added them. */
  homes: SendHome[];
  note: string | null;
  /** When the email last went. Says nothing about a text. */
  sentAt: string | null;
  createdAt: string;
}

export interface SendDraft {
  people: PersonDraft[];
  homes: SendHome[];
  note: string;
}

const toSend = (row: SendRow): ListingSend => ({
  id: row.id,
  people: toPeople(row.clients),
  homes: homesFrom(row.homes),
  note: row.note,
  sentAt: row.sent_at,
  createdAt: row.created_at,
});

/**
 * No `contactId`: that key is the database's to write. Blank rows are dropped
 * here rather than sent — the trigger drops them too, but a spare empty line on
 * the form is not something to make it decide about.
 */
const columns = (d: SendDraft): SendInsert => ({
  clients: d.people
    .filter((p) => !isBlankPerson(p))
    .map((p) => ({
      id: p.id,
      name: p.name.trim(),
      email: p.email.trim().toLowerCase() || null,
      phone: p.phone.trim() || null,
    })),
  homes: d.homes as unknown as Json,
  note: d.note.trim() || null,
});

/** The last fifty messages, newest first. Nothing here needs more. */
export const listSends = async (): Promise<ListingSend[]> => {
  const { data, error } = await supabase
    .from('listing_sends')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(toSend);
};

/** Returns the row AS SAVED: trimmed, and with whoever the database filed. */
export const createSend = async (draft: SendDraft): Promise<ListingSend> => {
  const { data, error } = await supabase.from('listing_sends').insert(columns(draft)).select('*').single();
  if (error) throw error;
  return toSend(data);
};

export const updateSend = async (id: string, draft: SendDraft): Promise<ListingSend> => {
  const { data, error } = await supabase
    .from('listing_sends')
    .update({ ...columns(draft), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toSend(data);
};

export const deleteSend = async (id: string): Promise<void> => {
  const { error } = await supabase.from('listing_sends').delete().eq('id', id);
  if (error) throw error;
};

/** The message as the client would get it. SENDS NOTHING. */
export const previewSend = async (id: string): Promise<MessagePreview> => {
  const { data, error } = await supabase.functions.invoke('send-listings', {
    body: { action: 'preview', id },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not write the message.'));
  return data as MessagePreview;
};

/** Emails it to everyone on it who has an address. */
export const emailSend = async (id: string): Promise<{ sentAt: string; notice: string | null }> => {
  const { data, error } = await supabase.functions.invoke('send-listings', {
    body: { action: 'send', id },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not send the email.'));
  if (!data?.sent) throw new Error(data?.error ?? 'Could not send the email.');
  return { sentAt: data.sentAt as string, notice: (data.notice as string | null) ?? null };
};
