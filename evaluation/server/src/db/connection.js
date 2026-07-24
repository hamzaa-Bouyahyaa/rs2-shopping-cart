const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DEFAULT_DB_PATH = path.join(__dirname, '..', '..', 'shopping-cart.sqlite');

let db = null;

/**
 * Opens (or returns the already open) database connection and applies the
 * schema. The path is resolved from DB_PATH at open time; tests set
 * DB_PATH=':memory:' to get an isolated throwaway database.
 */
function getDb() {
  if (!db) {
    db = new Database(process.env.DB_PATH || DEFAULT_DB_PATH);
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
