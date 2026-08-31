-- Fields that make a per-listing page worth having.
--
-- /properties/<slug> renders one closing as its own document. Address, beds,
-- baths and square footage alone are specs — the same specs every aggregator
-- publishes about the same house — and ten pages of that is the thin,
-- templated shape this site's blog corpus was cleaned of once. These four
-- columns are what makes each page say something only this broker can say.
--
-- Every one of them is nullable on purpose. src/data/soldListings.ts and the
-- detail page omit whatever is absent rather than placeholding it, the same
-- discipline SITE.geo and SITE.hours follow: absent is correct, invented is
-- actively harmful.

ALTER TABLE properties
  -- Drives the visible "Sold March 2026" line and the sitemap lastmod for that
  -- page. A date, not a timestamp: nobody knows or cares what hour it recorded,
  -- and a timestamptz would render a different day either side of midnight UTC.
  ADD COLUMN IF NOT EXISTS sold_date DATE,

  -- Kevin's own prose about the property and the transaction. This is the
  -- reason the page exists.
  ADD COLUMN IF NOT EXISTS description TEXT,

  -- The asking price, so the page can state what the home closed at relative to
  -- what it was asked. /properties already argues in prose that this is the
  -- number that matters; this is what lets a page show it.
  ADD COLUMN IF NOT EXISTS list_price DECIMAL(12, 2),

  -- Which side was represented. "Represented the buyer" and "represented the
  -- seller" are materially different claims, and a page that shows a sale
  -- without saying which one implies the listing side. Left NULL, the page
  -- says nothing about representation at all.
  ADD COLUMN IF NOT EXISTS represented TEXT;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_represented_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_represented_check
  CHECK (represented IS NULL OR represented IN ('buyer', 'seller', 'both'));

-- Sorting the public list by recency of closing, once enough rows carry a date.
CREATE INDEX IF NOT EXISTS idx_properties_sold_date ON properties (sold_date);
