-- The property-management tables, removed at Kevin's request (2026-10-29).
--
-- They were the start of a separate app for managing rentals and their
-- finances, which Kevin stopped. No migration ever created them (they were made
-- in the dashboard) and nothing in this site reads or writes them. Until
-- 20261028100000 they were readable and writable with the public key — pm_users
-- has a password_hash column and pm_owners a tax_id — so the safest copy of
-- that data is none.
--
-- One statement, no CASCADE: the only things that depend on these tables are
-- each other (their foreign keys, indexes and id sequences, all checked
-- against a dump of the live schema), and without CASCADE anything else that
-- did would make this fail rather than be dropped along with them.

DROP TABLE IF EXISTS
  public.pm_activities,
  public.pm_documents,
  public.pm_expenses,
  public.pm_maintenance,
  public.pm_payments,
  public.pm_tenants,
  public.pm_properties,
  public.pm_owners,
  public.pm_users;
