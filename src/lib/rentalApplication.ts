/**
 * The rental application: its shape, its rules, and the one path it takes to
 * the server.
 *
 * The database stores the answers as a single `jsonb` column, so THIS FILE is
 * the actual contract — not the generated Supabase types, which only know the
 * column is json. Anything reading or writing an application goes through here.
 *
 * Modelled on src/lib/submitContact.ts: the applicant form and the admin view
 * share one transport, so neither owns the payload shape or the endpoint.
 *
 * Two things the paper form (GBREB RH101) collects and this deliberately does
 * not:
 *
 *   - Social Security Number, and bank account numbers. Storing either is real
 *     breach and compliance exposure, and nothing here needs them. Screening
 *     that requires an SSN is ordered through a bureau, which takes it directly.
 *   - A standing "have you been convicted of a felony?" question. Blanket
 *     criminal-history screening is the subject of active MA and federal
 *     fair-housing guidance; the 1969 form predates all of it. Adding it back is
 *     a decision for a broker and counsel, not a default.
 */
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { isPhone, isPhoneOrEmpty } from '@/lib/phone';

// ---------------------------------------------------------------------------
// Field primitives
// ---------------------------------------------------------------------------

/**
 * Every optional field defaults to '' rather than being `undefined`.
 *
 * react-hook-form treats an undefined default as an uncontrolled input and
 * warns the moment the applicant types into it; more importantly, a draft
 * reloaded from jsonb must merge cleanly over the defaults, which only works
 * when every key exists.
 */
const opt = (max = 200) => z.string().trim().max(max).default('');
const req = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max);

const optPhone = opt(20).refine(isPhoneOrEmpty, 'Enter a 10-digit phone number');
const reqPhone = z
  .string()
  .trim()
  .min(1, 'Phone is required')
  .refine(isPhone, 'Enter a 10-digit phone number');

const optEmail = opt(320).refine(
  (v) => v === '' || z.string().email().safeParse(v).success,
  'Enter a valid email address'
);

/** A dollar amount as typed. Kept as text: '1,850' and '1850' both arrive. */
const optMoney = opt(20).refine(
  (v) => v === '' || /^\$?[\d,]+(\.\d{1,2})?$/.test(v),
  'Enter an amount, e.g. 2,400'
);
const optDate = opt(10);

/**
 * A postal address, all four parts optional. It used to take a `required` flag
 * for the current residence; nothing asks for a required address any more now
 * that only the applicant's own details are mandatory, so the branch went with
 * the flag rather than sitting here unreachable.
 */
const address = () =>
  z.object({
    street: opt(),
    city: opt(100),
    state: opt(2),
    zip: opt(10),
  });

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

/**
 * FIVE fields are required, and they are all in the first section: first and
 * last name, date of birth, email and phone. Everything else — residence,
 * employment, references, household, the unit — is optional.
 *
 * That is not laziness about data quality, it is the second path this form has
 * to support. People routinely arrive having already completed an application
 * on another agency's paperwork, and the useful thing to do with that is read
 * their PDF, not make them retype it into a form that refuses to submit without
 * an employer. So the questions are optional and the Documents section is the
 * alternative to answering them — but we still have to know who is applying and
 * how to reach them, which is what these five are.
 *
 * The consents are separate: they are required at SUBMIT (see
 * `submissionSchema`) because a credit authorization is a legal record, not a
 * field. Nothing here is required while a draft is being typed.
 */
