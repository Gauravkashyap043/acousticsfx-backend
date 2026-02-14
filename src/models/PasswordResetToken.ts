import type { Collection } from 'mongodb';
import type { PasswordResetToken as Token } from '../types/index.js';
import { getDb } from '../config/db.js';

const COLLECTION = 'password_reset_tokens';

export function getPasswordResetTokenCollection(): Collection<Token> {
  return getDb().collection<Token>(COLLECTION);
}
