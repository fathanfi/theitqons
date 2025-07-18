-- Fix storage bucket policies for payment-proofs
-- This migration ensures authenticated users can upload payment proof images

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the itqonbucket if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment proofs" ON storage.objects;

-- Create policies for payment-proofs folder
CREATE POLICY "Allow authenticated users to upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'itqonbucket' AND 
    (storage.foldername(name))[1] = 'payment-proofs'
  );

CREATE POLICY "Allow authenticated users to read payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'itqonbucket' AND 
    (storage.foldername(name))[1] = 'payment-proofs'
  );

CREATE POLICY "Allow authenticated users to update payment proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'itqonbucket' AND 
    (storage.foldername(name))[1] = 'payment-proofs'
  )
  WITH CHECK (
    bucket_id = 'itqonbucket' AND 
    (storage.foldername(name))[1] = 'payment-proofs'
  );

CREATE POLICY "Allow authenticated users to delete payment proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'itqonbucket' AND 
    (storage.foldername(name))[1] = 'payment-proofs'
  );

-- Also create general policies for the itqonbucket if they don't exist
DROP POLICY IF EXISTS "Allow authenticated users to upload to itqonbucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read from itqonbucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update itqonbucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from itqonbucket" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload to itqonbucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'itqonbucket');

CREATE POLICY "Allow authenticated users to read from itqonbucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'itqonbucket');

CREATE POLICY "Allow authenticated users to update itqonbucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'itqonbucket')
  WITH CHECK (bucket_id = 'itqonbucket');

CREATE POLICY "Allow authenticated users to delete from itqonbucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'itqonbucket');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 