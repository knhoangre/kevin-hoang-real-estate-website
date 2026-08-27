import { SITE } from '@/lib/siteConfig';

export interface StripItem {
  term: string;
  value: string;
}

/**
 * The credential strip's four checkable facts, all sourced from siteConfig
 * rather than typed in.
 *
 * It lives here rather than in PageShell because a module that exports both a
 * component and a plain function loses Fast Refresh for the whole file.
 */
export const defaultStrip = (labels?: [string, string, string, string]): StripItem[] => [
  { term: labels?.[0] ?? 'Brokerage', value: SITE.brokerage },
  { term: labels?.[1] ?? 'Licensed', value: 'MA Broker' },
  { term: labels?.[2] ?? 'Towns covered', value: String(SITE.areaServed.length) },
  { term: labels?.[3] ?? 'Languages', value: 'English · Tiếng Việt' },
];
