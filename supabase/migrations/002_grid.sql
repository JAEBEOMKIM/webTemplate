-- =============================================
-- Grid Layout Support for Page Components
-- =============================================

-- Add grid position/size columns to page_components
ALTER TABLE page_components
  ADD COLUMN IF NOT EXISTS grid_x INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grid_y INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grid_w INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS grid_h INT NOT NULL DEFAULT 6;

-- =============================================
-- Supabase Storage: gallery-images bucket
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-images',
  'gallery-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Gallery images are publicly viewable" ON storage.objects;
CREATE POLICY "Gallery images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their gallery images" ON storage.objects;
CREATE POLICY "Users can delete their gallery images" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery-images' AND auth.uid() IS NOT NULL);
