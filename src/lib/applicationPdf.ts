/**
 * One PDF: the application, then everything the applicant uploaded.
 *
 * WHY pdf-lib AND NOT window.print(). The browser's print dialog can save a PDF
 * of the page, and that is still what the Print button does — but JavaScript
 * cannot get those bytes, so there is nothing to append the attachments to. A
 * merged file needs the document built in code.
 *
 * THE COST OF THAT, STATED PLAINLY: this is a SECOND rendering of an
 * application, and "one rendering of an application" is a rule this codebase
 * holds elsewhere (RentalApplicationForm in readOnly mode is both the
 * applicant's copy and the admin's, so neither can quietly omit a field). The
 * mitigation is `PDF_FIELDS` below plus the completeness check that walks the
 * blank document and asserts every leaf is covered here — so a field added to
 * the schema and forgotten here is caught by a test rather than by an owner
 * reading a PDF with a gap in it.
 *
 * Empty answers are OMITTED, not printed as blanks. The form is mostly optional
 * now; a PDF of forty "—" rows says nothing, and a heading over nothing is the
 * filler this project strips out everywhere else.
 */
import {
  documentUrl,
  formatTenancyAddress,
  DOCUMENT_KINDS,
  STATUS_LABEL,
  type DocumentKind,
  type RentalApplicationData,
  type RentalApplicationRecord,
  type RentalDocumentRecord,
} from '@/lib/rentalApplication';
import { SITE } from '@/lib/siteConfig';

/* ------------------------------------------------------------------ */
/* What goes in, and in what order                                     */
/* ------------------------------------------------------------------ */

type Field = { label: string; path: string };
type Group = { title: string; fields: Field[]; repeat?: string };

/**
 * Every leaf of RentalApplicationData, grouped the way the form groups it.
 *
 * `path` is dotted and is what the completeness check compares against the blank
 * document, so these strings are load-bearing rather than decorative.
 */
