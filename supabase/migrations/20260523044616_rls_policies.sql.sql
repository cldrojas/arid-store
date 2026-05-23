-- ============================================
-- Migración 002: Políticas RLS
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: lectura pública de activos, escritura solo admin
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- PRODUCT_VARIANTS: lectura pública
CREATE POLICY "variants_public_read"
  ON product_variants FOR SELECT USING (true);

CREATE POLICY "variants_admin_all"
  ON product_variants FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- PRODUCT_IMAGES: lectura pública
CREATE POLICY "images_public_read"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "images_admin_all"
  ON product_images FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ORDERS: solo service_role escribe, admin lee todo
CREATE POLICY "orders_admin_read"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ORDER_ITEMS: solo service_role escribe, admin lee todo
CREATE POLICY "order_items_admin_read"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
