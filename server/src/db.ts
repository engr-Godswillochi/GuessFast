import sqlite3 from 'sqlite3';
import path from 'path';

// Use process.cwd() to resolve path relative to where the server process is started
const dbPath = path.resolve(process.cwd(), 'game2.db');
const db = new sqlite3.Database(dbPath);

// Promisify helper functions
export const run = (sql: string, params: any[] = []): Promise<{ id: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID });
    });
  });
};

export const get = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const all = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      word TEXT PRIMARY KEY
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      secret_word TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      attempts INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active', -- active, won, lost
      tournament_id INTEGER -- Optional link to tournament
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY, -- Matches Contract ID
      entry_fee TEXT NOT NULL,
      end_time INTEGER NOT NULL,
      is_open INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS participants (
      tournament_id INTEGER,
      wallet_address TEXT,
      score INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      time_ms INTEGER DEFAULT 0,
      PRIMARY KEY (tournament_id, wallet_address)
    )
  `);

  // Migration: Add tournament_id to runs if it doesn't exist
  db.all("PRAGMA table_info(runs)", (err, rows) => {
    if (err) {
      console.error("Failed to check table schema:", err);
      return;
    }
    const hasTournamentId = rows.some((row: any) => row.name === 'tournament_id');
    if (!hasTournamentId) {
      console.log("Migrating DB: Adding tournament_id to runs table...");
      db.run("ALTER TABLE runs ADD COLUMN tournament_id INTEGER", (alterErr) => {
        if (alterErr) console.error("Migration failed:", alterErr);
        else console.log("Migration successful: tournament_id added.");
      });
    }
  });
});

export default db;