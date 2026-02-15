import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getAdminCollection } from '../models/Admin.js';
import { assertAtLeastOneSuperAdminRemains } from '../lib/superAdminGuard.js';
import { DASHBOARD_TAB_KEYS, isValidVisibleTabs } from '../lib/dashboardTabs.js';
import type { AdminRole } from '../types/index.js';

const VALID_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor'];

function toAdminDto(doc: { _id: ObjectId; email: string; role?: AdminRole; visibleTabs?: string[] }) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    role: doc.role ?? 'admin',
    visibleTabs: doc.visibleTabs ?? undefined,
  };
}

/** GET /api/admin/admins – list all admins (id, email, role, visibleTabs) + tabKeys. Requires SYSTEM_MANAGE. */
export async function list(_req: Request, res: Response): Promise<void> {
  const admins = getAdminCollection();
  const cursor = admins.find(
    {},
    { projection: { email: 1, role: 1, visibleTabs: 1 } }
  );
  const docs = await cursor.toArray();
  const listAdmins = docs.map((d) => toAdminDto({ _id: d._id!, email: d.email, role: d.role, visibleTabs: d.visibleTabs }));
  res.json({ admins: listAdmins, tabKeys: [...DASHBOARD_TAB_KEYS] });
}

/** POST /api/admin/admins – create admin. Requires SYSTEM_MANAGE. */
export async function create(req: Request, res: Response): Promise<void> {
  const { email, password, role, visibleTabs } = req.body as {
    email?: string;
    password?: string;
    role?: AdminRole;
    visibleTabs?: string[];
  };

  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const roleVal =
    role && VALID_ROLES.includes(role) ? role : ('admin' as AdminRole);
  if (visibleTabs !== undefined && !isValidVisibleTabs(visibleTabs)) {
    res.status(400).json({ error: 'visibleTabs must be an array of valid tab keys' });
    return;
  }

  const admins = getAdminCollection();
  const existing = await admins.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(409).json({ error: 'An admin with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const insert: { email: string; passwordHash: string; role: AdminRole; visibleTabs?: string[]; createdAt: Date } = {
    email: normalizedEmail,
    passwordHash,
    role: roleVal,
    createdAt: new Date(),
  };
  if (visibleTabs && visibleTabs.length > 0) {
    insert.visibleTabs = visibleTabs;
  }
  const result = await admins.insertOne(insert);
  const id = result.insertedId.toString();
  res.status(201).json({
    admin: toAdminDto({
      _id: result.insertedId,
      email: normalizedEmail,
      role: roleVal,
      visibleTabs: insert.visibleTabs,
    }),
  });
}

/** PATCH /api/admin/admins/:id – update role and/or visibleTabs. Requires SYSTEM_MANAGE. */
export async function update(req: Request, res: Response): Promise<void> {
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id || !ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid admin id' });
    return;
  }
  const { role, visibleTabs } = req.body as { role?: AdminRole; visibleTabs?: string[] };

  const admins = getAdminCollection();
  const existing = await admins.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    res.status(404).json({ error: 'Admin not found' });
    return;
  }

  if (visibleTabs !== undefined && !isValidVisibleTabs(visibleTabs)) {
    res.status(400).json({ error: 'visibleTabs must be an array of valid tab keys' });
    return;
  }

  const updates: { role?: AdminRole; visibleTabs?: string[] } = {};
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    if (existing.role === 'super_admin' && role !== 'super_admin') {
      try {
        await assertAtLeastOneSuperAdminRemains(admins, id);
      } catch (err) {
        res.status(409).json({
          error: err instanceof Error ? err.message : 'At least one super_admin must always exist.',
        });
        return;
      }
    }
    updates.role = role;
  }
  if (visibleTabs !== undefined) {
    updates.visibleTabs = visibleTabs.length > 0 ? visibleTabs : undefined;
  }

  if (Object.keys(updates).length === 0) {
    res.json({
      admin: toAdminDto({
        _id: existing._id!,
        email: existing.email,
        role: existing.role,
        visibleTabs: existing.visibleTabs,
      }),
    });
    return;
  }

  await admins.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  const updated = await admins.findOne(
    { _id: new ObjectId(id) },
    { projection: { email: 1, role: 1, visibleTabs: 1 } }
  );
  if (!updated) {
    res.status(500).json({ error: 'Update succeeded but admin not found' });
    return;
  }
  res.json({
    admin: toAdminDto({
      _id: updated._id!,
      email: updated.email,
      role: updated.role,
      visibleTabs: updated.visibleTabs,
    }),
  });
}

/** DELETE /api/admin/admins/:id. Requires SYSTEM_MANAGE. */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id || !ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid admin id' });
    return;
  }

  const admins = getAdminCollection();
  const existing = await admins.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    res.status(404).json({ error: 'Admin not found' });
    return;
  }

  try {
    await assertAtLeastOneSuperAdminRemains(admins, id);
  } catch (err) {
    res.status(409).json({
      error: err instanceof Error ? err.message : 'At least one super_admin must always exist.',
    });
    return;
  }
  await admins.deleteOne({ _id: new ObjectId(id) });
  res.status(204).send();
}
