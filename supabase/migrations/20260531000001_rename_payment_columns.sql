-- ============================================
-- Migración: Renombrar columnas de Mercado Pago a Fintoc
-- ============================================
-- Preserva datos existentes en las columnas

ALTER TABLE orders RENAME COLUMN mp_preference_id TO payment_session_id;
ALTER TABLE orders RENAME COLUMN mp_payment_id TO payment_intent_id;
