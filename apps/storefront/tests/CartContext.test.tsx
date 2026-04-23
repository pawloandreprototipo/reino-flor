import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '@/context/CartContext'

// Mock AuthContext so CartProvider can use useAuth()
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoggedIn: false,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
  }),
}))

// Mock useServerCart to avoid real API calls
jest.mock('@/hooks/useServerCart', () => ({
  mergeCartWithServer: jest.fn().mockResolvedValue({ items: [], total: 0, itemCount: 0 }),
}))

function CartTester() {
  const { items, addItem, removeItem, updateQty, itemCount, subtotal, clearCart } = useCart()
  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <span data-testid="items">{items.length}</span>
      <button onClick={() => addItem({ productId: 'p1', name: 'Camiseta', price: 50, quantity: 1, slug: 'camiseta' })}>
        add
      </button>
      <button onClick={() => addItem({ productId: 'p1', name: 'Camiseta', price: 50, quantity: 2, slug: 'camiseta' })}>
        add-more
      </button>
      <button onClick={() => removeItem('p1')}>remove</button>
      <button onClick={() => updateQty('p1', 5)}>update</button>
      <button onClick={() => clearCart()}>clear</button>
    </div>
  )
}

function renderCart() {
  return render(<CartProvider><CartTester /></CartProvider>)
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('inicia com carrinho vazio', () => {
    renderCart()
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('items').textContent).toBe('0')
  })

  it('adiciona item ao carrinho', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('subtotal').textContent).toBe('50')
  })

  it('acumula quantidade ao adicionar o mesmo produto', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add-more'))
    expect(screen.getByTestId('count').textContent).toBe('3')
    expect(screen.getByTestId('items').textContent).toBe('1')
  })

  it('remove item do carrinho', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('remove'))
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('atualiza quantidade do item', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('update'))
    expect(screen.getByTestId('count').textContent).toBe('5')
    expect(screen.getByTestId('subtotal').textContent).toBe('250')
  })

  it('limpa o carrinho', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('clear'))
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('items').textContent).toBe('0')
  })
})
