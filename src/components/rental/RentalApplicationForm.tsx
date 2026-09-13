/**
 * The rental application document.
 *
 * One `useForm` for all eleven sections, not a wizard. Two reasons: the submit
 * has to be atomic, and a wizard hides the length of the thing from someone who
 * is deciding whether to start it. The sticky index on the left is what a
 * wizard's progress bar was for.
 *
 * Sections live in this one file rather than eleven — they share the single
 * form context and none is used anywhere else, so splitting them would be
 * eleven files of imports around one <Row> each.
 *
 * `readOnly` renders the same document with every control disabled. That is
 * what the applicant sees after submitting and what the admin reads, so there
 * is exactly one rendering of an application on the site and no chance of the
 * admin's copy quietly omitting a field.
 */
import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import {
  APPLICATION_SECTIONS,
  SECTION_GROUPS,
  emptyApplication,
  rentalApplicationSchema,
  saveDraft,
  submitApplication,
  submissionSchema,
  type RentalApplicationData,
} from '@/lib/rentalApplication';
import {
  AddressFields,
  CheckboxField,
  DateField,
  MoneyField,
  PhoneField,
  Repeatable,
  Row,
  Section,
  TextAreaField,
  TextField,
  useArrayField,
} from './fields';
import DocumentsPanel from '@/components/rental/DocumentsPanel';

type Ctl = UseFormReturn<RentalApplicationData>['control'];

/* =================================================================== */
/* Sections                                                            */
/* =================================================================== */

const ApplicantSection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section id="applicant" title="About you" delay={0.05}>
    <Row cols={2}>
      <TextField
        control={control}
        name="applicant.firstName"
        label="First name"
        required
        autoComplete="given-name"
        disabled={ro}
      />
      <TextField
        control={control}
        name="applicant.lastName"
        label="Last name"
        required
        autoComplete="family-name"
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField
        control={control}
        name="applicant.middleInitial"
        label="Middle initial"
        maxLength={2}
        disabled={ro}
      />
      <DateField
        control={control}
        name="applicant.dateOfBirth"
        label="Date of birth"
        required
        autoComplete="bday"
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField
        control={control}
        name="applicant.email"
        label="Email"
        type="email"
        inputMode="email"
        required
        autoComplete="email"
        disabled={ro}
      />
      <PhoneField control={control} name="applicant.phone" label="Phone" required disabled={ro} />
    </Row>
    <TextField
      control={control}
      name="applicant.bestTimeToContact"
      label="Best time to reach you"
      placeholder="Weekday evenings"
      disabled={ro}
    />
  </Section>
);

const ResidenceSection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section
    id="residence"
    title="Where you live now"
    blurb="Your current address, and the landlord we may contact for a reference."
    delay={0.1}
  >
    <AddressFields control={control} prefix="currentResidence" required disabled={ro} />
    <Row cols={3}>
      <DateField
        control={control}
        name="currentResidence.movedIn"
        label="Moved in"
        required
        disabled={ro}
      />
      <DateField
        control={control}
        name="currentResidence.movedOut"
        label="Moving out"
        disabled={ro}
      />
      <MoneyField
        control={control}
        name="currentResidence.monthlyRent"
        label="Monthly rent"
        disabled={ro}
      />
    </Row>
    <TextAreaField
      control={control}
      name="currentResidence.reasonForLeaving"
      label="Reason for leaving"
      disabled={ro}
    />

    <div className="border-t border-gray-100 pt-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
        Current landlord
      </p>
      <Row cols={2}>
        <TextField
          control={control}
          name="currentResidence.landlordName"
          label="Name"
          disabled={ro}
        />
        <PhoneField
          control={control}
          name="currentResidence.landlordPhone"
          label="Phone"
          autoComplete="off"
          disabled={ro}
        />
      </Row>
      <div className="mt-4">
        <TextField
          control={control}
          name="currentResidence.landlordAddress"
          label="Address"
          disabled={ro}
        />
      </div>
    </div>
  </Section>
);

