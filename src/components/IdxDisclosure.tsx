import { useEffect, useState } from 'react';
import { lastSyncedAt } from '@/lib/idxSearch';

/**
 * The attribution and freshness block every IDX display has to carry.
 *
 * This is a compliance element, not decoration. MLS PIN's IDX rules require a
 * display to identify the data source and to state how current it is, and the
 * per-listing pages additionally name the listing office (see SearchListing).
 *
 * !! THE EXACT WORDING BELOW IS NOT YET CONFIRMED against MLS PIN's Rules &
 * Regulations Attachment C, which is behind the h3o login. It says only what is
 * verifiably true — where the data comes from, that it may not be current, and
 * when this site last loaded it — and it invents no certification, trademark
 * form, or legal citation. Check it against Attachment C before launch and
 * replace this text with the required form of words if one is prescribed.
 *
 * The timestamp reads the last SUCCESSFUL sync, never the last attempt. A page
 * that claims freshness on the strength of a failed run is making exactly the
 * false statement the requirement exists to prevent — so if syncing has been
 * broken for three days, this says three days.
 */
const IdxDisclosure = ({ className = '' }: { className?: string }) => {
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    lastSyncedAt()
      .then((at) => {
        if (!cancelled) {
          setSyncedAt(at);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stamp = syncedAt
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(syncedAt))
    : null;

  return (
    <aside className={`border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-500 ${className}`}>
      <p>
        Listing data is provided by MLS Property Information Network, Inc.
        (MLS PIN) through its Internet Data Exchange programme, and is provided
        for consumers&rsquo; personal, non-commercial use. Listings held by
        brokerage firms other than Kevin Hoang / Keller Williams Realty are
        marked with the name of the listing office.
      </p>
      <p className="mt-2">
        Information is deemed reliable but is not guaranteed accurate, and is not
        a substitute for verifying a property in person and in writing. Listings
        may have sold or been withdrawn since this data was retrieved.
      </p>
      <p className="numeral mt-2">
        {/*
          Rendered only once the query has resolved, so the page never briefly
          claims data is current when it does not yet know.
        */}
        {!loaded
          ? 'Checking when listing data was last updated…'
          : stamp
            ? `Listing data last updated ${stamp}.`
            : 'Listing data update time is unavailable.'}
      </p>
    </aside>
  );
};

export default IdxDisclosure;
