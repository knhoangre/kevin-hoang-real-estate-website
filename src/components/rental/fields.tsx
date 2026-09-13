/**
 * The rental application's field vocabulary.
 *
 * Eleven sections, roughly ninety inputs. Every one of them is one of these
 * five components, so the form cannot drift into five spellings of the same
 * text input the way `formatPrice` once did.
 *
 * The card and grid treatments are lifted from the /contact form panel
 * (src/pages/Contact.tsx) rather than invented, so the application reads as
 * part of this site.
 */
import { type Control, type FieldValues, type Path, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPhoneInput } from '@/lib/phone';

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

/**
 * One section of the document.
 *
 * `id` is the jump target for the sticky index, and the heading is a real <h2>
 * so the section list is a document outline rather than a set of styled divs.
 */
export const Section = ({
  id,
  title,
  blurb,
  children,
  delay = 0,
}: {
  id: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
  /** Stagger, in seconds. CSS `.enter`, never framer-motion. */
  delay?: number;
}) => (
  <section
    id={id}
    // scroll-mt clears the fixed h-20 navbar, or a jump link lands with the
    // heading underneath it.
    className="enter scroll-mt-28 rounded-xl border border-gray-100 bg-white shadow-lg shadow-black/10"
    style={{ '--enter-delay': `${delay}s` } as React.CSSProperties}
    aria-labelledby={`${id}-heading`}
  >
    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-5">
      <h2
        id={`${id}-heading`}
        className="text-xl font-semibold uppercase tracking-wide text-ink md:text-2xl"
      >
        {title}
      </h2>
      {blurb && <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{blurb}</p>}
    </div>
    <div className="space-y-6 p-6">{children}</div>
  </section>
);

/** Two fields to a row on anything wider than a phone, as /contact does. */
export const Row = ({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}) => (
  <div
    className={
      {
        1: 'grid grid-cols-1 gap-4',
        2: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
        3: 'grid grid-cols-1 gap-4 sm:grid-cols-3',
        4: 'grid grid-cols-2 gap-4 sm:grid-cols-4',
      }[cols]
    }
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

interface FieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
  maxLength?: number;
  disabled?: boolean;
}

/**
 * A visible <label>, not a placeholder standing in for one.
 *
 * The required mark is red, matching the validation messages: it is a signal,
 * and recolouring it to champagne would make it decoration.
 */
const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <FormLabel className="text-sm font-medium text-ink">
    {children}
    {required && (
      <span className="ml-0.5 text-red-600" aria-hidden>
        *
      </span>
    )}
    {required && <span className="sr-only"> (required)</span>}
  </FormLabel>
);

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  required,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  disabled,
}: FieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label required={required}>{label}</Label>
          <FormControl>
            <Input
              {...field}
              // Deliberately NOT `className="uppercase"`, which /contact uses.
              // It is tolerable on four short fields and wrong on a legal
              // document: a street, an employer and a signature must render as
              // the applicant entered them.
              type={type}
              value={field.value ?? ''}
              placeholder={placeholder}
              autoComplete={autoComplete}
              inputMode={inputMode}
              maxLength={maxLength}
              disabled={disabled}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Formats to 774-222-0952 as the caller types.
 *
 * Reformatted from the raw digits on every change rather than by inserting a
 * hyphen at the cursor, so pasting `(774) 222-0952` normalises and backspace
 * needs no special case.
 */
