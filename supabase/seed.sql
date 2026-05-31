-- ============================================
-- Seed Data: 3 productos de muestra
-- ============================================
-- Usa service_role key o ejecuta con `supabase db query`
-- después de tener el bucket product-images configurado.
-- ============================================

-- Producto 1: Polera Negra Minimal
INSERT INTO products (slug, name, description, base_price, is_active)
VALUES (
  'polera-negra-minimal',
  'Polera Negra Minimal',
  'Polera de algodón peinado 24/1 con estampado minimalista. Corte regular fit. Cuello redondo reforzado.',
  14990,
  true
);

-- Variantes Polera Negra Minimal
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku, price_override)
SELECT p.id, v.size, v.color, v.color_hex, v.stock, v.sku, v.price_override::int
FROM products p
CROSS JOIN (VALUES
  ('S', 'Negro', '#1a1a1a', 10, 'MN-NEG-S', NULL),
  ('M', 'Negro', '#1a1a1a', 25, 'MN-NEG-M', NULL),
  ('L', 'Negro', '#1a1a1a', 30, 'MN-NEG-L', NULL),
  ('XL', 'Negro', '#1a1a1a', 15, 'MN-NEG-XL', NULL),
  ('S', 'Blanco', '#ffffff', 8, 'MN-BLAN-S', NULL),
  ('M', 'Blanco', '#ffffff', 20, 'MN-BLAN-M', NULL),
  ('L', 'Blanco', '#ffffff', 22, 'MN-BLAN-L', NULL),
  ('XL', 'Blanco', '#ffffff', 12, 'MN-BLAN-XL', NULL)
) AS v(size, color, color_hex, stock, sku, price_override)
WHERE p.slug = 'polera-negra-minimal';

-- Producto 2: Polera Azul Aventura
INSERT INTO products (slug, name, description, base_price, is_active)
VALUES (
  'polera-azul-aventura',
  'Polera Azul Aventura',
  'Polera de algodón orgánico con diseño serigrafiado al agua. Ideal para el día a día. Tejido 30/1.',
  16990,
  true
);

-- Variantes Polera Azul Aventura
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku, price_override)
SELECT p.id, v.size, v.color, v.color_hex, v.stock, v.sku, v.price_override::int
FROM products p
CROSS JOIN (VALUES
  ('M', 'Azul Marino', '#1a2744', 18, 'AV-MAR-M', NULL),
  ('L', 'Azul Marino', '#1a2744', 24, 'AV-MAR-L', NULL),
  ('XL', 'Azul Marino', '#1a2744', 10, 'AV-MAR-XL', NULL),
  ('M', 'Gris', '#8a8a8a', 15, 'AV-GRIS-M', NULL),
  ('L', 'Gris', '#8a8a8a', 20, 'AV-GRIS-L', NULL),
  ('XL', 'Gris', '#8a8a8a', 8, 'AV-GRIS-XL', NULL)
) AS v(size, color, color_hex, stock, sku, price_override)
WHERE p.slug = 'polera-azul-aventura';

-- Producto 3: Polera Blanca Esencia (solo tallas L y XL)
INSERT INTO products (slug, name, description, base_price, is_active)
VALUES (
  'polera-blanca-esencia',
  'Polera Blanca Esencia',
  'Edición limitada con estampado foil dorado. Algodón premium 40/1. Corte moderno.',
  19990,
  true
);

-- Variantes Polera Blanca Esencia
INSERT INTO product_variants (product_id, size, color, color_hex, stock, sku, price_override)
SELECT p.id, v.size, v.color, v.color_hex, v.stock, v.sku, v.price_override::int
FROM products p
CROSS JOIN (VALUES
  ('L', 'Blanco', '#ffffff', 5, 'ES-BLAN-L', 21990),
  ('XL', 'Blanco', '#ffffff', 3, 'ES-BLAN-XL', 21990)
) AS v(size, color, color_hex, stock, sku, price_override)
WHERE p.slug = 'polera-blanca-esencia';