export const rentalApplicationSchema = z.object({
  // 1 — Applicant. The only required section.
  applicant: z.object({
    firstName: req('First name', 100),
    lastName: req('Last name', 100),
    middleInitial: opt(2),
    dateOfBirth: req('Date of birth', 10),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    phone: reqPhone,
    bestTimeToContact: opt(100),
  }),

  // 2 — Current residence. Optional, like everything below the applicant's own
  //     details: an applicant who has already completed an application on
  //     another form uploads it under Documents instead of retyping it here.
  currentResidence: z.object({
    ...address().shape,
    movedIn: optDate,
    movedOut: optDate,
    monthlyRent: optMoney,
    reasonForLeaving: opt(500),
    landlordName: opt(),
    landlordAddress: opt(300),
    landlordPhone: optPhone,
  }),

  // 3 — Previous residence. Optional as a block; see the cross-field rule below.
  hasPreviousResidence: z.boolean().default(false),
  previousResidence: z.object({
    ...address().shape,
    movedIn: optDate,
    movedOut: optDate,
    monthlyRent: optMoney,
    landlordName: opt(),
    landlordAddress: opt(300),
    landlordPhone: optPhone,
  }),

  // 4 — Employment
  employment: z.object({
    employer: opt(200),
    address: opt(300),
    phone: optPhone,
    occupation: opt(200),
    businessType: opt(200),
    grossMonthlyIncome: optMoney,
    lengthOfEmployment: opt(100),
    supervisor: opt(),
  }),
  hasPreviousEmployment: z.boolean().default(false),
  previousEmployment: z.object({
    employer: opt(200),
    address: opt(300),
    phone: optPhone,
    occupation: opt(200),
    lengthOfEmployment: opt(100),
  }),

  // 5 — Other income. Entirely optional, and never required: source of income
  //     is a protected class in Massachusetts, so this asks what the applicant
  //     chooses to offer and demands nothing.
  otherIncome: z
    .array(z.object({ source: opt(200), monthlyAmount: optMoney }))
    .max(6)
    .default([]),

  // 6 — References
  personalReference: z.object({
    name: opt(),
    relationship: opt(100),
    address: opt(300),
    phone: optPhone,
  }),
  creditReference: z.object({
    name: opt(),
    address: opt(300),
    phone: optPhone,
  }),

  // 7 — Emergency contact
  emergencyContact: z.object({
    name: opt(),
    relationship: opt(100),
    address: opt(300),
    phone: optPhone,
  }),

  // 8 — Household
  household: z.object({
    totalOccupants: opt(4),
    adults: opt(4),
    // Each adult files a separate application; this is the roster, not their data.
    coTenants: z.array(z.object({ name: opt(), email: optEmail })).max(8).default([]),
    minorChildren: z.array(z.object({ name: opt(), age: opt(3) })).max(10).default([]),
    pets: z
      .array(z.object({ type: opt(60), breed: opt(100), weight: opt(10) }))
      .max(6)
      .default([]),
  }),

  // 9 — Vehicle
  vehicle: z.object({
    make: opt(60),
    model: opt(60),
    year: opt(4),
    plate: opt(20),
    plateState: opt(2),
  }),

  // 10 — Desired tenancy. Prefilled from the invite where the admin supplied it.
  tenancy: z.object({
    propertyAddress: opt(300),
    unit: opt(30),
    desiredOccupancyDate: optDate,
    leaseTermMonths: opt(3),
    baseRent: optMoney,
    otherMonthlyCharges: opt(200),
  }),

  // 11 — Consents. Both booleans must be true to submit; both are stamped with
  //      a server timestamp on the row, because the record that matters is that
  //      a specific authorisation was given at a specific time.
  consents: z.object({
    creditAuthorization: z.boolean().default(false),
    certification: z.boolean().default(false),
    signature: opt(200),
    signatureDate: optDate,
  }),
});

export type RentalApplicationData = z.infer<typeof rentalApplicationSchema>;

/**
 * The rules that only apply at SUBMIT.
 *
 * Kept separate from the schema above so a half-filled draft still parses —
 * autosave writes whatever is on screen, and validating it would make the
 * common case an error state.
 */
export const submissionSchema = rentalApplicationSchema
  .refine((v) => !v.hasPreviousResidence || v.previousResidence.street.trim() !== '', {
    message: 'Enter your previous address, or uncheck the box above',
    path: ['previousResidence', 'street'],
  })
  .refine((v) => !v.hasPreviousEmployment || v.previousEmployment.employer.trim() !== '', {
    message: 'Enter your previous employer, or uncheck the box above',
    path: ['previousEmployment', 'employer'],
  })
  .refine((v) => v.consents.creditAuthorization, {
    message: 'We cannot process the application without this authorization',
    path: ['consents', 'creditAuthorization'],
  })
  .refine((v) => v.consents.certification, {
    message: 'Please confirm your answers are accurate',
    path: ['consents', 'certification'],
  })
  .refine(
    // A typed signature is only meaningful if it is the applicant's own name.
    (v) =>
      v.consents.signature.trim().toLowerCase() ===
      `${v.applicant.firstName} ${v.applicant.lastName}`.trim().toLowerCase(),
    {
      message: 'Type your full name exactly as entered at the top of the application',
      path: ['consents', 'signature'],
    }
  );

/**
 * Every field present and empty. The starting point, and the merge target for a
 * draft.
 *
 * A LITERAL, and never `rentalApplicationSchema.parse({...})`. That is what this
 * was, and it threw on every call: `req()` is `.min(1)`, so the fifteen required
 * fields cannot be satisfied by the blank document they are the blank document
 * OF. It failed inside `hydrateApplication`, so every applicant opening an
 * invite got "Could not open the application" and no applicant could ever start
 * one.
 *
 * The annotation is what keeps this honest: `RentalApplicationData` is inferred
 * from the schema, so a field added there and forgotten here fails `tsc`. That
 * is a stronger guarantee than the parse was pretending to give, and it is
 * checked at build time rather than in front of the applicant.
 */
