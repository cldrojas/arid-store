'use client'

import {
  createContext, useContext, useEffect, useReducer,
  type ReactNode
} from 'react'
import type { CartItem } from '@/types'

type CartState = {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; variantId: string }
  | { type: 'UPDATE_QUANTITY'; variantId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_FROM_STORAGE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return { items: action.items }

    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.variantId === action.payload.variantId)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.variantId === action.payload.variantId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          )
        }
      }
      return { items: [...state.items, action.payload] }
    }

    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => i.variantId !== action.variantId) }

    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return { items: state.items.filter(i => i.variantId !== action.variantId) }
      }
      return {
        items: state.items.map(i =>
          i.variantId === action.variantId
            ? { ...i, quantity: action.quantity }
            : i
        )
      }

    case 'CLEAR_CART':
      return { items: [] }

    default:
      return state
  }
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = 'cart_v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const items = JSON.parse(saved) as CartItem[]
        dispatch({ type: 'LOAD_FROM_STORAGE', items })
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [])

  // Persistir en localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const total = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      itemCount,
      total,
      addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
      removeItem: (variantId) => dispatch({ type: 'REMOVE_ITEM', variantId }),
      updateQuantity: (variantId, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', variantId, quantity }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' })
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
