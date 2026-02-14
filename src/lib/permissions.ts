import type { AdminRole } from '../types/index.js';

/**
 * Permission strings used for requirePermission().
 * Add new permissions here and map them to roles in ROLE_PERMISSIONS.
 */
export const PERMISSIONS = {
  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  SYSTEM_MANAGE: 'system:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Role → list of permissions. To add a role: add key here and assign permissions. */
const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  editor: [PERMISSIONS.CONTENT_READ, PERMISSIONS.CONTENT_WRITE],
  admin: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
  ],
  super_admin: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.SYSTEM_MANAGE,
  ],
};

/**
 * Returns whether the given role is allowed to perform the given permission.
 * Undefined role is treated as no permission.
 */
export function can(role: AdminRole | undefined, permission: string): boolean {
  if (!role || !permission) return false;
  const list = ROLE_PERMISSIONS[role];
  if (!list) return false;
  return list.includes(permission as Permission);
}

/**
 * Returns all permissions for a role (for debugging or admin UI).
 */
export function getPermissionsForRole(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