export const emptyApplication = (): RentalApplicationData => ({
  applicant: {
    firstName: '',
    lastName: '',
    middleInitial: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    bestTimeToContact: '',
  },
  currentResidence: {
    street: '',
    city: '',
    state: '',
    zip: '',
    movedIn: '',
    movedOut: '',
    monthlyRent: '',
    reasonForLeaving: '',
    landlordName: '',
    landlordAddress: '',
    landlordPhone: '',
  },
  hasPreviousResidence: false,
  previousResidence: {
    street: '',
    city: '',
    state: '',
    zip: '',
    movedIn: '',
    movedOut: '',
    monthlyRent: '',
    landlordName: '',
    landlordAddress: '',
    landlordPhone: '',
  },
  employment: {
    employer: '',
    address: '',
    phone: '',
    occupation: '',
    businessType: '',
    grossMonthlyIncome: '',
    lengthOfEmployment: '',
    supervisor: '',
  },
  hasPreviousEmployment: false,
  previousEmployment: {
    employer: '',
    address: '',
    phone: '',
    occupation: '',
    lengthOfEmployment: '',
  },
  otherIncome: [],
  personalReference: { name: '', relationship: '', address: '', phone: '' },
  creditReference: { name: '', address: '', phone: '' },
  emergencyContact: { name: '', relationship: '', address: '', phone: '' },
  household: {
    totalOccupants: '',
    adults: '',
    coTenants: [],
    minorChildren: [],
    pets: [],
  },
  vehicle: { make: '', model: '', year: '', plate: '', plateState: '' },
  tenancy: {
    propertyAddress: '',
    unit: '',
    desiredOccupancyDate: '',
    leaseTermMonths: '',
    baseRent: '',
    otherMonthlyCharges: '',
  },
  consents: {
    creditAuthorization: false,
    certification: false,
    signature: '',
    signatureDate: '',
  },
});

/**
 * Merges a stored draft over the empty document.
 *
 * There is deliberately NO validation pass here. It used to end with
 * `rentalApplicationSchema.safeParse(merged)` and fall back to the blank
 * document when that failed — and for a draft it always failed, because the
 * required fields the applicant has not reached yet are still empty. The effect
 * was silent and worse than an error: type a name, autosave, reload, and the
 * form comes back blank with the draft still sitting in the database.
 *
 * A draft is a partial document by definition. The rules that decide whether it
 * is COMPLETE live in `submissionSchema` and run once, at submit. What this
 * needs instead is a shape guarantee, which is what `deepMerge` gives: keys the
 * schema no longer has are dropped, and a stored value only survives if its type
 * matches the blank document's.
 */
export const hydrateApplication = (stored: unknown): RentalApplicationData => {
  const base = emptyApplication();
  if (!stored || typeof stored !== 'object') return base;
  return deepMerge(base as unknown as Record<string, unknown>, stored as Record<string, unknown>) as unknown as RentalApplicationData;
};

/**
 * A list of records, as this schema uses them: every array here holds objects
 * whose values are all strings. Checked because `deepMerge` replaces arrays
 * wholesale, so this is the only thing standing between a malformed stored array
 * and the form's field registration.
 */
const isStringRecordArray = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      Object.values(item as Record<string, unknown>).every((v) => typeof v === 'string')
  );

/**
 * Object-by-object merge. Arrays replace wholesale — they are lists, not records.
 *
 * A stored value is kept only when its type matches the blank document's. That
 * is what makes the removed `safeParse` unnecessary rather than merely absent: a
 * draft written before a field changed type cannot put a number where the form
 * registers a text input, which is the failure the parse was there to catch.
 */
const deepMerge = (
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in base)) continue; // drop keys the schema no longer has
    if (value === undefined || value === null) continue;
    const existing = base[key];

    if (Array.isArray(existing)) {
      if (isStringRecordArray(value)) out[key] = value;
      continue;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === 'object'
    ) {
      out[key] = deepMerge(existing as Record<string, unknown>, value as Record<string, unknown>);
      continue;
    }

    // Leaves: same type as the blank document, or it does not come through.
    if (typeof value === typeof existing) out[key] = value;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Sections — the form's table of contents AND its rendering order
// ---------------------------------------------------------------------------

