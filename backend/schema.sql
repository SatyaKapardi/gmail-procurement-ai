-- D1 Database Schema for Gmail Procurement AI

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipients TEXT, -- JSON array
  subject TEXT,
  body TEXT,
  is_internal INTEGER DEFAULT 0, -- 0 = external, 1 = internal
  po_number TEXT,
  user_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_po_number ON emails(po_number);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  vendor TEXT,
  amount REAL,
  delivery_date TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, shipped, received
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_user_id ON purchase_orders(user_id);

-- Communications table (links emails to POs)
CREATE TABLE IF NOT EXISTS communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  po_number TEXT NOT NULL,
  user_id TEXT NOT NULL,
  metadata TEXT, -- JSON for additional data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(thread_id, po_number, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_thread_id ON communications(thread_id);
CREATE INDEX IF NOT EXISTS idx_comm_po_number ON communications(po_number);
CREATE INDEX IF NOT EXISTS idx_comm_user_id ON communications(user_id);
