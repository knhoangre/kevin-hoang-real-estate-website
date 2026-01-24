-- Remove photo_count column from properties table
-- This column is no longer needed as we're using image_urls array instead

ALTER TABLE properties 
DROP COLUMN IF EXISTS photo_count;
