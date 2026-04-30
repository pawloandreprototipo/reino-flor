export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'VENDOR' | 'AFFILIATE' | 'CUSTOMER'

type Permission =
  | 'products:read' | 'products:write' | 'products:delete'
  | 'orders:read' | 'orders:write'
  | 'customers:read' | 'customers:write'
  | 'analytics:read'
  | 'settings:write'
  | 'vendors:manage'
  | 'affiliates:manage'
  | 'campaigns:manage'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'analytics:read', 'settings:write',
    'vendors:manage', 'affiliates:manage',
    'campaigns:manage',
  ],
  ADMIN: [
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'analytics:read', 'settings:write',
    'vendors:manage', 'affiliates:manage',
    'campaigns:manage',
  ],
  MANAGER: [
    'products:read', 'products:write',
    'orders:read', 'orders:write',
    'customers:read',
    'analytics:read',
    'campaigns:manage',
  ],
  VENDOR: [
    'products:read', 'products:write',
    'orders:read',
  ],
  AFFILIATE: [
    'analytics:read',
  ],
  CUSTOMER: [],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function requireRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole)
}