const PreviousResidenceSection = ({
  control,
  ro,
  show,
}: {
  control: Ctl;
  ro: boolean;
  show: boolean;
}) => (
  <Section
    id="previous-residence"
    title="Previous address"
    blurb="Include this if you have lived at your current address for less than two years."
    delay={0.15}
  >
    <CheckboxField
      control={control}
      name="hasPreviousResidence"
      label="I have a previous address to add"
      disabled={ro}
    />
    {show && (
      <div className="space-y-6 border-t border-gray-100 pt-6">
        <AddressFields control={control} prefix="previousResidence" disabled={ro} />
        <Row cols={3}>
          <DateField
            control={control}
            name="previousResidence.movedIn"
            label="Moved in"
            disabled={ro}
          />
          <DateField
            control={control}
            name="previousResidence.movedOut"
            label="Moved out"
            disabled={ro}
          />
          <MoneyField
            control={control}
            name="previousResidence.monthlyRent"
            label="Monthly rent"
            disabled={ro}
          />
        </Row>
        <Row cols={2}>
          <TextField
            control={control}
            name="previousResidence.landlordName"
            label="Landlord name"
            disabled={ro}
          />
          <PhoneField
            control={control}
            name="previousResidence.landlordPhone"
            label="Landlord phone"
            autoComplete="off"
            disabled={ro}
          />
        </Row>
        <TextField
          control={control}
          name="previousResidence.landlordAddress"
          label="Landlord address"
          disabled={ro}
        />
      </div>
    )}
  </Section>
);

const EmploymentSection = ({
  control,
  ro,
  showPrevious,
}: {
  control: Ctl;
  ro: boolean;
  showPrevious: boolean;
}) => (
  <Section
    id="employment"
    title="Employment and income"
    blurb="Enough to show the rent is affordable."
    delay={0.2}
  >
    <Row cols={2}>
      <TextField
        control={control}
        name="employment.employer"
        label="Employer"
        required
        autoComplete="organization"
        disabled={ro}
      />
      <TextField
        control={control}
        name="employment.occupation"
        label="Occupation"
        required
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField
        control={control}
        name="employment.businessType"
        label="Type of business"
        disabled={ro}
      />
      <TextField
        control={control}
        name="employment.lengthOfEmployment"
        label="Length of employment"
        placeholder="3 years"
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <MoneyField
        control={control}
        name="employment.grossMonthlyIncome"
        label="Gross monthly income"
        required
        description="Before taxes and deductions."
        disabled={ro}
      />
      <PhoneField
        control={control}
        name="employment.phone"
        label="Work phone"
        autoComplete="off"
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField
        control={control}
        name="employment.address"
        label="Employer address"
        disabled={ro}
      />
      <TextField
        control={control}
        name="employment.supervisor"
        label="Supervisor"
        disabled={ro}
      />
    </Row>

    <div className="border-t border-gray-100 pt-6">
      <CheckboxField
        control={control}
        name="hasPreviousEmployment"
        label="I have a previous employer to add"
        disabled={ro}
      />
      {showPrevious && (
        <div className="mt-6 space-y-4">
          <Row cols={2}>
            <TextField
              control={control}
              name="previousEmployment.employer"
              label="Previous employer"
              disabled={ro}
            />
            <TextField
              control={control}
              name="previousEmployment.occupation"
              label="Occupation"
              disabled={ro}
            />
          </Row>
          <Row cols={2}>
            <TextField
              control={control}
              name="previousEmployment.lengthOfEmployment"
              label="Length of employment"
              disabled={ro}
            />
            <PhoneField
              control={control}
              name="previousEmployment.phone"
              label="Phone"
              autoComplete="off"
              disabled={ro}
            />
          </Row>
          <TextField
            control={control}
            name="previousEmployment.address"
            label="Address"
            disabled={ro}
          />
        </div>
      )}
    </div>
  </Section>
);

