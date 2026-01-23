-- Create storage bucket for reply attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reply-attachments',
  'reply-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for reply-attachments bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload reply attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reply-attachments');

-- Allow public read access to attachments
CREATE POLICY "Public can view reply attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reply-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own reply attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reply-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
