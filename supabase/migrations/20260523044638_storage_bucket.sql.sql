-- ============================================
-- Migración 003: Storage bucket + políticas
-- ============================================

-- Crear bucket público para imágenes de productos (idempotente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: se crean solo si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'product_images_public_read'
  ) THEN
    CREATE POLICY "product_images_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'product_images_admin_write'
  ) THEN
    CREATE POLICY "product_images_admin_write"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'product-images'
        AND auth.jwt() ->> 'role' = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'product_images_admin_delete'
  ) THEN
    CREATE POLICY "product_images_admin_delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'product-images'
        AND auth.jwt() ->> 'role' = 'admin'
      );
  END IF;
END;
$$;