const OtherIncomeSection = ({ control, ro }: { control: Ctl; ro: boolean }) => {
  const rows = useArrayField<RentalApplicationData>('otherIncome', {
    source: '',
    monthlyAmount: '',
  });

  return (
    <Section
      id="other-income"
      title="Other income"
      // Source of income is a protected class in Massachusetts. This section
      // asks what the applicant chooses to offer and requires nothing.
      blurb="Optional. Add anything you would like considered alongside your employment income."
      delay={0.25}
    >
      <Repeatable
        legend="Income source"
        addLabel="Add an income source"
        count={rows.count}
        onAdd={rows.add}
        onRemove={rows.remove}
        disabled={ro}
      >
        {(i) => (
          <Row cols={2}>
            <TextField
              control={control}
              name={`otherIncome.${i}.source` as const}
              label="Source"
              disabled={ro}
            />
            <MoneyField
              control={control}
              name={`otherIncome.${i}.monthlyAmount` as const}
              label="Monthly amount"
              disabled={ro}
            />
          </Row>
        )}
      </Repeatable>
    </Section>
  );
};

const ReferencesSection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section id="references" title="References" delay={0.3}>
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
        Personal reference
      </p>
      <Row cols={2}>
        <TextField control={control} name="personalReference.name" label="Name" disabled={ro} />
        <TextField
          control={control}
          name="personalReference.relationship"
          label="Relationship"
          disabled={ro}
        />
      </Row>
      <div className="mt-4">
        <Row cols={2}>
          <TextField
            control={control}
            name="personalReference.address"
            label="Address"
            disabled={ro}
          />
          <PhoneField
            control={control}
            name="personalReference.phone"
            label="Phone"
            autoComplete="off"
            disabled={ro}
          />
        </Row>
      </div>
    </div>

    <div className="border-t border-gray-100 pt-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
        Credit reference
      </p>
      <Row cols={2}>
        <TextField control={control} name="creditReference.name" label="Name" disabled={ro} />
        <PhoneField
          control={control}
          name="creditReference.phone"
          label="Phone"
          autoComplete="off"
          disabled={ro}
        />
      </Row>
      <div className="mt-4">
        <TextField
          control={control}
          name="creditReference.address"
          label="Address"
          disabled={ro}
        />
      </div>
    </div>
  </Section>
);

const EmergencySection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section
    id="emergency"
    title="Emergency contact"
    blurb="Someone we can reach if we cannot reach you."
    delay={0.35}
  >
    <Row cols={2}>
      <TextField control={control} name="emergencyContact.name" label="Name" disabled={ro} />
      <TextField
        control={control}
        name="emergencyContact.relationship"
        label="Relationship"
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField control={control} name="emergencyContact.address" label="Address" disabled={ro} />
      <PhoneField
        control={control}
        name="emergencyContact.phone"
        label="Phone"
        autoComplete="off"
        disabled={ro}
      />
    </Row>
  </Section>
);

