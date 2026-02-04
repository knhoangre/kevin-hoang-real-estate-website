-- Ensure commission and house_price columns exist in deals table
-- This migration is idempotent and safe to run multiple times

-- Add house_price if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'house_price'
  ) THEN
    ALTER TABLE deals ADD COLUMN house_price DECIMAL(12, 2);
  END IF;
END $$;

-- Add commission if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'commission'
  ) THEN
    ALTER TABLE deals ADD COLUMN commission DECIMAL(12, 2);
  END IF;
END $$;
