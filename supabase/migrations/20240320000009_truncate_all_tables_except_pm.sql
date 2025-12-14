-- Truncate all tables except those starting with 'pm_'
-- This script will delete all data from user tables while preserving table structure
-- WARNING: This will permanently delete all data from the specified tables!

-- Dynamic script to truncate all tables except those starting with 'pm_'
DO $$
DECLARE
    r RECORD;
    table_list TEXT := '';
BEGIN
    -- Find all tables in the public schema that don't start with 'pm_'
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pm_%'
        AND tablename NOT LIKE 'supabase_%'
        AND tablename NOT LIKE 'storage%'
        AND tablename NOT LIKE 'realtime%'
        AND tablename NOT LIKE 'graphql%'
        AND tablename NOT LIKE 'pgsodium%'
        AND tablename NOT LIKE 'vault%'
        AND tablename NOT LIKE 'extensions%'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'information_schema%'
        ORDER BY tablename
    LOOP
        -- Build comma-separated list of tables
        IF table_list != '' THEN
            table_list := table_list || ', ';
        END IF;
        table_list := table_list || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
    
    -- Truncate all tables at once with CASCADE to handle foreign keys
    IF table_list != '' THEN
        EXECUTE 'TRUNCATE TABLE ' || table_list || ' CASCADE';
        RAISE NOTICE 'Truncated tables: %', table_list;
    ELSE
        RAISE NOTICE 'No tables found to truncate (excluding pm_* tables)';
    END IF;
END $$;