const HouseholdSection = ({ control, ro }: { control: Ctl; ro: boolean }) => {
  const coTenants = useArrayField<RentalApplicationData>('household.coTenants', {
    name: '',
    email: '',
  });
  const children = useArrayField<RentalApplicationData>('household.minorChildren', {
    name: '',
    age: '',
  });
  const pets = useArrayField<RentalApplicationData>('household.pets', {
    type: '',
    breed: '',
    weight: '',
  });

  return (
    <Section
      id="household"
      title="Household"
      blurb="Everyone who would be living there, including children and pets."
      delay={0.4}
    >
      <Row cols={2}>
        <TextField
          control={control}
          name="household.totalOccupants"
          label="Total occupants"
          inputMode="numeric"
          maxLength={2}
          disabled={ro}
        />
        <TextField
          control={control}
          name="household.adults"
          label="Adults"
          inputMode="numeric"
          maxLength={2}
          disabled={ro}
        />
      </Row>

      <div className="border-t border-gray-100 pt-6">
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          <strong className="font-semibold text-ink">Every adult files separately.</strong> List
          any co-applicants here and each will receive their own application link.
        </p>
        <Repeatable
          legend="Co-applicant"
          addLabel="Add a co-applicant"
          count={coTenants.count}
          onAdd={coTenants.add}
          onRemove={coTenants.remove}
          disabled={ro}
        >
          {(i) => (
            <Row cols={2}>
              <TextField
                control={control}
                name={`household.coTenants.${i}.name` as const}
                label="Name"
                disabled={ro}
              />
              <TextField
                control={control}
                name={`household.coTenants.${i}.email` as const}
                label="Email"
                type="email"
                inputMode="email"
                disabled={ro}
              />
            </Row>
          )}
        </Repeatable>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <Repeatable
          legend="Child"
          addLabel="Add a child"
          count={children.count}
          onAdd={children.add}
          onRemove={children.remove}
          disabled={ro}
        >
          {(i) => (
            <Row cols={2}>
              <TextField
                control={control}
                name={`household.minorChildren.${i}.name` as const}
                label="Name"
                disabled={ro}
              />
              <TextField
                control={control}
                name={`household.minorChildren.${i}.age` as const}
                label="Age"
                inputMode="numeric"
                maxLength={2}
                disabled={ro}
              />
            </Row>
          )}
        </Repeatable>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <Repeatable
          legend="Pet"
          addLabel="Add a pet"
          count={pets.count}
          onAdd={pets.add}
          onRemove={pets.remove}
          disabled={ro}
        >
          {(i) => (
            <Row cols={3}>
              <TextField
                control={control}
                name={`household.pets.${i}.type` as const}
                label="Type"
                placeholder="Dog"
                disabled={ro}
              />
              <TextField
                control={control}
                name={`household.pets.${i}.breed` as const}
                label="Breed"
                disabled={ro}
              />
              <TextField
                control={control}
                name={`household.pets.${i}.weight` as const}
                label="Weight (lb)"
                inputMode="numeric"
                maxLength={3}
                disabled={ro}
              />
            </Row>
          )}
        </Repeatable>
      </div>
    </Section>
  );
};

const VehicleSection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section
    id="vehicle"
    title="Vehicle"
    blurb="Only needed if you would be parking on the property."
    delay={0.45}
  >
    <Row cols={3}>
      <TextField control={control} name="vehicle.make" label="Make" disabled={ro} />
      <TextField control={control} name="vehicle.model" label="Model" disabled={ro} />
      <TextField
        control={control}
        name="vehicle.year"
        label="Year"
        inputMode="numeric"
        maxLength={4}
        disabled={ro}
      />
    </Row>
    <Row cols={2}>
      <TextField control={control} name="vehicle.plate" label="Plate number" disabled={ro} />
      <TextField
        control={control}
        name="vehicle.plateState"
        label="Plate state"
        placeholder="MA"
        maxLength={2}
        disabled={ro}
      />
    </Row>
  </Section>
);

const TenancySection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section id="tenancy" title="The unit you want" delay={0.5}>
    <Row cols={2}>
      <TextField
        control={control}
        name="tenancy.propertyAddress"
        label="Property address"
        required
        disabled={ro}
      />
      <TextField control={control} name="tenancy.unit" label="Unit" disabled={ro} />
    </Row>
    <Row cols={3}>
      <DateField
        control={control}
        name="tenancy.desiredOccupancyDate"
        label="Desired move-in"
        required
        disabled={ro}
      />
      <TextField
        control={control}
        name="tenancy.leaseTermMonths"
        label="Lease term (months)"
        inputMode="numeric"
        maxLength={3}
        placeholder="12"
        disabled={ro}
      />
      <MoneyField control={control} name="tenancy.baseRent" label="Base rent" disabled={ro} />
    </Row>
    <TextField
      control={control}
      name="tenancy.otherMonthlyCharges"
      label="Other monthly charges"
      placeholder="Parking, storage"
      disabled={ro}
    />
  </Section>
);

