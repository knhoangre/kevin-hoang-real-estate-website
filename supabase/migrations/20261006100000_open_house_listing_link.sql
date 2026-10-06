-- Which listing an open-house sign-in was AT.
--
-- `address` is free text typed on a tablet at the door, and until now it was the
-- only thing a sign-in knew about the house. That was enough to group sign-ins
-- in Follow Up, and not enough to do the one thing a guest wants afterwards:
-- look the home up again. They did that on Zillow or Redfin, because the email
-- they were sent named the address and linked to nothing.
--
-- The kiosk now looks the address up in the IDX feed, and this records the match
-- so the confirmation email can link to /search/<mls> on this site.
--
-- NULLABLE, AND NO FOREIGN KEY, both on purpose:
--
--   * Nullable because a house that is not in the feed — an exclusive, an
--     off-market preview, a listing entered that morning — is still typed by
--     hand, exactly as before. Every existing row is one of those.
--
--   * No foreign key to idx_listings because that table is a CACHE of the feed:
--     idx-sync deletes a listing the moment MLS PIN stops sending it. A foreign
--     key would either block that delete, which is a compliance problem, or
--     cascade it into a sign-in, which would erase the record of a lead because
--     a house sold. The number is kept as a fact about the day; whether it still
--     resolves is the listing page's business.

ALTER TABLE open_house_sign_ins
  ADD COLUMN IF NOT EXISTS mls_number TEXT;
