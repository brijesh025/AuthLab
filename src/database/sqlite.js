const fs = require('node:fs');
const initSqlJs = require('sql.js');
const { ROOT, DATA_DIR, DB_FILES, MODELS } = require('../config');
const { timestamp } = require('../utils/time');
let SQL;
function load(key) { return fs.existsSync(DB_FILES[key]) ? new SQL.Database(new Uint8Array(fs.readFileSync(DB_FILES[key]))) : new SQL.Database(); }
function save(key, db) { fs.writeFileSync(DB_FILES[key], Buffer.from(db.export())); }
async function initialize() {
  SQL = await initSqlJs({ locateFile: (file) => `${ROOT}/node_modules/sql.js/dist/${file}` });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const model of MODELS) {
    const db = load(model.key);
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, credential TEXT NOT NULL, parameters TEXT NOT NULL, created_at TEXT NOT NULL)`);
    save(model.key, db); db.close();
  }
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
function fileSize(key) { return fs.existsSync(DB_FILES[key]) ? fs.statSync(DB_FILES[key]).size : 0; }
module.exports = { initialize, insertUser, userExists, fileSize };
