import { Request, Response } from 'express';
import { getNewsletterSubscriptionCollection } from '../models/NewsletterSubscription.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/newsletter – public; store newsletter email */
export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'A valid email is required' });
      return;
    }

    const coll = getNewsletterSubscriptionCollection();
    await coll.insertOne({ email, createdAt: new Date() });
    res.status(201).json({ ok: true, message: 'Thanks for subscribing.' });
  } catch (err) {
    console.error('Newsletter submit error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
}

/** GET /api/admin/newsletter-submissions – list all (admin only). Requires CONTENT_READ. */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const coll = getNewsletterSubscriptionCollection();
    const items = await coll
      .find({})
      .sort({ createdAt: -1 })
      .project<{ _id: 1; email: 1; createdAt: 1 }>({ _id: 1, email: 1, createdAt: 1 })
      .toArray();

    res.json({
      items: items.map((d) => ({
        _id: String(d._id),
        email: d.email,
        createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
      })),
    });
  } catch (err) {
    console.error('Newsletter list error:', err);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
}
