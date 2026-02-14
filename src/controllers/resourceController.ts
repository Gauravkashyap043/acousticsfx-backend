import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getBlogCollection } from '../models/Blog.js';
import { getCaseStudyCollection } from '../models/CaseStudy.js';
import { getEventCollection } from '../models/Event.js';
import type { Blog, CaseStudy, Event } from '../types/index.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

function validateSlug(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  return SLUG_REGEX.test(s) ? s.trim() : null;
}

// ---------- Public ----------

/** GET /api/resources – single payload with blogs, caseStudies, events */
export async function listResources(req: Request, res: Response): Promise<void> {
  try {
    const [blogs, caseStudies, events] = await Promise.all([
      getBlogCollection().find({}).sort({ publishedAt: -1, createdAt: -1 }).toArray(),
      getCaseStudyCollection().find({}).sort({ order: 1, createdAt: -1 }).toArray(),
      getEventCollection().find({}).sort({ eventDate: -1, createdAt: -1 }).toArray(),
    ]);
    const stripId = <T extends { _id?: unknown }>(arr: T[]) =>
      arr.map(({ _id, ...rest }) => rest);
    res.json({
      blogs: stripId(blogs),
      caseStudies: stripId(caseStudies),
      events: stripId(events),
    });
  } catch (err) {
    console.error('listResources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
}

/** GET /api/blogs – backward compat for frontend */
export async function listBlogs(req: Request, res: Response): Promise<void> {
  try {
    const blogs = await getBlogCollection()
      .find({})
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();
    const stripId = (arr: Blog[]) =>
      arr.map(({ _id, ...rest }) => ({ ...rest, _id: _id?.toString() }));
    res.json({ success: true, blogs: stripId(blogs) });
  } catch (err) {
    console.error('listBlogs error:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

/** GET /api/blogs/slug/:slug */
export async function getBlogBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = validateSlug(req.params['slug']);
    if (!slug) {
      res.status(400).json({ error: 'Invalid slug' });
      return;
    }
    const blog = await getBlogCollection().findOne({ slug });
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    const { _id, ...rest } = blog;
    res.json({ success: true, blog: { ...rest, _id: _id?.toString() } });
  } catch (err) {
    console.error('getBlogBySlug error:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
}

// ---------- Admin: Blogs ----------

function validateBlogBody(body: Record<string, unknown>): Omit<Blog, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const slug = validateSlug(body.slug);
  if (!slug) return { error: 'slug is required and alphanumeric with hyphens' };
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
  if (!title) return { error: 'title is required' };
  const heroImage = typeof body.heroImage === 'string' ? body.heroImage.trim() : '';
  const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
  const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined;
  const authorImage = typeof body.authorImage === 'string' ? body.authorImage.trim() : undefined;
  const tags = Array.isArray(body.tags) ? (body.tags as string[]).filter((t) => typeof t === 'string') : undefined;
  const publishedAt = body.publishedAt ? new Date(body.publishedAt as string) : undefined;
  return { slug, title, excerpt, heroImage, authorName, authorImage, tags, publishedAt };
}

export async function listBlogsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const blogs = await getBlogCollection().find({}).sort({ publishedAt: -1 }).toArray();
    res.json({
      items: blogs.map((b) => ({ ...b, _id: b._id?.toString() })),
    });
  } catch (err) {
    console.error('listBlogsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

export async function createBlog(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateBlogBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getBlogCollection();
    const existing = await coll.findOne({ slug: parsed.slug });
    if (existing) {
      res.status(400).json({ error: 'Blog with this slug already exists' });
      return;
    }
    const now = new Date();
    const doc: Blog = { ...parsed, createdAt: now, updatedAt: now };
    const result = await coll.insertOne(doc);
    const inserted = await coll.findOne({ _id: result.insertedId });
    res.status(201).json(inserted ? { ...inserted, _id: inserted._id?.toString() } : {});
  } catch (err) {
    console.error('createBlog error:', err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
}

export async function updateBlog(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const parsed = validateBlogBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getBlogCollection();
    const existing = await coll.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    if (parsed.slug !== existing.slug) {
      const taken = await coll.findOne({ slug: parsed.slug });
      if (taken) {
        res.status(400).json({ error: 'Blog with this slug already exists' });
        return;
      }
    }
    const now = new Date();
    await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: now } }
    );
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(updated ? { ...updated, _id: updated._id?.toString() } : {});
  } catch (err) {
    console.error('updateBlog error:', err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
}

export async function deleteBlog(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await getBlogCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteBlog error:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
}

// ---------- Admin: Case studies ----------

function validateCaseStudyBody(body: Record<string, unknown>): Omit<CaseStudy, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const slug = validateSlug(body.slug);
  if (!slug) return { error: 'slug is required' };
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
  if (!title) return { error: 'title is required' };
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const order = typeof body.order === 'number' ? body.order : 0;
  return { slug, title, description, image, order };
}

export async function listCaseStudiesAdmin(req: Request, res: Response): Promise<void> {
  try {
    const items = await getCaseStudyCollection().find({}).sort({ order: 1 }).toArray();
    res.json({ items: items.map((c) => ({ ...c, _id: c._id?.toString() })) });
  } catch (err) {
    console.error('listCaseStudiesAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch case studies' });
  }
}

export async function createCaseStudy(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateCaseStudyBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getCaseStudyCollection();
    const existing = await coll.findOne({ slug: parsed.slug });
    if (existing) {
      res.status(400).json({ error: 'Case study with this slug already exists' });
      return;
    }
    const now = new Date();
    const doc: CaseStudy = { ...parsed, createdAt: now, updatedAt: now };
    const result = await coll.insertOne(doc);
    const inserted = await coll.findOne({ _id: result.insertedId });
    res.status(201).json(inserted ? { ...inserted, _id: inserted._id?.toString() } : {});
  } catch (err) {
    console.error('createCaseStudy error:', err);
    res.status(500).json({ error: 'Failed to create case study' });
  }
}

export async function updateCaseStudy(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const parsed = validateCaseStudyBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getCaseStudyCollection();
    const existing = await coll.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ error: 'Case study not found' });
      return;
    }
    const now = new Date();
    await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: now } }
    );
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(updated ? { ...updated, _id: updated._id?.toString() } : {});
  } catch (err) {
    console.error('updateCaseStudy error:', err);
    res.status(500).json({ error: 'Failed to update case study' });
  }
}

