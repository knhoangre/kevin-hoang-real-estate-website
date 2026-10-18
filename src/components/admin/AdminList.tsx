/**
 * A list that is a table on a wide screen and a stack of rows on a phone.
 *
 * The admin lists were `<table>`s inside AdminCard, which is `overflow-hidden`.
 * On a phone the columns ran past the card's right edge and were cut off rather
 * than scrolled: the status of an application, the date on a showing tour and
 * when a client was last active were all on the page and impossible to reach
 * (Kevin, 2026-10-18). A wider table can only be scrolled sideways, which nobody
 * discovers; so on a phone each row is restacked instead — the first column on
 * its own line, the rest beneath it as "Label value" pairs that wrap.
 *
 * The header row is for sighted readers on a wide screen and is hidden from
 * assistive technology: every cell carries its own label, visible on a phone and
 * `sr-only` above it, so a screen reader hears "Status, Submitted" either way.
 *
 * A row with `to` is one link, the whole row — a real <a>, so it can be tabbed
 * to and opened in a new tab, which a `<tr onClick>` could not. It must then
 * hold no other link or button: an <a> inside an <a> is the nesting this site
 * has broken hydration with before. Rows that need their own controls (a View
 * link, Copy link) are plain rows and put them in an `end` column.
 */
import { Link } from 'react-router-dom';

export interface AdminColumn {
  label: string;
  /**
   * The column that names the row — a person, an address. Full width on a
   * phone, and unlabelled there, since what is in it says what it is.
   */
  primary?: boolean;
  /** Controls. Right-aligned on a wide screen, and unlabelled. */
  end?: boolean;
}

export interface AdminRow {
  key: string;
  /** The whole row is a link here. See the note on nesting above. */
  to?: string;
  cells: React.ReactNode[];
  /** Full width under the row — an editor opened from it. */
  detail?: React.ReactNode;
}

const ROW = 'flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-4 text-sm sm:px-6 md:grid md:gap-x-6';

const AdminList = ({
  columns,
  grid,
  rows,
  label,
}: {
  columns: AdminColumn[];
  /**
   * The wide-screen grid template, as a literal Tailwind class —
   * `md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`. It must be written out in
   * the calling file, where Tailwind's scanner can see it; a class assembled
   * from parts here would never be generated.
   */
  grid: string;
  rows: AdminRow[];
  /** Names the list for a screen reader. */
  label: string;
}) => {
  const cell = (column: AdminColumn, content: React.ReactNode, i: number) => (
    <div
      key={i}
      className={
        column.primary
          ? 'min-w-0 basis-full md:basis-auto'
          : `numeral flex min-w-0 items-center gap-1.5 text-gray-700 ${column.end ? 'md:justify-end' : ''}`
      }
    >
      {!column.primary && !column.end && column.label && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:sr-only">
          {column.label}
        </span>
      )}
      {content}
    </div>
  );

  return (
    <div>
      <div
        aria-hidden
        className={`hidden border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid md:gap-x-6 ${grid}`}
      >
        {columns.map((c, i) => (
          <span key={i} className={c.end ? 'text-right' : undefined}>
            {c.end ? '' : c.label}
          </span>
        ))}
      </div>
      <ul aria-label={label} className="divide-y divide-gray-100">
        {rows.map((row) => {
          const cells = columns.map((c, i) => cell(c, row.cells[i], i));
          return (
            <li key={row.key}>
              {row.to ? (
                <Link
                  to={row.to}
                  className={`${ROW} ${grid} transition-colors hover:bg-bone focus-visible:bg-bone focus-visible:outline-none`}
                >
                  {cells}
                </Link>
              ) : (
                <div className={`${ROW} ${grid}`}>{cells}</div>
              )}
              {row.detail}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdminList;
