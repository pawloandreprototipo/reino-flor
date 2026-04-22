'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  slug: string
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string; variantId?: string }
  | { type: 'UPDATE_QTY'; productId: string; variantId?: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = action.item.productId + (action.item.variantId ?? '')
      const existing = state.items.find(
        (i) => i.productId + (i.variantId ?? '') === key
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId + (i.variantId ?? '') === key
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return {
        items: state.items.filter(
          (i) => !(i.productId === action.productId && i.variantId === action.variantId)
        ),
      }
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.productId === action.productId && i.variantId === action.variantId
            ? { ...i, quantity: Math.max(1, action.quantity) }
            : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    case 'LOAD':
      return { items: action.items }
    default:
      return state
  }
}

interface CartContextValue extends CartState {
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQty: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  total: number
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'reino-flor-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) dispatch({ type: 'LOAD', items: JSON.parse(stored) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const subtotal = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const itemCount = state.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem: (item) => dispatch({ type: 'ADD', item }),
        removeItem: (productId, variantId) => dispatch({ type: 'REMOVE', productId, variantId }),
        updateQty: (productId, quantity, variantId) =>
          dispatch({ type: 'UPDATE_QTY', productId, variantId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        subtotal,
        total: subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
