import { Request, Response } from 'express';
import { getContactSubmissionCollection } from '../models/ContactSubmission.js';

const SUBJECTS = ['General Inquiry', 'Help & Support', 'Become Partner', 'Other'] as const;

function isValidSubject(s: string): s is (typeof SUBJECTS)[number] {
  return SUBJECTS.includes(s as (typeof SUBJECTS)[number]);
}

/** POST /api/contact – public; store a contact form submission */
export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, subject, message } = req.body ?? {};
    const n = typeof name === 'string' ? name.trim() : '';
    const e = typeof email === 'string' ? email.trim() : '';
    const subj = typeof subject === 'string' && isValidSubject(subject.trim()) ? subject.trim() : 'General Inquiry';
    const msg = typeof message === 'string' ? message.trim() : '';

    if (!n || !e) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const doc = {
      name: n,
      email: e,
      ...(typeof phone === 'string' && phone.trim() && { phone: phone.trim() }),
      subject: subj,
      message: msg || '(no message)',
      createdAt: new Date(),
    };

    const coll = getContactSubmissionCollection();
    await coll.insertOne(doc);
    res.status(201).json({ ok: true, message: 'Thank you for your message.' });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
}

/** GET /api/admin/contact-submissions – paginated list (admin only) */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const coll = getContactSubmissionCollection();
    const [items, total] = await Promise.all([
      coll.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      coll.countDocuments(),
    ]);

    res.json({
      items: items.map((d) => ({
        _id: String(d._id),
        name: d.name,
        email: d.email,
        phone: d.phone,
        subject: d.subject,
        message: d.message,
        createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
      })),
      total,
      limit,
      skip,
    });
  } catch (err) {
    console.error('Contact list error:', err);
    res.status(500).json({ error: 'Failed to list submissions' });
  }
}
