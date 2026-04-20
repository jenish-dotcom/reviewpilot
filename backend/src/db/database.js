const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../../../data');
const DB_PATH = process.env.SQLITE_PATH || path.join(DB_DIR, 'reviewpilot.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Register UUID generator so DEFAULT (gen_random_uuid()) works in schema
db.function('gen_random_uuid', () => crypto.randomUUID());

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  reviews_this_month INTEGER DEFAULT 0,
  billing_cycle_start TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tone TEXT DEFAULT 'professional',
  email_summary_enabled INTEGER DEFAULT 1,
  email_summary_time TEXT DEFAULT '08:00',
  business_name TEXT,
  business_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  ai_response TEXT,
  edited_response TEXT,
  responded_at TEXT,
  source TEXT DEFAULT 'google',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_reviews_updated_at
AFTER UPDATE ON reviews
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE reviews SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_updated_at
AFTER UPDATE ON settings
WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;
`;

db.exec(schema);
console.log('SQLite database initialized:', DB_PATH);

// Convert PostgreSQL $N placeholders to SQLite ? placeholders
function convertParams(sql) {
  return sql.replace(/\$\d+/g, '?');
}

// pg-compatible async query wrapper
function query(text, params = []) {
  const sql = convertParams(text);
  const stmt = db.prepare(sql);

  const isSelect = /^\s*SELECT/i.test(sql);
  const hasReturning = /\bRETURNING\b/i.test(sql);

  if (isSelect || hasReturning) {
    const rows = stmt.all(...params);
    return Promise.resolve({ rows });
  } else {
    stmt.run(...params);
    return Promise.resolve({ rows: [] });
  }
}

module.exports = { query };
