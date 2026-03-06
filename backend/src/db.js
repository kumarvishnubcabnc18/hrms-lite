const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "hrms.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    department  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    date        TEXT NOT NULL,
    status      TEXT NOT NULL CHECK(status IN ('Present','Absent','Half Day','Remote')),
    marked_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
`);

module.exports = db;
