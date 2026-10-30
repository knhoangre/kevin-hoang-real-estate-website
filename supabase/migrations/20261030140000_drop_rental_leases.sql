-- The site no longer makes leases (Kevin, 2026-10-30).
--
-- "New lease" on a property's page in /admin/applications now opens Kevin's
-- paperwork app, which makes the GBREB lease packet from the chosen
-- applications itself — reading them from this project under its own key — and
-- keeps the lease on his Mac, where it is filled in and sent for signature.
-- Nothing on the site reads or writes rental_leases any more.
--
-- It held no rows when this was written (counted 2026-10-30), so nothing is
-- lost. 20261030120000_rental_leases stays in the history; the trigger and the
-- policy go with the table.

DROP TABLE IF EXISTS public.rental_leases;
DROP FUNCTION IF EXISTS public.touch_rental_lease();
