import { hasPermission, requireRole, Role } from '../src/rbac'

describe('RBAC', () => {
  it('ADMIN deve ter permissão de escrita em produtos', () => {
    expect(hasPermission('ADMIN', 'products:write')).toBe(true)
  })

  it('CUSTOMER não deve ter nenhuma permissão', () => {
    expect(hasPermission('CUSTOMER', 'products:read')).toBe(false)
    expect(hasPermission('CUSTOMER', 'orders:read')).toBe(false)
  })

  it('VENDOR deve poder ler e escrever produtos', () => {
    expect(hasPermission('VENDOR', 'products:read')).toBe(true)
    expect(hasPermission('VENDOR', 'products:write')).toBe(true)
  })

  it('VENDOR não deve gerenciar outros vendors', () => {
    expect(hasPermission('VENDOR', 'vendors:manage')).toBe(false)
  })

  it('MANAGER não deve alterar settings', () => {
    expect(hasPermission('MANAGER', 'settings:write')).toBe(false)
  })

  it('requireRole deve aceitar role correta', () => {
    expect(requireRole('ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true)
  })

  it('requireRole deve rejeitar role incorreta', () => {
    expect(requireRole('CUSTOMER', ['ADMIN', 'SUPER_ADMIN'])).toBe(false)
  })
})