export interface ApplicationSection {
  id: string;
  title: string;
  /** One line under the heading. Says what the section is for, not what to type. */
  blurb?: string;
  /** Drives the "optional" mark in the section index. */
  required: boolean;
  /**
   * Which run of sections this belongs to. The index renders these as headed
   * groups, in this order, so the shape of the document is legible before any of
   * it is read: what we need, what you can upload instead, and the long part
   * that is optional.
   */
  group: SectionGroup;
}

export const SECTION_GROUPS = [
  { id: 'details', title: 'What we need' },
  { id: 'documents', title: 'Or upload it' },
  { id: 'application', title: 'The full application — optional' },
  { id: 'submit', title: 'Sign and send' },
] as const;

export type SectionGroup = (typeof SECTION_GROUPS)[number]['id'];

export const APPLICATION_SECTIONS: ApplicationSection[] = [
  {
    id: 'applicant',
    title: 'About you',
    blurb: 'The only part we need: who you are and how to reach you.',
    required: true,
    group: 'details',
  },
  {
    id: 'documents',
    title: 'Documents',
    blurb:
      'Upload what you have — including a completed application from another form, if you already filled one in. You can add more at any time, even after you submit.',
    required: false,
    group: 'documents',
  },
  {
    id: 'residence',
    title: 'Where you live now',
    blurb: 'Your current address and the landlord we may contact for a reference.',
    required: false,
    group: 'application',
  },
  { id: 'previous-residence', title: 'Previous address', required: false, group: 'application' },
  {
    id: 'employment',
    title: 'Employment and income',
    blurb: 'Enough to show the rent is affordable.',
    required: false,
    group: 'application',
  },
  {
    id: 'other-income',
    title: 'Other income',
    blurb: 'Include anything you would like considered.',
    required: false,
    group: 'application',
  },
  { id: 'references', title: 'References', required: false, group: 'application' },
  { id: 'emergency', title: 'Emergency contact', required: false, group: 'application' },
  {
    id: 'household',
    title: 'Household',
    blurb: 'Who else would be living there, including children and pets.',
    required: false,
    group: 'application',
  },
  { id: 'vehicle', title: 'Vehicle', required: false, group: 'application' },
  { id: 'tenancy', title: 'The unit you want', required: false, group: 'application' },
  {
    id: 'consents',
    title: 'Authorization and signature',
    blurb: 'Required to send the application, whether you filled it in or uploaded one.',
    required: true,
    group: 'submit',
  },
];

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'declined',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: 'In progress',
  submitted: 'Submitted',
  reviewing: 'Under review',
  approved: 'Approved',
  declined: 'Not approved',
  withdrawn: 'Withdrawn',
};

/**
 * Status colours are SIGNAL, not brand. Champagne would make approved and
 * declined the same colour, which is the whole point of the field.
 */
