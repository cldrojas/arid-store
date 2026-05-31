-- ============================================
-- Migración 005: Asignar rol admin
-- ============================================
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de crear el usuario admin desde
-- el Dashboard de Supabase Auth → Users, o mediante la API.
--
-- Reemplazar 'admin@tutienda.com' con el email real del admin.
--
-- ============================================

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'admin@tutienda.com';
