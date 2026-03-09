const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/registrations.db';
const absPath = path.resolve(dbPath);

// Ensure the data directory exists
fs.mkdirSync(path.dirname(absPath), { recursive: true });

const db = new Database(absPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    phone     TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