export const STATUS_TONE: Record<ApplicationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  submitted: 'bg-blue-50 text-blue-800 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  declined: 'bg-red-50 text-red-800 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface RentalApplicationRecord {
  id: string;
  inviteId: string | null;
  applicantUserId: string;
  status: ApplicationStatus;
  data: RentalApplicationData;
  applicantFirstName: string | null;
  applicantLastName: string | null;
  applicantEmail: string | null;
  applicantPhone: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RentalInviteRecord {
  id: string;
  token: string;
  label: string | null;
  /** The street line only — town, state and zip are their own fields. */
  propertyAddress: string | null;
  unit: string | null;
  propertyTown: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  monthlyRent: number | null;
  inviteeEmail: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  /** When the `send` action last emailed this link. Null means never. */
  sentAt: string | null;
  createdAt: string;
}

/** The shape the /apply landing page shows before sign-in. */
export interface ResolvedInvite {
  valid: boolean;
  label?: string | null;
  propertyAddress?: string | null;
  unit?: string | null;
  propertyTown?: string | null;
  propertyState?: string | null;
  propertyZip?: string | null;
  monthlyRent?: number | null;
  /**
   * The address the admin sent the link to, used only to prefill the form's
   * email field. Returned solely for a valid token, and it is the address that
   * person was already mailed at.
   */
  inviteeEmail?: string | null;
  claimed?: boolean;
  applicationId?: string;
  status?: ApplicationStatus;
}


/* eslint-disable @typescript-eslint/no-explicit-any -- the jsonb `data` column
   arrives from the generated types as `Json`, which cannot be narrowed to
   RentalApplicationData without a cast. hydrateApplication is what actually
   validates it. */
const toRecord = (row: any): RentalApplicationRecord => ({
  id: row.id,
  inviteId: row.invite_id ?? null,
  applicantUserId: row.applicant_user_id,
  status: row.status as ApplicationStatus,
  data: hydrateApplication(row.data),
  applicantFirstName: row.applicant_first_name ?? null,
  applicantLastName: row.applicant_last_name ?? null,
  applicantEmail: row.applicant_email ?? null,
  applicantPhone: row.applicant_phone ?? null,
  submittedAt: row.submitted_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toInvite = (row: any): RentalInviteRecord => ({
  id: row.id,
  token: row.token,
  label: row.label ?? null,
  propertyAddress: row.property_address ?? null,
  unit: row.unit ?? null,
  propertyTown: row.property_town ?? null,
  propertyState: row.property_state ?? null,
  propertyZip: row.property_zip ?? null,
  monthlyRent: row.monthly_rent ?? null,
  inviteeEmail: row.invitee_email ?? null,
  expiresAt: row.expires_at ?? null,
  revokedAt: row.revoked_at ?? null,
  sentAt: row.sent_at ?? null,
  createdAt: row.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

/**
 * What is behind this token, for the signed-OUT landing page.
 *
 * Never throws on an invalid token — an unusable link is an ordinary outcome
 * here, not an exception. It throws only when the call itself fails.
 */
export const resolveInvite = async (token: string): Promise<ResolvedInvite> => {
  const { data, error } = await supabase.functions.invoke('rental-application-invite', {
    body: { action: 'resolve', token },
  });
  if (error) throw error;
  return (data ?? { valid: false }) as ResolvedInvite;
};

/**
 * Claims the invite for the signed-in user, creating their draft or returning
 * the one they already started. Requires a session; the function reads the JWT.
 */
export const claimInvite = async (token: string): Promise<ResolvedInvite> => {
  const { data, error } = await supabase.functions.invoke('rental-application-invite', {
    body: { action: 'claim', token },
  });
  if (error) throw error;
  return (data ?? { valid: false }) as ResolvedInvite;
};

export const getApplication = async (id: string): Promise<RentalApplicationRecord | null> => {
  const { data, error } = await supabase
    .from('rental_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data) : null;
};

/** The signed-in user's own applications. RLS scopes this; no filter needed. */
export const listMyApplications = async (): Promise<RentalApplicationRecord[]> => {
  const { data, error } = await supabase
    .from('rental_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRecord);
};

/**
 * Autosave. Writes the answers as-is, with no validation — the applicant is
 * mid-sentence and a draft that refuses to save is worse than an incomplete one.
 *
 * The denormalised name/email/phone columns are kept in step here so the admin
 * list never parses jsonb.
 */
export const saveDraft = async (id: string, values: RentalApplicationData): Promise<void> => {
  const { error } = await supabase
    .from('rental_applications')
    .update({
      // The answers are the jsonb column. hydrateApplication validates the
      // way back out; this direction is a plain document with no undefineds.
      data: values as unknown as Json,
      applicant_first_name: values.applicant.firstName || null,
      applicant_last_name: values.applicant.lastName || null,
      applicant_email: values.applicant.email || null,
      applicant_phone: values.applicant.phone || null,
    })
    .eq('id', id);
  if (error) throw error;
};

/**
 * Submits. Validates against `submissionSchema` first and throws on failure —
 * this is the one write that must not accept a partial document.
 *
 * The consent timestamps are set HERE rather than from the checkbox, so the
 * record says when the authorization was actually given rather than when a box
 * happened to be ticked and then left sitting in a draft. Sending again after an
 * edit re-stamps them, which is correct: they are certifying the version the
 * admin will now read. `submitted_at` is the exception and is pinned to the FIRST
 * send by the trigger, so the date the admin sorts by does not move.
 */
export const submitApplication = async (
  id: string,
  values: RentalApplicationData
): Promise<void> => {
  const parsed = submissionSchema.parse(values);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('rental_applications')
    .update({
      data: parsed as unknown as Json,
      applicant_first_name: parsed.applicant.firstName,
      applicant_last_name: parsed.applicant.lastName,
      applicant_email: parsed.applicant.email,
      applicant_phone: parsed.applicant.phone,
      status: 'submitted',
      submitted_at: now,
      certified_at: now,
      credit_auth_at: now,
    })
    .eq('id', id);
  if (error) throw error;
};

/**
 * Whether the applicant may still change their own answers.
 *
 * The window closes when review starts, not when they submit — everything below
 * their own details is optional, so the intended flow is to send what you have
 * and fill the rest in later. Mirrors rule 1 of
 * `guard_submitted_rental_application`; if the two disagree the applicant sees
 * enabled fields and a save that the database refuses.
 */
export const isApplicantEditable = (status: ApplicationStatus): boolean =>
  status === 'draft' || status === 'submitted';

/**
 * The applicant stopping their own application.
 *
 * This is how somebody says they are no longer interested. It is deliberately
 * not a return to draft — the trigger refuses that — because an application that
 * quietly left the admin's list would leave them waiting on a decision nobody
 * was going to make.
 */
export const withdrawApplication = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rental_applications')
    .update({ status: 'withdrawn' })
    .eq('id', id);
  if (error) throw error;
};

// ---------------------------------------------------------------------------
// Admin transport
// ---------------------------------------------------------------------------

export const listApplications = async (): Promise<RentalApplicationRecord[]> => {
  const { data, error } = await supabase
    .from('rental_applications')
    .select('*')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRecord);
};

export const setApplicationStatus = async (
  id: string,
  status: ApplicationStatus
): Promise<void> => {
  const { error } = await supabase.from('rental_applications').update({ status }).eq('id', id);
  if (error) throw error;
};

export const listInvites = async (): Promise<RentalInviteRecord[]> => {
  const { data, error } = await supabase
    .from('rental_application_invites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInvite);
};

export interface NewInvite {
  label?: string;
  /** Street line. Town, state and zip are separate so a property can be reused. */
  propertyAddress?: string;
  unit?: string;
  propertyTown?: string;
  propertyState?: string;
  propertyZip?: string;
  monthlyRent?: string;
  inviteeEmail?: string;
  /** Days until the link stops working. 0 or undefined for no expiry. */
  expiresInDays?: number;
}

/**
 * Creates an invite. The token itself is NOT supplied — the column defaults to
 * 24 random bytes from the database, so the secret never depends on what the
 * browser's crypto happened to produce.
 */
export const createInvite = async (input: NewInvite): Promise<RentalInviteRecord> => {
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : null;

  const rent = input.monthlyRent?.replace(/[^\d.]/g, '');

  const { data, error } = await supabase
    .from('rental_application_invites')
    .insert({
      label: input.label?.trim() || null,
      property_address: input.propertyAddress?.trim() || null,
      unit: input.unit?.trim() || null,
      property_town: input.propertyTown?.trim() || null,
      // Stored uppercase so 'ma' and 'MA' are one value to the reuse picker.
      property_state: input.propertyState?.trim().toUpperCase() || null,
      property_zip: input.propertyZip?.trim() || null,
      monthly_rent: rent ? Number(rent) : null,
      invitee_email: input.inviteeEmail?.trim().toLowerCase() || null,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) throw error;
  return toInvite(data);
};

export const revokeInvite = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rental_application_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

/** The shareable URL. Absolute, because it is pasted into a text or an email. */
export const inviteUrl = (token: string, origin?: string): string => {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/apply/${token}`;
};

/**
 * The property as one line, from whatever parts are present.
 *
 * ONE formatter, used by the admin list, the applicant's "Applying for" card,
 * the invite label and the seeded tenancy address. Three hand-composed template
 * strings is how `formatPrice` ended up as three private copies that had already
 * drifted — and here a drift would show the applicant a different address than
 * the admin thinks they sent.
 *
 * Absent parts are omitted rather than placeheld, so an invite created before
 * town/state/zip existed still reads as the street line it always was.
 */
export interface PropertyParts {
  propertyAddress?: string | null;
  unit?: string | null;
  propertyTown?: string | null;
  propertyState?: string | null;
  propertyZip?: string | null;
}

export const formatProperty = (p: PropertyParts, { withUnit = true } = {}): string => {
  const street = [p.propertyAddress?.trim(), withUnit && p.unit?.trim() && `Unit ${p.unit.trim()}`]
    .filter(Boolean)
    .join(' · ');
  const region = [p.propertyState?.trim(), p.propertyZip?.trim()].filter(Boolean).join(' ');
  const place = [p.propertyTown?.trim(), region].filter(Boolean).join(', ');
  return [street, place].filter(Boolean).join(', ');
};

/**
 * The tenancy section's address, for display.
 *
 * `tenancy` keeps the address and the unit as SEPARATE fields, so anything
 * showing both has to join them — and the invite seeding used to put the whole
 * formatted property (unit included) into `propertyAddress`, which made that
 * join read "42 Newman St · Unit 3, Malden, MA 02148 · Unit 3". Seeding now
 * passes `withUnit: false`, and this skips the unit when the address already
 * names it, so the rows written before that fix still read correctly.
 */
export const formatTenancyAddress = (t: { propertyAddress?: string; unit?: string }): string => {
  const address = (t.propertyAddress ?? '').trim();
  const unit = (t.unit ?? '').trim();
  if (!unit) return address;
  // "unit 3" as a whole word, so "3" does not match the 3 in a street number.
  const named = new RegExp(`\\bunit\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return named.test(address) ? address : [address, `Unit ${unit}`].filter(Boolean).join(' · ');
};

/**
 * The properties already used, most recent first, for the reuse picker.
 *
 * Keyed on street + unit + town rather than on the formatted line, so an invite
 * that recorded no zip still matches the same unit entered later with one — the
 * point is to stop the admin retyping an address, not to demand they retype it
 * identically.
 */
export interface PreviousProperty extends PropertyParts {
  key: string;
  monthlyRent: number | null;
  label: string;
}

export const previousProperties = (invites: RentalInviteRecord[]): PreviousProperty[] => {
  const seen = new Map<string, PreviousProperty>();
  for (const invite of invites) {
    if (!invite.propertyAddress) continue;
    const key = [invite.propertyAddress, invite.unit ?? '', invite.propertyTown ?? '']
      .map((part) => part.trim().toLowerCase())
      .join('|');
    // First wins: listInvites() is newest-first, so the most recent entry for a
    // property is the one whose rent and spelling are offered back.
    if (seen.has(key)) continue;
    seen.set(key, {
      key,
      propertyAddress: invite.propertyAddress,
      unit: invite.unit,
      propertyTown: invite.propertyTown,
      propertyState: invite.propertyState,
      propertyZip: invite.propertyZip,
      monthlyRent: invite.monthlyRent,
      label: formatProperty(invite),
    });
  }
  return [...seen.values()];
};

/** Live / expired / revoked / used, for the admin list. */
export const inviteState = (
  invite: RentalInviteRecord,
  claimed: boolean
): 'revoked' | 'expired' | 'started' | 'live' => {
  if (invite.revokedAt) return 'revoked';
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return 'expired';
  if (claimed) return 'started';
  return 'live';
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/**
 * What we ask for, in the order it is asked.
 *
 * A closed set rather than free-text categories: the applicant needs to know
 * what is wanted, and the admin needs to see at a glance what is missing.
 *
 * `rental_application` is here because people routinely arrive having already
 * filled in a form on somebody else's paperwork, and re-typing it is a worse
 * experience than reading their PDF. `credit_report` is an applicant-supplied
 * free report, which is useful context and is NOT screening — screening is
 * ordered through a bureau, which is also why nothing here asks for an SSN.
 */
export const DOCUMENT_KINDS = [
  {
    id: 'photo_id',
    title: 'Photo ID',
    blurb: "Driver's licence, state ID or passport.",
  },
  {
    id: 'pay_stub',
    title: 'Pay stubs',
    blurb: 'Your two or three most recent. Black out the account number on any direct-deposit line.',
  },
  {
    id: 'tax_return',
    title: 'Tax return or W-2',
    blurb: 'Last year. Helpful if your income varies or you are self-employed.',
  },
  {
    id: 'credit_report',
    title: 'Credit report',
    blurb: 'Optional. A free report from annualcreditreport.com is fine.',
  },
  {
    id: 'financial',
    title: 'Other financial documents',
    blurb: 'An offer letter, benefit award letter, or proof of savings. Cover any account numbers.',
  },
  {
    id: 'reference_letter',
    title: 'Reference or employment letter',
    blurb: 'From a previous landlord or your employer.',
  },
  {
    id: 'rental_application',
    title: 'A completed application you already have',
    blurb: 'If you have filled in an application on another form, upload it here instead of retyping it.',
  },
  {
    id: 'other',
    title: 'Anything else',
    blurb: 'Tell us what it is and attach it.',
  },
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]['id'];

/** The kinds where the applicant's own label is worth asking for. */
export const LABELLED_KINDS: DocumentKind[] = ['other', 'rental_application'];

export const DOCUMENT_BUCKET = 'rental-documents';

/**
 * Mirrors `allowed_mime_types` and `file_size_limit` on the bucket. Checked here
 * for the error message only — Storage enforces both server-side, so a crafted
 * request cannot get past them by skipping this file.
 */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
/** For the file picker. Extensions as well as types, because HEIC reports neither reliably. */
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*';

export interface RentalDocumentRecord {
  id: string;
  applicationId: string;
  kind: DocumentKind;
  label: string | null;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** The admin's note about this one file. Applicants read it; they cannot write it. */
  adminNote: string | null;
  needsReplacement: boolean;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- same boundary cast as toRecord above. */
const toDocument = (row: any): RentalDocumentRecord => ({
  id: row.id,
  applicationId: row.application_id,
  kind: row.kind as DocumentKind,
  label: row.label ?? null,
  storagePath: row.storage_path,
  fileName: row.file_name,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes ?? 0,
  adminNote: row.admin_note ?? null,
  needsReplacement: Boolean(row.needs_replacement),
  createdAt: row.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Bytes as something a person reads. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** RLS scopes this to the applicant's own application, or to any of them for an admin. */
export const listDocuments = async (applicationId: string): Promise<RentalDocumentRecord[]> => {
  const { data, error } = await supabase
    .from('rental_application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toDocument);
};

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : '';
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'bin';
};

/**
 * Uploads one file and records it.
 *
 * The object is written FIRST and the row second, because a row pointing at
 * nothing is worse than a moment of neither. If the row fails — most likely the
 * count guard in the migration — the object is removed again, so a refusal
 * cannot leave an orphan that nothing references and nobody is billed for on
 * purpose.
 */
export const uploadDocument = async (
  applicationId: string,
  kind: DocumentKind,
  file: File,
  label?: string
): Promise<RentalDocumentRecord> => {
  if (file.size === 0) throw new Error('That file is empty.');
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error(
      `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_DOCUMENT_BYTES)}.`
    );
  }
  // An empty type is common for HEIC from some browsers, so fall back to the
  // extension rather than refusing a file the bucket would have accepted.
  const ext = extensionOf(file.name);
  const type =
    file.type ||
    (ext === 'pdf' ? 'application/pdf' : ext === 'heic' || ext === 'heif' ? 'image/heic' : '');
  if (!DOCUMENT_MIME_TYPES.includes(type as (typeof DOCUMENT_MIME_TYPES)[number])) {
    throw new Error('Only PDFs and images (JPG, PNG, WEBP, HEIC) can be uploaded.');
  }

  // The applicant's filename never goes in the path — it is text they control.
  const path = `${applicationId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, {
      // Required. Without it the object is stored `cache-control: no-cache` and
      // re-transfers on every view — the mistake that made /properties the
      // entire egress bill. An hour, not a year: these are read rarely, and
      // always through a freshly signed URL.
      cacheControl: '3600',
      contentType: type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('rental_application_documents')
    .insert({
      application_id: applicationId,
      kind,
      label: label?.trim() || null,
      storage_path: path,
      file_name: file.name.slice(0, 200),
      mime_type: type,
      size_bytes: file.size,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    throw error;
  }
  return toDocument(data);
};

/** Removes the object first, then the row — see the ordering note on upload. */
export const deleteDocument = async (doc: RentalDocumentRecord): Promise<void> => {
  const { error: removeError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .remove([doc.storagePath]);
  if (removeError) throw removeError;

  const { error } = await supabase.from('rental_application_documents').delete().eq('id', doc.id);
  if (error) throw error;
};

/**
 * A link to read one document, good for five minutes and minted on click.
 *
 * Never `getPublicUrl`: the bucket is private, and a pay stub behind a permanent
 * unguessable URL is a pay stub on the open internet.
 */
export const documentUrl = async (doc: RentalDocumentRecord): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storagePath, 300);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('Could not open that document.');
  return data.signedUrl;
};

/** Admin only — there is no applicant UPDATE policy on the table. */
export const setDocumentNote = async (
  id: string,
  patch: { adminNote?: string | null; needsReplacement?: boolean }
): Promise<void> => {
  const { error } = await supabase
    .from('rental_application_documents')
    .update({
      ...(patch.adminNote !== undefined ? { admin_note: patch.adminNote || null } : {}),
      ...(patch.needsReplacement !== undefined
        ? { needs_replacement: patch.needsReplacement }
        : {}),
    })
    .eq('id', id);
  if (error) throw error;
};

/**
 * Emails the invite link to the address on the invite.
 *
 * Takes the invite's id and not an email address: the edge function looks the
 * recipient up itself, so this cannot be used to mail an arbitrary person. It
 * also re-checks that the caller is an admin, which `resolve` and `claim` do not
 * need to.
 */
export const sendInvite = async (inviteId: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('rental-application-invite', {
    // The origin so a preview deployment mails a link to itself; the function
    // only honours one of ours and falls back to the canonical site.
    body: {
      action: 'send',
      inviteId,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  if (data && data.sent === false) throw new Error(data.error ?? 'Could not send the email.');
};
