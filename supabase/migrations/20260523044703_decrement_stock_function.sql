-- ============================================
-- Migración 004: Función RPC para descuento de stock
-- ============================================

CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_variant_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para variant %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