export const PDF_FIELDS: Group[] = [
  {
    title: 'Applicant',
    fields: [
      { label: 'First name', path: 'applicant.firstName' },
      { label: 'Middle initial', path: 'applicant.middleInitial' },
      { label: 'Last name', path: 'applicant.lastName' },
      { label: 'Date of birth', path: 'applicant.dateOfBirth' },
      { label: 'Email', path: 'applicant.email' },
      { label: 'Phone', path: 'applicant.phone' },
      { label: 'Best time to contact', path: 'applicant.bestTimeToContact' },
    ],
  },
  {
    title: 'Current residence',
    fields: [
      { label: 'Street', path: 'currentResidence.street' },
      { label: 'City', path: 'currentResidence.city' },
      { label: 'State', path: 'currentResidence.state' },
      { label: 'ZIP', path: 'currentResidence.zip' },
      { label: 'Moved in', path: 'currentResidence.movedIn' },
      { label: 'Moved out', path: 'currentResidence.movedOut' },
      { label: 'Monthly rent', path: 'currentResidence.monthlyRent' },
      { label: 'Reason for leaving', path: 'currentResidence.reasonForLeaving' },
      { label: 'Landlord', path: 'currentResidence.landlordName' },
      { label: 'Landlord address', path: 'currentResidence.landlordAddress' },
      { label: 'Landlord phone', path: 'currentResidence.landlordPhone' },
    ],
  },
  {
    title: 'Previous residence',
    fields: [
      { label: 'Has a previous address', path: 'hasPreviousResidence' },
      { label: 'Street', path: 'previousResidence.street' },
      { label: 'City', path: 'previousResidence.city' },
      { label: 'State', path: 'previousResidence.state' },
      { label: 'ZIP', path: 'previousResidence.zip' },
      { label: 'Moved in', path: 'previousResidence.movedIn' },
      { label: 'Moved out', path: 'previousResidence.movedOut' },
      { label: 'Monthly rent', path: 'previousResidence.monthlyRent' },
      { label: 'Landlord', path: 'previousResidence.landlordName' },
      { label: 'Landlord address', path: 'previousResidence.landlordAddress' },
      { label: 'Landlord phone', path: 'previousResidence.landlordPhone' },
    ],
  },
  {
    title: 'Employment and income',
    fields: [
      { label: 'Employer', path: 'employment.employer' },
      { label: 'Address', path: 'employment.address' },
      { label: 'Phone', path: 'employment.phone' },
      { label: 'Occupation', path: 'employment.occupation' },
      { label: 'Type of business', path: 'employment.businessType' },
      { label: 'Gross monthly income', path: 'employment.grossMonthlyIncome' },
      { label: 'Length of employment', path: 'employment.lengthOfEmployment' },
      { label: 'Supervisor', path: 'employment.supervisor' },
      { label: 'Has previous employment', path: 'hasPreviousEmployment' },
      { label: 'Previous employer', path: 'previousEmployment.employer' },
      { label: 'Previous employer address', path: 'previousEmployment.address' },
      { label: 'Previous employer phone', path: 'previousEmployment.phone' },
      { label: 'Previous occupation', path: 'previousEmployment.occupation' },
      { label: 'Length of previous employment', path: 'previousEmployment.lengthOfEmployment' },
    ],
  },
  {
    title: 'Other income',
    repeat: 'otherIncome',
    fields: [
      { label: 'Source', path: 'otherIncome[].source' },
      { label: 'Monthly amount', path: 'otherIncome[].monthlyAmount' },
    ],
  },
  {
    title: 'References',
    fields: [
      { label: 'Personal reference', path: 'personalReference.name' },
      { label: 'Relationship', path: 'personalReference.relationship' },
      { label: 'Address', path: 'personalReference.address' },
      { label: 'Phone', path: 'personalReference.phone' },
      { label: 'Credit reference', path: 'creditReference.name' },
      { label: 'Credit reference address', path: 'creditReference.address' },
      { label: 'Credit reference phone', path: 'creditReference.phone' },
    ],
  },
  {
    title: 'Emergency contact',
    fields: [
      { label: 'Name', path: 'emergencyContact.name' },
      { label: 'Relationship', path: 'emergencyContact.relationship' },
      { label: 'Address', path: 'emergencyContact.address' },
      { label: 'Phone', path: 'emergencyContact.phone' },
    ],
  },
  {
    title: 'Household',
    fields: [
      { label: 'Total occupants', path: 'household.totalOccupants' },
      { label: 'Adults', path: 'household.adults' },
    ],
  },
  {
    title: 'Co-tenants',
    repeat: 'household.coTenants',
    fields: [
      { label: 'Name', path: 'household.coTenants[].name' },
      { label: 'Email', path: 'household.coTenants[].email' },
    ],
  },
  {
    title: 'Children',
    repeat: 'household.minorChildren',
    fields: [
      { label: 'Name', path: 'household.minorChildren[].name' },
      { label: 'Age', path: 'household.minorChildren[].age' },
    ],
  },
  {
    title: 'Pets',
    repeat: 'household.pets',
    fields: [
      { label: 'Type', path: 'household.pets[].type' },
      { label: 'Breed', path: 'household.pets[].breed' },
      { label: 'Weight', path: 'household.pets[].weight' },
    ],
  },
  {
    title: 'Vehicle',
    fields: [
      { label: 'Make', path: 'vehicle.make' },
      { label: 'Model', path: 'vehicle.model' },
      { label: 'Year', path: 'vehicle.year' },
      { label: 'Plate', path: 'vehicle.plate' },
      { label: 'Plate state', path: 'vehicle.plateState' },
    ],
  },
  {
    title: 'The unit applied for',
    fields: [
      { label: 'Property', path: 'tenancy.propertyAddress' },
      { label: 'Unit', path: 'tenancy.unit' },
      { label: 'Desired move-in', path: 'tenancy.desiredOccupancyDate' },
      { label: 'Lease term (months)', path: 'tenancy.leaseTermMonths' },
      { label: 'Base rent', path: 'tenancy.baseRent' },
      { label: 'Other monthly charges', path: 'tenancy.otherMonthlyCharges' },
    ],
  },
  {
    title: 'Authorization and signature',
    fields: [
      { label: 'Credit check authorized', path: 'consents.creditAuthorization' },
      { label: 'Answers certified accurate', path: 'consents.certification' },
      { label: 'Signature', path: 'consents.signature' },
      { label: 'Signed on', path: 'consents.signatureDate' },
    ],
  },
];

