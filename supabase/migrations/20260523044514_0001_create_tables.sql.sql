-- ============================================
-- Migración 001: Tablas base + trigger updated_at
-- ============================================

-- products
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  base_price  INTEGER NOT NULL CHECK (base_price > 0),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- product_variants
CREATE TABLE product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size           TEXT NOT NULL CHECK (size IN ('XS','S','M','L','XL','XXL')),
  color          TEXT NOT NULL,
  color_hex      TEXT,
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku            TEXT UNIQUE,
  price_override INTEGER CHECK (price_override > 0),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- product_images
CREATE TABLE product_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id   UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  alt_text     TEXT,
  sort_order   INTEGER DEFAULT 0,
  is_primary   BOOLEAN DEFAULT false
);

-- orders
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','cancelled','shipped','delivered')),
  mp_preference_id  TEXT,
  mp_payment_id     TEXT,
  total_amount      INTEGER NOT NULL CHECK (total_amount > 0),
  customer_email    TEXT NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT,
  shipping_address  JSONB NOT NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- order_items
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id   UUID NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_desc TEXT NOT NULL,
  unit_price   INTEGER NOT NULL CHECK (unit_price > 0),
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- trigger: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
