import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminCollection } from '../models/Admin.js';
import { getPasswordResetTokenCollection } from '../models/PasswordResetToken.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail } from '../lib/mailer.js';
import type { JwtPayload } from '../types/index.js';
import { getAllowedTabs } from '../lib/dashboardTabs.js';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const DEFAULT_ROLE = 'super_admin' as const;

/**
 * Login: validates email/password, returns JWT and admin (id, email, role).
 * Role is read from DB; missing role defaults to super_admin for backward compatibility.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const admins = getAdminCollection();
    const admin = await admins.findOne({ email: normalizedEmail });

    if (!admin) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const role = admin.role ?? DEFAULT_ROLE;
    const payload: JwtPayload = {
      sub: admin._id!.toString(),
      email: admin.email,
      role,
    };

    const token = jwt.sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const allowedTabs = getAllowedTabs({
      role,
      visibleTabs: admin.visibleTabs,
    });
    res.json({
      token,
      admin: { id: admin._id!.toString(), email: admin.email, role, allowedTabs },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

/** Returns current admin (id, email, role, allowedTabs). Loads visibleTabs from DB for allowedTabs. */
export async function me(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const admins = getAdminCollection();
  const adminDoc = await admins.findOne(
    { _id: new ObjectId(req.admin.id) },
    { projection: { visibleTabs: 1, role: 1 } }
  );
  const allowedTabs = getAllowedTabs({
    role: req.admin.role ?? adminDoc?.role,
    visibleTabs: adminDoc?.visibleTabs,
  });
  res.json({
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
      allowedTabs,
    },
  });
}

/**
 * Forgot password: if email exists, create reset token, send email. Always returns 200 with same message (no email enumeration).
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const admins = getAdminCollection();
    const tokens = getPasswordResetTokenCollection();
    const admin = await admins.findOne({ email });

    if (admin) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      await tokens.deleteMany({ adminId: admin._id! });
      await tokens.insertOne({
        adminId: admin._id!,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      });

      const base = env.ADMIN_RESET_BASE_URL.replace(/\/$/, '');
      const resetLink = `${base}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(admin.email, resetLink);
    }

    res.json({ message: 'If an account exists with that email, we sent a password reset link.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

/**
 * Reset password: validate token, update password, delete token.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
    const tokens = getPasswordResetTokenCollection();
    const resetRecord = await tokens.findOne({ tokenHash });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    const admins = getAdminCollection();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await admins.updateOne(
      { _id: resetRecord.adminId },
      { $set: { passwordHash } }
    );
    await tokens.deleteMany({ adminId: resetRecord.adminId });

    res.json({ message: 'Password has been reset. You can sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
