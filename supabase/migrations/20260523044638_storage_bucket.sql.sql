-- ============================================
-- Migración 003: Storage bucket + políticas
-- ============================================

-- Crear bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Política: lectura pública sin restricciones
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Política: solo admin puede subir/eliminar
CREATE POLICY "product_images_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );
