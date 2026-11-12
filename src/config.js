const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const MODELS = [
  { key: 'zkas', title: 'ZKAS / Schnorr', color: '\x1b[36m' },
  { key: 'argon2id', title: 'Argon2id', color: '\x1b[33m' },
  { key: 'sha256', title: 'SHA-256', color: '\x1b[35m' },
];
const DB_FILES = Object.fromEntries(MODELS.map((model) => [model.key, path.join(DATA_DIR, `${model.key}.sqlite`)]));
module.exports = { ROOT, DATA_DIR, DB_FILES, MODELS };
