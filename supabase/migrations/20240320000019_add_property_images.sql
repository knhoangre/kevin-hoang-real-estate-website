-- Add image_urls column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Storage policies for property-images bucket
-- Allow public read access to property images
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow authenticated admins to upload property images
DROP POLICY IF EXISTS "Admins can upload property images" ON storage.objects;
CREATE POLICY "Admins can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  public.is_admin()
);

-- Allow authenticated admins to update property images
DROP POLICY IF EXISTS "Admins can update property images" ON storage.objects;
CREATE POLICY "Admins can update property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  public.is_admin()
)
WITH CHECK (
  bucket_id = 'property-images' AND
  public.is_admin()
);

-- Allow authenticated admins to delete property images
DROP POLICY IF EXISTS "Admins can delete property images" ON storage.objects;
CREATE POLICY "Admins can delete property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  public.is_admin()
);
