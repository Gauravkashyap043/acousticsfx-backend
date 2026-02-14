import { ObjectId } from 'mongodb';
import type { Collection } from 'mongodb';
import type { Admin } from '../types/index.js';

/**
 * Ensures at least one super_admin remains in the system.
 * Call this before deleting an admin or demoting an admin's role to non–super_admin.
 *
 * @param admins - The admins collection
 * @param excludeAdminId - Optional ObjectId string of the admin being removed or demoted; they are excluded from the super_admin count.
 * @returns Resolves if at least one other super_admin exists; rejects with Error if the operation would leave zero super_admins.
 */
export async function assertAtLeastOneSuperAdminRemains(
  admins: Collection<Admin>,
  excludeAdminId?: string
): Promise<void> {
  const filter: Record<string, unknown> = { role: 'super_admin' };
  if (excludeAdminId && ObjectId.isValid(excludeAdminId)) {
    filter._id = { $ne: new ObjectId(excludeAdminId) };
  }
  const count = await admins.countDocuments(filter);
  if (count === 0) {
    throw new Error(
      'At least one super_admin must always exist. Cannot delete or demote the last super_admin.'
    );
  }
}
