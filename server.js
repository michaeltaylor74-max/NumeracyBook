'use strict';
require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── JSON file store ──────────────────────────────────────
// All data lives in data.json next to server.js.
const DB_PATH = path.join(__dirname, 'data.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { page_visits: [], downloads: [], error_reports: [], feedback: [], _nextId: 1 };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { page_visits: [], downloads: [], error_reports: [], feedback: [], _nextId: 1 };
  }
}

function saveDB(db) {
  // Write to a temp file then rename — avoids corruption on crash
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

function nextId(db) {
  const id = db._nextId || 1;
  db._nextId = id + 1;
  return id;
}

// ── Helpers ──────────────────────────────────────────────
function hashIP(ip) {
  return crypto
    .createHash('sha256')
    .update((ip || '') + (process.env.IP_SALT || 'default-salt'))
    .digest('hex')
    .slice(0, 16);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const BOOKS = {
  student: { file: 'Nurmeracy Student Book.pdf', label: 'Student Workbook' },
  teacher: { file: 'Nurmeracy Teacher Book.pdf', label: "Teacher's Resource Book" },
};

// ── Middleware ───────────────────────────────────────────
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie:            { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
}));

// Simple in-memory rate limiter for form endpoints
const rateLimits = new Map();
function rateLimit(key, maxPerMinute = 3) {
  const now    = Date.now();
  const window = (rateLimits.get(key) || []).filter(t => now - t < 60_000);
  window.push(now);
  rateLimits.set(key, window);
  return window.length > maxPerMinute;
}

// ── Public API ───────────────────────────────────────────

// Track page visit
app.post('/api/visit', (req, res) => {
  const db      = loadDB();
  const ip_hash = hashIP(req.ip);
  const ua      = (req.get('User-Agent') || '').slice(0, 250);
  db.page_visits.push({
    id: nextId(db),
    page: (req.body.page || 'home').slice(0, 100),
    ip_hash,
    user_agent: ua,
    visited_at: new Date().toISOString(),
  });
  saveDB(db);
  res.json({ ok: true });
});

// Tracked PDF download
app.get('/download/:book', (req, res) => {
  const book = BOOKS[req.params.book];
  if (!book) return res.status(404).send('Not found');

  const db = loadDB();
  db.downloads.push({
    id: nextId(db),
    book: book.label,
    ip_hash: hashIP(req.ip),
    downloaded_at: new Date().toISOString(),
  });
  saveDB(db);

  const filePath = path.join(__dirname, 'PDF', book.file);
  res.download(filePath, book.file, err => {
    if (err && !res.headersSent) res.status(500).send('File unavailable');
  });
});

// Submit error report
app.post('/api/error-report', (req, res) => {
  if (rateLimit(hashIP(req.ip) + ':error')) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }
  const { book, page_number, description, email } = req.body;
  if (!description || description.trim().length < 10) {
    return res.status(400).json({ error: 'Please describe the error in at least 10 characters.' });
  }
  const db = loadDB();
  db.error_reports.push({
    id: nextId(db),
    book:           (book        || 'Unspecified').slice(0, 100),
    page_number:    (page_number || '').slice(0, 20),
    description:    description.trim().slice(0, 2000),
    reporter_email: (email || '').slice(0, 200),
    status:         'new',
    admin_notes:    '',
    submitted_at:   new Date().toISOString(),
  });
  saveDB(db);
  res.json({ ok: true });
});

// Submit general feedback
app.post('/api/feedback', (req, res) => {
  if (rateLimit(hashIP(req.ip) + ':feedback')) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }
  const { name, email, message } = req.body;
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a message.' });
  }
  const db = loadDB();
  db.feedback.push({
    id: nextId(db),
    name:         (name  || '').slice(0, 100),
    email:        (email || '').slice(0, 200),
    message:      message.trim().slice(0, 2000),
    submitted_at: new Date().toISOString(),
  });
  saveDB(db);
  res.json({ ok: true });
});

// ── Admin middleware ─────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// Admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  if (!hash) {
    return res.status(500).json({ error: 'Admin not configured. Run: node setup.js <password>' });
  }
  if (username === process.env.ADMIN_USERNAME && bcrypt.compareSync(password, hash)) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/admin/check', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Dashboard data
app.get('/admin/data', requireAdmin, (req, res) => {
  const db  = loadDB();
  const tod = today();

  const visitsToday   = db.page_visits.filter(r => r.visited_at.startsWith(tod)).length;
  const visitsTotal   = db.page_visits.length;
  const dlToday       = db.downloads.filter(r => r.downloaded_at.startsWith(tod)).length;
  const dlTotal       = db.downloads.length;
  const pendingErrors = db.error_reports.filter(r => r.status !== 'complete').length;
  const newFeedback   = db.feedback.filter(r => r.submitted_at.startsWith(tod)).length;

  // Downloads by book
  const dlMap = {};
  db.downloads.forEach(r => { dlMap[r.book] = (dlMap[r.book] || 0) + 1; });
  const dlByBook = Object.entries(dlMap).map(([book, n]) => ({ book, n }))
                         .sort((a, b) => b.n - a.n);

  // Visits by day (last 14 days)
  const dayMap = {};
  db.page_visits.forEach(r => {
    const d = r.visited_at.slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  const visitsByDay = Object.entries(dayMap)
    .map(([day, n]) => ({ day, n }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-14);

  res.json({
    stats: { visitsToday, visitsTotal, dlToday, dlTotal, pendingErrors, newFeedback },
    dlByBook,
    visitsByDay,
    errors:   [...db.error_reports].reverse(),
    feedback: [...db.feedback].reverse(),
  });
});

// Update error report status / notes
app.patch('/admin/errors/:id', requireAdmin, (req, res) => {
  const { status, admin_notes } = req.body;
  if (!['new', 'in_progress', 'complete'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const db    = loadDB();
  const error = db.error_reports.find(r => r.id === Number(req.params.id));
  if (!error) return res.status(404).json({ error: 'Not found' });
  error.status      = status;
  error.admin_notes = admin_notes || '';
  saveDB(db);
  res.json({ ok: true });
});

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Numeracy Books site running at http://localhost:${PORT}`);
  console.log(`  Admin dashboard: http://localhost:${PORT}/admin/login.html\n`);
});
