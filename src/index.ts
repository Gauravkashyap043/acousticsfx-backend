import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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