export function PhoneField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  autoComplete = 'tel',
  disabled,
}: Omit<FieldProps<T>, 'type' | 'inputMode'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label required={required}>{label}</Label>
          <FormControl>
            <Input
              {...field}
              type="tel"
              inputMode="tel"
              autoComplete={autoComplete}
              placeholder="123-456-7890"
              maxLength={12}
              disabled={disabled}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(formatPhoneInput(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A dollar amount. `$` sits inside the field so the unit is never ambiguous. */
export function MoneyField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  disabled,
}: Omit<FieldProps<T>, 'type' | 'inputMode'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label required={required}>{label}</Label>
          <FormControl>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                aria-hidden
              >
                $
              </span>
              <Input
                {...field}
                className="pl-7"
                inputMode="decimal"
                placeholder="2,400"
                disabled={disabled}
                value={field.value ?? ''}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DateField<T extends FieldValues>(props: Omit<FieldProps<T>, 'type'>) {
  return <TextField {...props} type="date" />;
}

export function TextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  required,
  disabled,
}: FieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label required={required}>{label}</Label>
          <FormControl>
            <Textarea
              {...field}
              className="h-24"
              placeholder={placeholder}
              disabled={disabled}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A checkbox with its label beside it, and room for consent text underneath. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: Omit<FieldProps<T>, 'type' | 'placeholder' | 'required'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className="mt-0.5 data-[state=checked]:border-ink data-[state=checked]:bg-ink"
            />
          </FormControl>
          <div className="space-y-1">
            <FormLabel className="text-sm font-medium leading-snug text-ink">{label}</FormLabel>
            {description && (
              <p className="text-sm leading-relaxed text-gray-600">{description}</p>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Address                                                             */
/* ------------------------------------------------------------------ */

/**
 * Street / city / state / ZIP, the same four fields in the same order every
 * time they appear — which in this document is five separate places.
 */
export function AddressFields<T extends FieldValues>({
  control,
  prefix,
  required,
  disabled,
}: {
  control: Control<T>;
  /** Dotted path to the object holding street/city/state/zip. */
  prefix: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const at = (leaf: string) => `${prefix}.${leaf}` as Path<T>;
  return (
    <>
      <TextField
        control={control}
        name={at('street')}
        label="Street address"
        required={required}
        autoComplete="street-address"
        disabled={disabled}
      />
      <Row cols={3}>
        <TextField
          control={control}
          name={at('city')}
          label="City"
          required={required}
          disabled={disabled}
        />
        <TextField
          control={control}
          name={at('state')}
          label="State"
          placeholder="MA"
          maxLength={2}
          required={required}
          disabled={disabled}
        />
        <TextField
          control={control}
          name={at('zip')}
          label="ZIP"
          inputMode="numeric"
          maxLength={10}
          required={required}
          disabled={disabled}
        />
      </Row>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Repeatable rows                                                     */
/* ------------------------------------------------------------------ */

/**
 * Add/remove rows for the list fields — co-tenants, children, pets, other
 * income.
 *
 * Renders no rows when the list is empty and only an "Add" button, because
 * every one of these lists is optional and a blank row reads as something the
 * applicant is expected to fill.
 */
export const Repeatable = ({
  legend,
  addLabel,
  count,
  onAdd,
  onRemove,
  disabled,
  children,
}: {
  legend: string;
  addLabel: string;
  count: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  /** Called per row; receives the row index. */
  children: (index: number) => React.ReactNode;
}) => (
  <fieldset className="space-y-4">
    <legend className="text-sm font-medium text-ink">{legend}</legend>

    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="rounded-lg border border-gray-200 bg-bone/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {legend} {i + 1}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-xs font-medium text-red-700 underline decoration-red-300 underline-offset-4 hover:decoration-red-700"
            >
              Remove
              <span className="sr-only">
                {' '}
                {legend} {i + 1}
              </span>
            </button>
          )}
        </div>
        <div className="space-y-4">{children(i)}</div>
      </div>
    ))}

    {!disabled && (
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-champagne hover:text-champagne-ink"
      >
        + {addLabel}
      </button>
    )}
  </fieldset>
);

/** Convenience for the repeatable sections, which all manipulate array fields. */
export const useArrayField = <T extends FieldValues>(name: Path<T>, blank: unknown) => {
  const { watch, setValue } = useFormContext<T>();
  const rows = (watch(name) as unknown[]) ?? [];
  return {
    count: rows.length,
    add: () =>
      setValue(name, [...rows, blank] as never, { shouldDirty: true, shouldValidate: false }),
    remove: (index: number) =>
      setValue(name, rows.filter((_, i) => i !== index) as never, {
        shouldDirty: true,
        shouldValidate: false,
      }),
  };
};
