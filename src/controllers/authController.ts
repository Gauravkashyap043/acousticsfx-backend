import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminCollection } from '../models/Admin.js';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

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

    const payload: JwtPayload = {
      sub: admin._id!.toString(),
      email: admin.email,
    };

    const token = jwt.sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      token,
      admin: { id: admin._id!.toString(), email: admin.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ admin: req.admin });
}
