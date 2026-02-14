import type { ObjectId } from 'mongodb';

export interface Admin {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string };
    }
  }
}
