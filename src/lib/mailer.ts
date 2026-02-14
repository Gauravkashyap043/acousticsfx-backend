import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== null) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Send password reset email. If SMTP is not configured, logs the link and returns without error (dev).
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const trans = getTransporter();
  const text = `Reset your AcousticsFX admin password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;
  const html = `<!DOCTYPE html><html><body><p>Reset your AcousticsFX admin password:</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p></body></html>`;

  if (!trans) {
    console.log('[mailer] SMTP not configured. Password reset link (dev):', resetLink);
    return;
  }

  await trans.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Reset your AcousticsFX admin password',
    text,
    html,
  });
}