/** Dotted-path read, with `[]` meaning "the element at `index`". */
const readPath = (data: unknown, path: string, index = 0): unknown => {
  let cursor: unknown = data;
  for (const part of path.split('.')) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    const arrayed = part.endsWith('[]');
    const key = arrayed ? part.slice(0, -2) : part;
    cursor = (cursor as Record<string, unknown>)[key];
    if (arrayed) {
      if (!Array.isArray(cursor)) return undefined;
      cursor = cursor[index];
    }
  }
  return cursor;
};

/** Every dotted path this module knows how to print, for the drift check. */
export const pdfCoveredPaths = (): string[] =>
  PDF_FIELDS.flatMap((g) => g.fields.map((f) => f.path));

/**
 * Every leaf of a document, as dotted paths. Arrays become `name[]` plus their
 * element's own leaves, which is the shape `PDF_FIELDS` uses.
 */
export const documentLeafPaths = (value: unknown, prefix = ''): string[] => {
  if (Array.isArray(value)) return [`${prefix}[]`];
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      documentLeafPaths(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [prefix];
};

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value).trim();
};

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const PAGE = { w: 612, h: 792 }; // US Letter, in points
const MARGIN = 48;
const LINE = 13;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Break a string to fit a width, by words, falling back to hard breaks. */
const wrap = (
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number
): string[] => {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) out.push(line);
      // A single word longer than the column — an email or a URL.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        let cut = rest.length;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut -= 1;
        out.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    out.push(line);
  }
  return out;
};

export interface PdfInput {
  record: RentalApplicationRecord;
  documents: RentalDocumentRecord[];
  /** Injected so this is testable without a browser or a live bucket. */
  fetchBytes?: (doc: RentalDocumentRecord) => Promise<ArrayBuffer>;
  /** Converts an image pdf-lib cannot embed (WEBP, HEIC) into PNG bytes. */
  toPng?: (bytes: ArrayBuffer, mime: string) => Promise<ArrayBuffer | null>;
}

const KIND_TITLE = new Map<DocumentKind, string>(DOCUMENT_KINDS.map((k) => [k.id, k.title]));