/**
 * The fair-housing notice.
 *
 * The paper form carries an equivalent paragraph and it is a real obligation,
 * not boilerplate. Written in our own words — the GBREB form is copyrighted —
 * and updated to the classes Massachusetts protects today, which is a longer
 * list than the 1969 original names.
 */
const FairHousingNotice = () => (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-lg leading-none" aria-hidden>
        ⌂
      </span>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-900">
          Equal Housing Opportunity
        </p>
        <p className="mt-2 text-sm leading-relaxed text-blue-900/90">
          Under Massachusetts and federal law, no question on this application is asked for the
          purpose of considering your race, color, religion, national origin, ancestry, sex,
          sexual orientation, gender identity, age, marital status, familial status, veteran or
          military status, disability, receipt of public assistance, or any other protected
          characteristic. If any question appears to you to do so, you are not required to answer
          it — tell us and we will remove it.
        </p>
      </div>
    </div>
  </div>
);

const ConsentsSection = ({ control, ro }: { control: Ctl; ro: boolean }) => (
  <Section id="consents" title="Authorization and signature" delay={0.55}>
    <FairHousingNotice />

    <div className="space-y-5 border-t border-gray-100 pt-6">
      <CheckboxField
        control={control}
        name="consents.creditAuthorization"
        label="I authorize a consumer credit and rental history report"
        description="I authorize the owner and their agent to obtain, or have prepared, a consumer credit report and rental history relating to this application. I understand this application is subject to the owner's approval and does not create a tenancy."
        disabled={ro}
      />
      <CheckboxField
        control={control}
        name="consents.certification"
        label="I certify that my answers are true and complete"
        description="I understand that a material misstatement may result in this application being declined, or in a tenancy agreement being terminated. The renting agent is not authorized to make representations about the property and no tenancy exists until a written agreement is signed by the owner."
        disabled={ro}
      />
    </div>

    <div className="border-t border-gray-100 pt-6">
      <Row cols={2}>
        <TextField
          control={control}
          name="consents.signature"
          label="Signature — type your full name"
          placeholder="Your full name"
          required
          disabled={ro}
        />
        <DateField control={control} name="consents.signatureDate" label="Date" disabled={ro} />
      </Row>
    </div>
  </Section>
);

/* =================================================================== */
/* Section index                                                       */
/* =================================================================== */

/**
 * Sticky table of contents. It is also the honest answer to "how long is
 * this?", which a wizard hides.
 *
 * `print:hidden` — on paper the jump links are eleven dead words at the top.
 */
