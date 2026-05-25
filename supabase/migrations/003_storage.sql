-- Run this in Supabase Dashboard → SQL Editor (requires superuser)
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "auth_download" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "auth_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);