/** Fetches one document's bytes through a short-lived signed URL. */
const defaultFetchBytes = async (doc: RentalDocumentRecord): Promise<ArrayBuffer> => {
  const url = await documentUrl(doc);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${doc.fileName}: ${res.status}`);
  return res.arrayBuffer();
};

/**
 * WEBP and HEIC through a canvas, because pdf-lib embeds only PNG and JPEG.
 * Returns null when the browser cannot decode it either — Chrome cannot read
 * HEIC, and a page saying so is better than a silently missing document.
 */
const defaultToPng = async (bytes: ArrayBuffer, mime: string): Promise<ArrayBuffer | null> => {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? await blob.arrayBuffer() : null;
  } catch {
    return null;
  }
};

export const buildApplicationPdf = async ({
  record,
  documents,
  fetchBytes = defaultFetchBytes,
  toPng = defaultToPng,
}: PdfInput): Promise<Uint8Array> => {
  // Dynamic, so pdf-lib is not in the bundle every page downloads — it is only
  // fetched when somebody actually asks for a PDF.
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.42, 0.42, 0.42);
  const rule = rgb(0.85, 0.85, 0.85);

  const applicant =
    `${record.data.applicant.firstName} ${record.data.applicant.lastName}`.trim() ||
    record.applicantEmail ||
    'Rental application';
  const property = formatTenancyAddress(record.data.tenancy);

  pdf.setTitle(`Rental application — ${applicant}`);
  pdf.setAuthor(SITE.name);
  pdf.setSubject(property || 'Rental application');
  pdf.setCreationDate(new Date());

  let page = pdf.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - MARGIN;
  const width = PAGE.w - MARGIN * 2;

  const newPage = () => {
    page = pdf.addPage([PAGE.w, PAGE.h]);
    y = PAGE.h - MARGIN;
  };
  const need = (space: number) => {
    if (y - space < MARGIN) newPage();
  };

  const text = (
    value: string,
    { size = 9.5, font = body, color = ink, indent = 0, gap = LINE } = {}
  ) => {
    for (const line of wrap(value, font, size, width - indent)) {
      need(gap);
      page.drawText(line, { x: MARGIN + indent, y: y - size, size, font, color });
      y -= gap;
    }
  };

  /* ---- Letterhead -------------------------------------------------- */
  page.drawText(SITE.name.toUpperCase(), { x: MARGIN, y: y - 11, size: 11, font: bold, color: ink });
  y -= 16;
  page.drawText(`${SITE.phone}  ·  ${SITE.email}`, {
    x: MARGIN,
    y: y - 8,
    size: 8,
    font: body,
    color: grey,
  });
  y -= 18;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE.w - MARGIN, y },
    thickness: 0.7,
    color: rule,
  });
  y -= 20;

  text('RENTAL APPLICATION', { size: 15, font: bold });
  y -= 2;
  text(applicant, { size: 11, font: bold });
  if (property) text(property, { size: 9.5, color: grey });
  text(
    [
      `Status: ${STATUS_LABEL[record.status]}`,
      record.submittedAt ? `Sent ${shortDate(record.submittedAt)}` : null,
      `Printed ${shortDate(new Date().toISOString())}`,
    ]
      .filter(Boolean)
      .join('   ·   '),
    { size: 8, color: grey }
  );
  y -= 8;

  /* ---- The answers ------------------------------------------------- */
  const heading = (title: string) => {
    need(LINE * 3);
    y -= 8;
    page.drawText(title.toUpperCase(), { x: MARGIN, y: y - 9, size: 9, font: bold, color: ink });
    y -= 13;
    page.drawLine({
      start: { x: MARGIN, y: y + 2 },
      end: { x: PAGE.w - MARGIN, y: y + 2 },
      thickness: 0.5,
      color: rule,
    });
    y -= 6;
  };

  const row = (label: string, value: string) => {
    const labelWidth = 150;
    const lines = wrap(value, body, 9.5, width - labelWidth);
    need(LINE * lines.length);
    page.drawText(label, { x: MARGIN, y: y - 9.5, size: 9, font: body, color: grey });
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: MARGIN + labelWidth,
        y: y - 9.5 - i * LINE,
        size: 9.5,
        font: body,
        color: ink,
      });
    });
    y -= LINE * lines.length;
  };

  const data: RentalApplicationData = record.data;
  let printedAnything = false;

  for (const group of PDF_FIELDS) {
    if (group.repeat) {
      const list = readPath(data, group.repeat);
      const entries = Array.isArray(list) ? list : [];
      const filled = entries.filter((_, i) =>
        group.fields.some((f) => asText(readPath(data, f.path, i)) !== '')
      );
      if (filled.length === 0) continue;
      heading(group.title);
      printedAnything = true;
      entries.forEach((_, i) => {
        const values = group.fields
          .map((f) => ({ label: f.label, value: asText(readPath(data, f.path, i)) }))
          .filter((v) => v.value !== '');
        if (values.length === 0) return;
        for (const v of values) row(v.label, v.value);
        y -= 4;
      });
      continue;
    }

    const values = group.fields
      .map((f) => ({ label: f.label, value: asText(readPath(data, f.path)) }))
      // A boolean "No" on an optional block is noise; a "Yes" is information.
      .filter((v) => v.value !== '' && v.value !== 'No');
    if (values.length === 0) continue;
    heading(group.title);
    printedAnything = true;
    for (const v of values) row(v.label, v.value);
  }

  if (!printedAnything) {
    // Honest rather than an empty page: this is the applicant who answered
    // nothing and uploaded a completed form instead, which is a supported path.
    heading('The form');
    text('No questions were answered. See the attached documents.', { color: grey });
  }

  /* ---- The documents ----------------------------------------------- */
  if (documents.length === 0) return pdf.save();

  newPage();
  text('DOCUMENTS', { size: 15, font: bold });
  text(
    `${documents.length} ${documents.length === 1 ? 'file' : 'files'} uploaded by the applicant. Each follows in full.`,
    { size: 9.5, color: grey }
  );
  y -= 6;
  for (const doc of documents) {
    row(KIND_TITLE.get(doc.kind) ?? doc.kind, `${doc.fileName}${doc.label ? ` — ${doc.label}` : ''}`);
  }

  for (const doc of documents) {
    const title = `${KIND_TITLE.get(doc.kind) ?? doc.kind} — ${doc.fileName}`;
    let bytes: ArrayBuffer | null = null;
    try {
      bytes = await fetchBytes(doc);
    } catch (err) {
      console.error('Could not download a document for the PDF:', err);
    }

    if (!bytes) {
      newPage();
      text(title, { size: 11, font: bold });
      text('This file could not be downloaded. Open it from the application instead.', {
        color: grey,
      });
      continue;
    }

    if (doc.mimeType === 'application/pdf') {
      try {
        const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await pdf.copyPages(donor, donor.getPageIndices());
        // A separator page would double the length of a twelve-page tax return
        // for no gain; the label goes at the top of the first copied page.
        pages.forEach((p, i) => {
          pdf.addPage(p);
          if (i === 0) {
            p.drawText(title, {
              x: 12,
              y: p.getHeight() - 12,
              size: 7,
              font: bold,
              color: grey,
            });
          }
        });
      } catch (err) {
        console.error('Could not append a PDF:', err);
        newPage();
        text(title, { size: 11, font: bold });
        text('This PDF could not be merged — it may be password protected.', { color: grey });
      }
      continue;
    }

    // An image.
    let imageBytes: ArrayBuffer | null = bytes;
    let mime = doc.mimeType;
    if (mime !== 'image/png' && mime !== 'image/jpeg') {
      imageBytes = await toPng(bytes, mime);
      mime = 'image/png';
    }
    if (!imageBytes) {
      newPage();
      text(title, { size: 11, font: bold });
      text(
        'This image format could not be converted for the PDF. Open it from the application instead.',
        { color: grey }
      );
      continue;
    }

    try {
      const image =
        mime === 'image/jpeg' ? await pdf.embedJpg(imageBytes) : await pdf.embedPng(imageBytes);
      const p = pdf.addPage([PAGE.w, PAGE.h]);
      p.drawText(title, { x: 12, y: PAGE.h - 12, size: 7, font: bold, color: grey });
      const maxW = PAGE.w - MARGIN * 2;
      const maxH = PAGE.h - MARGIN * 2 - 10;
      // Contain, never crop: a driving licence with its edges cut off is not a
      // copy of a driving licence.
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const w = image.width * scale;
      const h = image.height * scale;
      p.drawImage(image, { x: (PAGE.w - w) / 2, y: (PAGE.h - h) / 2 - 5, width: w, height: h });
    } catch (err) {
      console.error('Could not embed an image:', err);
      newPage();
      text(title, { size: 11, font: bold });
      text('This image could not be added to the PDF.', { color: grey });
    }
  }

  return pdf.save();
};

/** `<applicant>-rental-application.pdf`, safe for a filesystem. */
export const pdfFileName = (record: RentalApplicationRecord): string => {
  const name = `${record.data.applicant.firstName} ${record.data.applicant.lastName}`.trim();
  const slug = (name || 'rental-application')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-rental-application.pdf`;
};
