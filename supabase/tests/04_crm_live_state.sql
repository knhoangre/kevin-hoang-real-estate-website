-- The LIVE state of the CRM, sign-in and property-management tables, before
-- 20261028100000_close_public_crm_reads: tables, views, which tables had RLS on,
-- and every policy, copied from `supabase db dump --linked --schema public` on
-- 2026-10-28. Not from the migrations, because the live database had drifted
-- from them: policies no migration creates ("Allow all operations ... TO anon"),
-- RLS off on contact_sources and all nine pm_* tables. A test of the fix against
-- the migrations' version of these tables would pass on a database that does
-- not exist. Column defaults that name sequences are dropped (the seed gives
-- ids), and so are foreign keys; primary keys are kept.
--
-- Applied to its own database (crm_privacy) after 01_auth_bootstrap.sql, with
-- Supabase's default privileges, which grant every new table to anon.

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS "public"."contact_first_names" (
    "id" integer NOT NULL,
    "first_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "public"."contact_last_names" (
    "id" integer NOT NULL,
    "last_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "public"."contact_emails" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "is_verified" boolean DEFAULT false,
    "verification_token" "text",
    "verification_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    CONSTRAINT "valid_email" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);

CREATE TABLE IF NOT EXISTS "public"."contact_phones" (
    "id" integer NOT NULL,
    "phone" "text" NOT NULL,
    "is_verified" boolean DEFAULT false,
    "verification_token" "text",
    "verification_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    CONSTRAINT "valid_phone" CHECK (("phone" ~* '^\d{3}[-]?\d{3}[-]?\d{4}$'::"text"))
);

CREATE TABLE IF NOT EXISTS "public"."contact_sources" (
    "id" integer NOT NULL,
    "source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" integer NOT NULL,
    "first_name_id" integer,
    "last_name_id" integer,
    "email_id" integer,
    "phone_id" integer,
    "source_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" integer NOT NULL,
    "first_name_id" integer,
    "last_name_id" integer,
    "email_id" integer,
    "phone_id" integer,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "source_id" integer
);

CREATE TABLE IF NOT EXISTS "public"."contact_addresses" (
    "id" integer NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text" DEFAULT 'USA'::"text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" integer
);

CREATE TABLE IF NOT EXISTS "public"."contact_birthdays" (
    "id" integer NOT NULL,
    "birthday" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" integer
);

CREATE TABLE IF NOT EXISTS "public"."contact_home_anniversaries" (
    "id" integer NOT NULL,
    "home_anniversary" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" integer
);

CREATE TABLE IF NOT EXISTS "public"."contact_tags" (
    "id" integer NOT NULL,
    "tag" "text" NOT NULL,
    "color" "text" DEFAULT '#9b87f5'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."contact_tag_assignments" (
    "id" integer NOT NULL,
    "tag_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" integer
);

CREATE TABLE IF NOT EXISTS "public"."open_house_sign_ins" (
    "id" integer NOT NULL,
    "address" "text" NOT NULL,
    "first_name_id" integer,
    "last_name_id" integer,
    "email_id" integer,
    "phone_id" integer,
    "source_id" integer,
    "works_with_realtor" boolean DEFAULT false,
    "realtor_name" "text",
    "realtor_company" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "mls_number" "text"
);

CREATE TABLE IF NOT EXISTS "public"."event_sign_ins" (
    "id" integer NOT NULL,
    "event_name" "text" NOT NULL,
    "first_name_id" integer,
    "last_name_id" integer,
    "email_id" integer,
    "phone_id" integer,
    "source_id" integer,
    "is_active" boolean DEFAULT true,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."pm_activities" (
    "id" integer NOT NULL,
    "user_id" integer,
    "activity_type" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "related_table" character varying(50),
    "related_id" integer,
    "amount" numeric(10,2),
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."pm_documents" (
    "id" integer NOT NULL,
    "property_id" integer,
    "tenant_id" integer,
    "document_type" character varying(50) NOT NULL,
    "title" character varying(200) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" character varying(500) NOT NULL,
    "file_size" integer,
    "mime_type" character varying(100),
    "uploaded_by" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."pm_expenses" (
    "id" integer NOT NULL,
    "property_id" integer,
    "category" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "expense_date" "date" NOT NULL,
    "vendor" character varying(100),
    "invoice_number" character varying(100),
    "payment_method" character varying(50),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pm_expenses_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pm_maintenance" (
    "id" integer NOT NULL,
    "property_id" integer,
    "tenant_id" integer,
    "title" character varying(200) NOT NULL,
    "description" "text" NOT NULL,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "status" character varying(20) DEFAULT 'open'::character varying,
    "reported_date" "date" NOT NULL,
    "completed_date" "date",
    "estimated_cost" numeric(10,2),
    "actual_cost" numeric(10,2),
    "assigned_to" character varying(100),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pm_maintenance_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "pm_maintenance_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pm_owners" (
    "id" integer NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "email" character varying(100) NOT NULL,
    "phone" character varying(20),
    "address" "text",
    "tax_id" character varying(20),
    "commission_rate" numeric(5,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."pm_payments" (
    "id" integer NOT NULL,
    "property_id" integer,
    "tenant_id" integer,
    "payment_type" character varying(20) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_date" "date" NOT NULL,
    "due_date" "date",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "payment_method" character varying(50),
    "reference_number" character varying(100),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pm_payments_payment_type_check" CHECK ((("payment_type")::"text" = ANY ((ARRAY['rent'::character varying, 'deposit'::character varying, 'fee'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "pm_payments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'late'::character varying, 'cancelled'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pm_properties" (
    "id" integer NOT NULL,
    "owner_id" integer,
    "address" "text" NOT NULL,
    "city" character varying(100) NOT NULL,
    "state" character varying(2) NOT NULL,
    "zip_code" character varying(10) NOT NULL,
    "property_type" character varying(50) NOT NULL,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "square_feet" integer,
    "monthly_rent" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'vacant'::character varying,
    "description" "text",
    "amenities" "text"[],
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pm_properties_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['occupied'::character varying, 'vacant'::character varying, 'maintenance'::character varying, 'available'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pm_tenants" (
    "id" integer NOT NULL,
    "property_id" integer,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "email" character varying(100) NOT NULL,
    "phone" character varying(20),
    "emergency_contact_name" character varying(100),
    "emergency_contact_phone" character varying(20),
    "lease_start_date" "date",
    "lease_end_date" "date",
    "monthly_rent" numeric(10,2) NOT NULL,
    "security_deposit" numeric(10,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pm_tenants_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'evicted'::character varying])::"text"[])))
);

CREATE TABLE IF NOT EXISTS "public"."pm_users" (
    "id" integer NOT NULL,
    "username" character varying(50) NOT NULL,
    "email" character varying(100) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "role" character varying(20) DEFAULT 'user'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "public"."contact_first_names"
    ADD CONSTRAINT "contact_first_names_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_last_names"
    ADD CONSTRAINT "contact_last_names_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_emails"
    ADD CONSTRAINT "contact_emails_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_phones"
    ADD CONSTRAINT "contact_phones_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_sources"
    ADD CONSTRAINT "contact_sources_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_addresses"
    ADD CONSTRAINT "contact_addresses_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_birthdays"
    ADD CONSTRAINT "contact_birthdays_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_home_anniversaries"
    ADD CONSTRAINT "contact_home_anniversaries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_tags"
    ADD CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contact_tag_assignments"
    ADD CONSTRAINT "contact_tag_assignments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."open_house_sign_ins"
    ADD CONSTRAINT "open_house_sign_ins_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."event_sign_ins"
    ADD CONSTRAINT "event_sign_ins_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_activities"
    ADD CONSTRAINT "pm_activities_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_documents"
    ADD CONSTRAINT "pm_documents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_expenses"
    ADD CONSTRAINT "pm_expenses_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_maintenance"
    ADD CONSTRAINT "pm_maintenance_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_owners"
    ADD CONSTRAINT "pm_owners_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_payments"
    ADD CONSTRAINT "pm_payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_properties"
    ADD CONSTRAINT "pm_properties_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_tenants"
    ADD CONSTRAINT "pm_tenants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pm_users"
    ADD CONSTRAINT "pm_users_pkey" PRIMARY KEY ("id");

CREATE OR REPLACE VIEW "public"."admin_contact_messages_view" AS
 SELECT "cm"."id",
    "cf"."first_name",
    "cl"."last_name",
    "ce"."email",
    "cp"."phone",
    "cm"."message",
    "cm"."is_read",
    "cm"."read_at",
    "cm"."created_at",
    "cm"."updated_at",
    "ce"."is_verified" AS "email_verified",
    "cp"."is_verified" AS "phone_verified"
   FROM (((("public"."contact_messages" "cm"
     LEFT JOIN "public"."contact_first_names" "cf" ON (("cm"."first_name_id" = "cf"."id")))
     LEFT JOIN "public"."contact_last_names" "cl" ON (("cm"."last_name_id" = "cl"."id")))
     LEFT JOIN "public"."contact_emails" "ce" ON (("cm"."email_id" = "ce"."id")))
     LEFT JOIN "public"."contact_phones" "cp" ON (("cm"."phone_id" = "cp"."id")))
  WHERE ("cm"."is_active" = true);

CREATE OR REPLACE VIEW "public"."contact_messages_view" AS
 SELECT "cm"."id",
    "cf"."first_name",
    "cl"."last_name",
    "ce"."email",
    "cp"."phone",
    "cm"."message",
    "cm"."is_read",
    "cm"."read_at",
    "cm"."created_at",
    "cs"."source"
   FROM ((((("public"."contact_messages" "cm"
     LEFT JOIN "public"."contact_first_names" "cf" ON (("cm"."first_name_id" = "cf"."id")))
     LEFT JOIN "public"."contact_last_names" "cl" ON (("cm"."last_name_id" = "cl"."id")))
     LEFT JOIN "public"."contact_emails" "ce" ON (("cm"."email_id" = "ce"."id")))
     LEFT JOIN "public"."contact_phones" "cp" ON (("cm"."phone_id" = "cp"."id")))
     LEFT JOIN "public"."contact_sources" "cs" ON (("cm"."source_id" = "cs"."id")))
  WHERE ("cm"."is_active" = true);

CREATE OR REPLACE VIEW "public"."contacts_view" AS
 SELECT "c"."id" AS "contact_id",
    "cf"."first_name",
    "cl"."last_name",
    "ce"."email",
    "cp"."phone",
    "cs"."source",
    "cb"."birthday",
    "cha"."home_anniversary",
    "c"."created_at" AS "last_contact_at",
    "c"."updated_at",
    COALESCE("json_agg"(DISTINCT "jsonb_build_object"('id', "ca"."id", 'address_line1', "ca"."address_line1", 'address_line2', "ca"."address_line2", 'city', "ca"."city", 'state', "ca"."state", 'zip_code', "ca"."zip_code", 'country', "ca"."country", 'is_primary', "ca"."is_primary")) FILTER (WHERE ("ca"."id" IS NOT NULL)), '[]'::"json") AS "addresses",
    COALESCE("json_agg"(DISTINCT "jsonb_build_object"('id', "ct"."id", 'tag', "ct"."tag", 'color', "ct"."color")) FILTER (WHERE ("ct"."id" IS NOT NULL)), '[]'::"json") AS "tags",
    ( SELECT "count"(*) AS "count"
           FROM "public"."contact_messages" "cm"
          WHERE (("cm"."email_id" = "c"."email_id") OR ("cm"."phone_id" = "c"."phone_id"))) AS "message_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."open_house_sign_ins" "ohs"
          WHERE (("ohs"."email_id" = "c"."email_id") OR ("ohs"."phone_id" = "c"."phone_id"))) AS "open_house_count"
   FROM (((((((((("public"."contacts" "c"
     LEFT JOIN "public"."contact_first_names" "cf" ON (("c"."first_name_id" = "cf"."id")))
     LEFT JOIN "public"."contact_last_names" "cl" ON (("c"."last_name_id" = "cl"."id")))
     LEFT JOIN "public"."contact_emails" "ce" ON (("c"."email_id" = "ce"."id")))
     LEFT JOIN "public"."contact_phones" "cp" ON (("c"."phone_id" = "cp"."id")))
     LEFT JOIN "public"."contact_sources" "cs" ON (("c"."source_id" = "cs"."id")))
     LEFT JOIN "public"."contact_birthdays" "cb" ON (("c"."id" = "cb"."contact_id")))
     LEFT JOIN "public"."contact_home_anniversaries" "cha" ON (("c"."id" = "cha"."contact_id")))
     LEFT JOIN "public"."contact_addresses" "ca" ON (("c"."id" = "ca"."contact_id")))
     LEFT JOIN "public"."contact_tag_assignments" "cta" ON (("c"."id" = "cta"."contact_id")))
     LEFT JOIN "public"."contact_tags" "ct" ON (("cta"."tag_id" = "ct"."id")))
  WHERE ("c"."is_active" = true)
  GROUP BY "c"."id", "cf"."first_name", "cl"."last_name", "ce"."email", "cp"."phone", "cs"."source", "cb"."birthday", "cha"."home_anniversary", "c"."created_at", "c"."updated_at";

ALTER TABLE "public"."contact_first_names" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_last_names" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_emails" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_phones" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_addresses" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_birthdays" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_home_anniversaries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_tags" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."contact_tag_assignments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."open_house_sign_ins" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_sign_ins" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to insert contact_first_names" ON "public"."contact_first_names" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_first_names" ON "public"."contact_first_names" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_first_names" ON "public"."contact_first_names" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow all operations on contact_first_names" ON "public"."contact_first_names" TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to contact_first_names" ON "public"."contact_first_names" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_first_names" ON "public"."contact_first_names" FOR SELECT TO "anon" USING (true);

CREATE POLICY "Allow admins to insert contact_last_names" ON "public"."contact_last_names" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_last_names" ON "public"."contact_last_names" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_last_names" ON "public"."contact_last_names" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow all operations on contact_last_names" ON "public"."contact_last_names" TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to contact_last_names" ON "public"."contact_last_names" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_last_names" ON "public"."contact_last_names" FOR SELECT TO "anon" USING (true);

CREATE POLICY "Allow admins to insert contact_emails" ON "public"."contact_emails" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_emails" ON "public"."contact_emails" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_emails" ON "public"."contact_emails" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow all operations on contact_emails" ON "public"."contact_emails" TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to contact_emails" ON "public"."contact_emails" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_emails" ON "public"."contact_emails" FOR SELECT TO "anon" USING (true);

CREATE POLICY "Allow admins to insert contact_phones" ON "public"."contact_phones" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_phones" ON "public"."contact_phones" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_phones" ON "public"."contact_phones" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow all operations on contact_phones" ON "public"."contact_phones" TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to contact_phones" ON "public"."contact_phones" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_phones" ON "public"."contact_phones" FOR SELECT TO "anon" USING (true);

CREATE POLICY "Allow admins to insert contact_sources" ON "public"."contact_sources" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_sources" ON "public"."contact_sources" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to delete contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contacts" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contacts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contacts" ON "public"."contacts" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow anonymous inserts to contacts" ON "public"."contacts" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contacts" ON "public"."contacts" FOR SELECT TO "anon" USING (("is_active" = true));

CREATE POLICY "Allow admins to insert contact_messages" ON "public"."contact_messages" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_messages" ON "public"."contact_messages" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_messages" ON "public"."contact_messages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow all operations on contact_messages" ON "public"."contact_messages" TO "anon" USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to contact_messages" ON "public"."contact_messages" FOR INSERT TO "anon" WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_messages" ON "public"."contact_messages" FOR SELECT TO "anon" USING (true);

CREATE POLICY "Allow admins to delete contact_addresses" ON "public"."contact_addresses" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contact_addresses" ON "public"."contact_addresses" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_addresses" ON "public"."contact_addresses" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_addresses" ON "public"."contact_addresses" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to delete contact_birthdays" ON "public"."contact_birthdays" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contact_birthdays" ON "public"."contact_birthdays" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_birthdays" ON "public"."contact_birthdays" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_birthdays" ON "public"."contact_birthdays" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to delete contact_home_anniversaries" ON "public"."contact_home_anniversaries" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contact_home_anniversaries" ON "public"."contact_home_anniversaries" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_home_anniversaries" ON "public"."contact_home_anniversaries" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_home_anniversaries" ON "public"."contact_home_anniversaries" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to delete contact_tags" ON "public"."contact_tags" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contact_tags" ON "public"."contact_tags" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to update contact_tags" ON "public"."contact_tags" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_tags" ON "public"."contact_tags" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to delete contact_tag_assignments" ON "public"."contact_tag_assignments" FOR DELETE TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to insert contact_tag_assignments" ON "public"."contact_tag_assignments" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all contact_tag_assignments" ON "public"."contact_tag_assignments" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow admins to update open_house_sign_ins" ON "public"."open_house_sign_ins" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all open_house_sign_ins" ON "public"."open_house_sign_ins" FOR SELECT TO "authenticated" USING ("public"."is_admin"());

CREATE POLICY "Allow public insert on open_house_sign_ins" ON "public"."open_house_sign_ins" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);

CREATE POLICY "Allow public read distinct addresses from open_house_sign_ins" ON "public"."open_house_sign_ins" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));

CREATE POLICY "Allow service role to read active open_house_sign_ins" ON "public"."open_house_sign_ins" FOR SELECT TO "service_role" USING (("is_active" = true));

CREATE POLICY "Allow admins to update event_sign_ins" ON "public"."event_sign_ins" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE POLICY "Allow admins to view all event_sign_ins" ON "public"."event_sign_ins" FOR SELECT TO "authenticated" USING ("public"."is_admin"());
