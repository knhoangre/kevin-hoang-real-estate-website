/**
 * Leases — reading, saving, starting and deleting them.
 *
 * Everything that touches Supabase, and nothing that decides anything: what a
 * lease IS, what it is started with and what about it is worth a warning are
 * in lease.ts, which is pure and has its own check. The same split as
 * marketingStore.ts and marketing.ts.
 *
 * The table is the admin's alone (see 20261030120000_rental_leases); every call
 * here simply fails for anyone else.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { SITE } from '@/lib/siteConfig';
import {
  hydrateLease,
  leaseFromApplications,
  leasePremises,
  tenantNames,
  type LeaseAgent,
  type LeaseDoc,
  type LeaseSummary,
} from '@/lib/lease';
import { formatProperty, propertyKey, type PropertyParts } from '@/lib/rentalProperty';
import type { RentalApplicationRecord } from '@/lib/rentalApplication';

/**
 * A precise schema for the ONE table types.ts does not know yet.
 *
 * TEMPORARY, the same arrangement as `CompsSchema` in idxComps.ts: types.ts is
 * generated from the live project, and `rental_leases` is not in it until the
 * migration is pushed and the types regenerated. This is not the deleted `db`
 * escape hatch — it states the table's columns exactly, the compiler still
 * checks every call against them, and its reach is this module. Once
 * `gen types` has run, delete it and use `supabase` directly.
 */
// A type alias, not an interface: supabase-js wants each table's row to be a
// Record<string, unknown>, and an interface has no index signature.
type LeaseRow = {
  id: string;
  title: string;
  tenant_names: string;
  property_key: string;
  application_ids: string[];
  doc: Json;
  created_at: string;
  updated_at: string;
};
interface LeaseSchema {
  public: {
    Tables: {
      rental_leases: {
        Row: LeaseRow;
        Insert: Partial<LeaseRow>;
        Update: Partial<LeaseRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
const leaseDb = supabase as unknown as SupabaseClient<LeaseSchema>;

/**
 * Kevin, as a new lease starts with him — read from SITE, so the name, phone
 * and brokerage on a lease are the ones on the site, character for character.
 */
export const siteLeaseAgent = (): LeaseAgent => ({
  name: SITE.agentName,
  brokerage: SITE.brokerage,
  phone: SITE.phone,
  email: SITE.email,
});

/** The columns beside `doc` are copies, written here so a list need not open every lease. */
const columnsOf = (doc: LeaseDoc) => ({
  title: formatProperty(leasePremises(doc)),
  tenant_names: tenantNames(doc),
  application_ids: [...new Set(doc.tenants.map((t) => t.applicationId).filter((id): id is string => !!id))],
  // The compiler cannot see that a LeaseDoc is JSON; it is, by construction.
  doc: doc as unknown as Json,
});

/** Every lease, most recently touched first. Few enough to file on the page. */
export const listLeases = async (): Promise<LeaseSummary[]> => {
  const { data, error } = await leaseDb
    .from('rental_leases')
    .select('id, title, tenant_names, property_key, application_ids, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    tenantNames: row.tenant_names,
    propertyKey: row.property_key,
    applicationIds: row.application_ids ?? [],
    updatedAt: row.updated_at,
  }));
};

export interface StoredLease {
  id: string;
  propertyKey: string;
  doc: LeaseDoc;
}

export const loadLease = async (id: string): Promise<StoredLease | null> => {
  const { data, error } = await leaseDb
    .from('rental_leases')
    .select('id, property_key, doc')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, propertyKey: data.property_key, doc: hydrateLease(data.doc, siteLeaseAgent()) };
};

export const saveLease = async (id: string, doc: LeaseDoc): Promise<void> => {
  const { error } = await leaseDb.from('rental_leases').update(columnsOf(doc)).eq('id', id);
  if (error) throw error;
};

/**
 * A new lease for a property, made from the applicants chosen for it. Returns
 * its id, which is what the page opens.
 *
 * `property_key` is written once, here, and never by a save: it records which
 * property the lease was MADE for, and editing the lease's own address must
 * not move it off that property's page.
 */
export const startLease = async ({
  property,
  rent,
  applications,
}: {
  property: PropertyParts;
  rent: number | null;
  applications: RentalApplicationRecord[];
}): Promise<string> => {
  const doc = leaseFromApplications({ property, rent, applications, agent: siteLeaseAgent() });
  const { data, error } = await leaseDb
    .from('rental_leases')
    .insert({ ...columnsOf(doc), property_key: propertyKey(property) })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
};

export const deleteLease = async (id: string): Promise<void> => {
  const { error } = await leaseDb.from('rental_leases').delete().eq('id', id);
  if (error) throw error;
};
