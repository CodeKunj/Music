/* =========================================================
   server.js — Express Entry Point
   ========================================================= */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import tracksRouter       from './routes/tracks.js';
import servicesRouter     from './routes/services.js';
import testimonialsRouter from './routes/testimonials.js';
import beforeAfterRouter  from './routes/beforeAfter.js';
import contactRouter      from './routes/contact.js';
import adminRouter        from './routes/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static: Admin Dashboard ───────────────────────────────────
// Serve admin panel from /admin/*
app.use('/admin', express.static(join(__dirname, '../admin')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/tracks',       tracksRouter);
app.use('/api/services',     servicesRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/before-after', beforeAfterRouter);
app.use('/api/contact',      contactRouter);
app.use('/api/admin',        adminRouter);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.path}` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large.' });
  }

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Kunj Rana Portfolio Backend            ║
  ║   Running on http://localhost:${PORT}       ║
  ║   Admin:  http://localhost:${PORT}/admin/   ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
