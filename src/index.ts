import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import productRoutes from './routes/products.js';
import resourceRoutes from './routes/resources.js';
import blogRoutes from './routes/blogs.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import newsletterRoutes from './routes/newsletter.js';
import testimonialRoutes from './routes/testimonials.js';
import clientRoutes from './routes/clients.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/clients', clientRoutes);

async function start(): Promise<void> {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
