const fs = require('node:fs');
const initSqlJs = require('sql.js');
const { ROOT, DATA_DIR, DB_FILES, MODELS } = require('../config');
const { timestamp } = require('../utils/time');
let SQL;
function load(key) { return fs.existsSync(DB_FILES[key]) ? new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILES[key]))) : new SQL.Database(); }
function save(key, db) { fs.writeFileSync(DB_FILES[key], Buffer.from(db.export())); }
async function initialize() {
  await initializeSql();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  await Promise.all(MODELS.map((model) => initializeModel(model.key)));
}
async function initializeSql() {
  if (!SQL) SQL = await initSqlJs({ locateFile: (file) => `${ROOT}/node_modules/sql.js/dist/${file}` });
}
async function initializeModel(key) {
  await initializeSql();
  if (!SQL) throw new Error('SQLite runtime is not initialized.');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = load(key);
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, credential TEXT NOT NULL, parameters TEXT NOT NULL, created_at TEXT NOT NULL)`);
  try { db.run('ALTER TABLE users ADD COLUMN last_message TEXT'); } catch (_) { /* existing database already migrated */ }
  try { db.run('ALTER TABLE users ADD COLUMN last_message_at TEXT'); } catch (_) { /* existing database already migrated */ }
  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, message TEXT NOT NULL, authenticated_at TEXT NOT NULL, auth_time_ms REAL NOT NULL, metrics TEXT NOT NULL)`);
  save(key, db); db.close();
}
function insertUser(key, userId, salt, credential, parameters) {
  const db = load(key);
  const statement = db.prepare('INSERT INTO users (user_id, salt, credential, parameters, created_at) VALUES (?, ?, ?, ?, ?)');
  statement.run([userId, salt, credential, JSON.stringify(parameters), timestamp()]); statement.free();
  save(key, db); db.close();
}
function userExists(key, userId) {
  const db = load(key); const result = db.exec('SELECT 1 FROM users WHERE user_id = $userId LIMIT 1', { $userId: userId }); db.close();
  return result.length > 0 && result[0].values.length > 0;
}
function getUser(key, userId) {
  const db = load(key);
  const result = db.exec('SELECT user_id, salt, credential, parameters, created_at FROM users WHERE user_id = $userId LIMIT 1', { $userId: userId });
  db.close();
  if (!result.length || !result[0].values.length) return null;
  const [storedUserId, salt, credential, parameters, createdAt] = result[0].values[0];
  return { userId: storedUserId, salt, credential, parameters: JSON.parse(parameters), createdAt };
}
function storeMessage(key, userId, message, authTimeMs, metrics) {
  const db = load(key);
  const statement = db.prepare('INSERT INTO messages (user_id, message, authenticated_at, auth_time_ms, metrics) VALUES (?, ?, ?, ?, ?)');
  statement.run([userId, message, timestamp(), authTimeMs, JSON.stringify(metrics)]); statement.free();
  const update = db.prepare('UPDATE users SET last_message = ?, last_message_at = ? WHERE user_id = ?');
  update.run([message, timestamp(), userId]); update.free();
  save(key, db); db.close();
}
function readLastMessage(key, userId) {
  const db = load(key); const result = db.exec('SELECT last_message FROM users WHERE user_id = $userId LIMIT 1', { $userId: userId }); db.close();
  return result.length && result[0].values.length ? result[0].values[0][0] : null;
}
function replaceLastMessage(key, userId, message) {
  const db = load(key); const update = db.prepare('UPDATE users SET last_message = ?, last_message_at = ? WHERE user_id = ?'); update.run([message, timestamp(), userId]); update.free(); save(key, db); db.close();
}
function fileSize(key) { return fs.existsSync(DB_FILES[key]) ? fs.statSync(DB_FILES[key]).size : 0; }
module.exports = { initialize, initializeModel, insertUser, userExists, getUser, storeMessage, readLastMessage, replaceLastMessage, fileSize };
