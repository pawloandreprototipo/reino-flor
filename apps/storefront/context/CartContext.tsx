'use client'

import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { mergeCartWithServer, ServerCart } from '@/hooks/useServerCart'

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
  | { type: 'LOAD_FROM_SERVER'; cart: ServerCart }

function mapServerCartToItems(cart: ServerCart): CartItem[] {
  return cart.items.map((si) => ({
    productId: si.productId,
    variantId: si.variantId,
    name: si.product.name,
    price: si.variant ? si.variant.price : si.product.price,
    quantity: si.quantity,
    imageUrl: si.product.images[0]?.url,
    slug: si.product.slug,
  }))
}

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
    case 'LOAD_FROM_SERVER':
      return { items: mapServerCartToItems(action.cart) }
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
  const { user, isLoggedIn } = useAuth()
  const prevLoggedIn = useRef(false)
  const hasSynced = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) dispatch({ type: 'LOAD', items: JSON.parse(stored) })
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  // Sync with server on login
  useEffect(() => {
    if (isLoggedIn && !prevLoggedIn.current && !hasSynced.current) {
      hasSynced.current = true
      mergeCartWithServer(state.items)
        .then((serverCart) => {
          dispatch({ type: 'LOAD_FROM_SERVER', cart: serverCart })
        })
        .catch(() => {
          // Keep local cart on failure
        })
    }

    if (!isLoggedIn && prevLoggedIn.current) {
      // On logout — revert to localStorage-only (already the case, just reset sync flag)
      hasSynced.current = false
    }

    prevLoggedIn.current = isLoggedIn
  }, [isLoggedIn, state.items])

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