const SectionIndex = ({ activeId }: { activeId: string }) => (
  <nav aria-label="Application sections" className="hidden lg:block print:hidden">
    <div className="sticky top-28">
      {SECTION_GROUPS.map((group) => {
        const sections = APPLICATION_SECTIONS.filter((s) => s.group === group.id);
        if (sections.length === 0) return null;
        return (
          <div key={group.id} className="mb-6 last:mb-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              {group.title}
            </p>
            <ol className="space-y-1.5">
              {sections.map((section) => {
                const current = section.id === activeId;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={current ? 'true' : undefined}
                      className={`block rounded-md px-2 py-1 text-sm transition-colors ${
                        current
                          ? 'font-medium text-champagne-ink underline decoration-champagne decoration-2 underline-offset-4'
                          : 'text-gray-600 hover:text-ink'
                      }`}
                    >
                      {section.title}
                      {/* The group heading already says the whole run is
                          optional, so repeating it on each line is noise. Only
                          the one optional section outside that run is marked. */}
                      {!section.required && section.group !== 'application' && (
                        <span className="ml-1.5 text-xs text-gray-400">optional</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  </nav>
);

/* =================================================================== */
/* The form                                                            */
/* =================================================================== */

const AUTOSAVE_MS = 2000;

const savedAt = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function RentalApplicationForm({
  applicationId,
  initial,
  readOnly = false,
  documentUploads,
  adminDocuments = false,
  alreadySent = false,
  onSubmitted,
}: {
  applicationId: string;
  initial: RentalApplicationData;
  /** Renders the same document with every control disabled and no submit. */
  readOnly?: boolean;
  /**
   * Whether the documents section accepts files. Separate from `readOnly`
   * because the answers freeze at submit and the attachments deliberately do
   * not — /rentals shows a submitted application read-only with uploads still
   * open. Defaults to following `readOnly`.
   */
  documentUploads?: boolean;
  /** Admin view of the documents: per-file notes and replace requests. */
  adminDocuments?: boolean;
  /**
   * This application has been sent once already and is being edited inside the
   * window before review starts. Changes the action from "submit" to "send the
   * version you want read", which is what the second press actually means.
   */
  alreadySent?: boolean;
  onSubmitted?: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<RentalApplicationData>({
    // The draft schema, not `submissionSchema`: validating the submit-only
    // rules on every keystroke would put a half-filled form permanently in an
    // error state. Those rules run once, in submitApplication.
    resolver: zodResolver(rentalApplicationSchema),
    defaultValues: initial ?? emptyApplication(),
    mode: 'onBlur',
  });
  const { control } = form;

  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [activeSection, setActiveSection] = useState(APPLICATION_SECTIONS[0].id);

  // A ref, not state: setState is async, so a fast double click (or click plus
  // Enter) can have both handlers read submitting === false and each fire.
  const inFlight = useRef(false);

  const showPreviousResidence = form.watch('hasPreviousResidence');
  const showPreviousEmployment = form.watch('hasPreviousEmployment');

  /* ---- Autosave ---------------------------------------------------- */
  useEffect(() => {
    if (readOnly) return;
    let timer: ReturnType<typeof setTimeout>;

    const subscription = form.watch((values) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await saveDraft(applicationId, values as RentalApplicationData);
          setLastSaved(new Date().toISOString());
          setSaveFailed(false);
        } catch (err) {
          // Not a toast. Autosave fires constantly, and a failing network would
          // stack a toast every two seconds on top of the field being typed in.
          console.error('Draft autosave failed:', err);
          setSaveFailed(true);
        }
      }, AUTOSAVE_MS);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [form, applicationId, readOnly]);

  /* ---- Which section is on screen ---------------------------------- */
  useEffect(() => {
    const sections = APPLICATION_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      // The band just under the navbar. Without the negative top the section
      // scrolling off the screen stays "current" all the way out.
      { rootMargin: '-88px 0px -55% 0px', threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ---- Submit ------------------------------------------------------ */
  const onSubmit = async (values: RentalApplicationData) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      await submitApplication(applicationId, values);
      toast({
        title: alreadySent ? 'Changes sent' : 'Application submitted',
        description: alreadySent
          ? 'Kevin will read the updated version.'
          : 'Kevin has received it. You will hear back about next steps.',
      });
      onSubmitted?.();
    } catch (err) {
      // The submit-only rules (both consents, matching signature) live in
      // submissionSchema and are checked inside submitApplication, so a zod
      // error here is a real missing answer rather than a transport failure.
      const isValidation = err instanceof Error && err.name === 'ZodError';
      toast({
        variant: 'destructive',
        title: isValidation ? 'Something is missing' : 'Could not submit',
        description: isValidation
          ? 'Please review the highlighted fields — the authorization, the certification and your typed signature are all required.'
          : 'Your answers are saved. Please try again in a moment.',
      });
      console.error('Application submit failed:', err);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  /**
   * react-hook-form's invalid handler. Sends the reader to the first field
   * that needs them rather than leaving them at the bottom of a long document
   * with a generic error.
   */
  const onInvalid = () => {
    toast({
      variant: 'destructive',
      title: 'Some answers are missing',
      description: 'We have marked the fields that still need an answer.',
    });
    const firstError = document.querySelector('[aria-invalid="true"]');
    firstError?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    (firstError as HTMLElement | null)?.focus?.();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <SectionIndex activeId={activeSection} />

      <FormProvider {...form}>
        <Form {...form}>
          <div className="space-y-6">
            {/* A plain div, not a <form>: only the element around the submit
                button needs to be one, and wrapping the required section made
                Enter in a name field fire a submit of a document the applicant
                had barely started. */}
            <div>
              <ApplicantSection control={control} ro={readOnly} />
            </div>

            {/* Documents come SECOND, immediately after the part we require and
                before the long optional run. That order is the offer: tell us who
                you are, hand us what you already have, and only fill in the rest
                if you want to. Outside a <form> because a file input feeds the
                watcher that drives autosave. */}
            <DocumentsPanel
              applicationId={applicationId}
              canUpload={documentUploads ?? !readOnly}
              admin={adminDocuments}
            />

            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              {!readOnly && (
                <div className="rounded-xl border border-champagne/40 bg-bone p-5 print:hidden">
                  <h2 className="font-display text-lg font-semibold text-ink">
                    The rest is optional
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                    If you have already completed an application on another form, upload it
                    above and leave this blank — nothing below is required. Filling it in gives
                    a fuller picture, and you can do as much or as little of it as you like.
                  </p>
                </div>
              )}

              <ResidenceSection control={control} ro={readOnly} />
              <PreviousResidenceSection
                control={control}
                ro={readOnly}
                show={Boolean(showPreviousResidence)}
              />
              <EmploymentSection
                control={control}
                ro={readOnly}
                showPrevious={Boolean(showPreviousEmployment)}
              />
              <OtherIncomeSection control={control} ro={readOnly} />
              <ReferencesSection control={control} ro={readOnly} />
              <EmergencySection control={control} ro={readOnly} />
              <HouseholdSection control={control} ro={readOnly} />
              <VehicleSection control={control} ro={readOnly} />
              <TenancySection control={control} ro={readOnly} />
              <ConsentsSection control={control} ro={readOnly} />
            </form>

            {!readOnly && (
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                <div className="print:hidden">
                  {/* The submit treatment from /contact, so the application's
                      primary action looks like every other on the site. */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-md bg-ink py-3 uppercase text-white transition-all duration-300 hover:bg-black/80 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Submitting
                      </>
                    ) : (
                      <>
                        <span className="transition-transform duration-300 group-hover:-translate-x-2">
                          Submit application
                        </span>
                        <ArrowRight
                          className="ml-2 h-4 w-4 transform opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                          aria-hidden
                        />
                        <span className="absolute bottom-0 left-0 h-1 w-0 bg-white transition-all duration-700 group-hover:w-full" />
                      </>
                    )}
                  </button>

                  <p
                    className="mt-3 text-center text-sm text-gray-500"
                    aria-live="polite"
                    role="status"
                  >
                    {saveFailed ? (
                      <span className="text-red-700">
                        Could not save your progress — check your connection.
                      </span>
                    ) : lastSaved ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Saved {savedAt(lastSaved)}
                      </span>
                    ) : (
                      'Your progress saves automatically. You can close this and come back.'
                    )}
                  </p>

                  <p className="mt-2 text-center text-xs text-gray-500">
                    {alreadySent
                      ? 'Your answers stay editable until Kevin starts reviewing. Documents can be added at any time.'
                      : 'After you send it you can still make changes, until Kevin starts reviewing it. Documents can be added at any time.'}
                  </p>
                </div>
              </form>
            )}
          </div>
        </Form>
      </FormProvider>
    </div>
  );
}