export async function deleteCaseStudy(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await getCaseStudyCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Case study not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteCaseStudy error:', err);
    res.status(500).json({ error: 'Failed to delete case study' });
  }
}

// ---------- Admin: Events ----------

function validateEventBody(body: Record<string, unknown>): Omit<Event, '_id' | 'createdAt' | 'updatedAt'> | { error: string } {
  const slug = validateSlug(body.slug);
  if (!slug) return { error: 'slug is required' };
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
  if (!title) return { error: 'title is required' };
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const eventDate = typeof body.eventDate === 'string' ? body.eventDate.trim() : undefined;
  const location = typeof body.location === 'string' ? body.location.trim() : undefined;
  return { slug, title, description, image, eventDate, location };
}

export async function listEventsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const items = await getEventCollection().find({}).sort({ eventDate: -1 }).toArray();
    res.json({ items: items.map((e) => ({ ...e, _id: e._id?.toString() })) });
  } catch (err) {
    console.error('listEventsAdmin error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateEventBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getEventCollection();
    const existing = await coll.findOne({ slug: parsed.slug });
    if (existing) {
      res.status(400).json({ error: 'Event with this slug already exists' });
      return;
    }
    const now = new Date();
    const doc: Event = { ...parsed, createdAt: now, updatedAt: now };
    const result = await coll.insertOne(doc);
    const inserted = await coll.findOne({ _id: result.insertedId });
    res.status(201).json(inserted ? { ...inserted, _id: inserted._id?.toString() } : {});
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const parsed = validateEventBody(req.body as Record<string, unknown>);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const coll = getEventCollection();
    const existing = await coll.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    const now = new Date();
    await coll.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed, updatedAt: now } }
    );
    const updated = await coll.findOne({ _id: new ObjectId(id) });
    res.json(updated ? { ...updated, _id: updated._id?.toString() } : {});
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const id = typeof req.params['id'] === 'string' ? req.params['id'] : '';
    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await getEventCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}
