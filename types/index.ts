// types/index.ts

export type Product = {
  id: string
  slug: string
  name: string
  description: string | null
  base_price: number           // CLP entero
  is_active: boolean
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export type ProductVariant = {
  id: string
  product_id: string
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  color: string                // nombre legible: "Negro"
  color_hex: string | null     // "#1a1a1a"
  stock: number
  sku: string | null
  price_override: number | null
  created_at: string
}

export type ProductImage = {
  id: string
  product_id: string
  variant_id: string | null
  storage_path: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export type CartItem = {
  variantId: string
  productName: string
  variantDesc: string          // "Talla L - Negro"
  price: number                // CLP entero, snapshot al añadir
  quantity: number
  imageUrl: string
  slug: string
}

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'shipped'
  | 'delivered'

export type ShippingAddress = {
  street: string
  city: string
  region: string
  zip: string | null
  notes: string | null
}

export type Order = {
  id: string
  status: OrderStatus
  payment_session_id: string | null  // was mp_preference_id
  payment_intent_id: string | null   // was mp_payment_id
  total_amount: number
  customer_email: string
  customer_name: string
  customer_phone: string | null
  shipping_address: ShippingAddress
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  variant_id: string
  product_name: string
  variant_desc: string
  unit_price: number
  quantity: number
}

export type CheckoutPayload = {
  items: Array<{
    variantId: string
    quantity: number
  }>
  customer: {
    name: string
    email: string
    phone: string
    address: ShippingAddress
  }
}

export type CheckoutResponse =
  | { redirectUrl: string }
  | { error: 'INSUFFICIENT_STOCK'; failedItems: string[] }
  | { error: 'VALIDATION_ERROR'; message: string }
