import { createContext } from 'react';

/**
 * Each section's number, by id — `sectionNumbers(form)`, provided once by
 * RentalApplicationForm and read by every `Section` heading. A context rather
 * than a prop on every section so a number cannot be typed by hand in one
 * place and drift from the index beside it: both read the same map. Outside
 * the form a section has no number.
 *
 * Its own file because react-refresh wants fields.tsx to export only
 * components.
 */
export const SectionNumbers = createContext<Record<string, number>>({});
