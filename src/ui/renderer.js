const { MODELS } = require('../config');
const { clockTime } = require('../utils/time');
const RESET = '\x1b[0m'; const PANEL_WIDTH = 40;
function render(states) {
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('AuthLab | live registration comparison');
  console.log('Each panel is an independent credential store and computation path.\n');
  const lines = Math.max(...MODELS.map((model) => states[model.key].lines.length), 1);
  console.log(MODELS.map((model) => `${model.color}${model.title.padEnd(PANEL_WIDTH)}${RESET}`).join('  '));
  console.log(MODELS.map(() => '-'.repeat(PANEL_WIDTH)).join('  '));
  for (let i = 0; i < lines; i += 1) console.log(MODELS.map((model) => (states[model.key].lines[i] || '').slice(0, PANEL_WIDTH).padEnd(PANEL_WIDTH)).join('  '));
  console.log('\nLive status: ' + MODELS.map((model) => `${model.title}=${states[model.key].status}`).join(' | '));
}
function log(states, key, message, status = 'working') { states[key].lines.push(`[${clockTime()}] ${message}`); states[key].status = status; render(states); }
function createStates() { return Object.fromEntries(MODELS.map((model) => [model.key, { lines: [], status: 'queued' }])); }
function renderSummary(results, userId) {
  console.log('\n\nRegistration complete for:', userId);
  console.table(MODELS.map((model) => ({ model: model.title, time_ms: Number(results[model.key].ms.toFixed(2)), database_bytes: results[model.key].bytes, stored: results[model.key].stored })));
  console.log('Security reading: ZKAS stores a public verifier, Argon2id stores a slow password hash, and SHA-256 stores a fast password hash.');
  console.log('Note: database file sizes include SQLite page overhead, so compare them as observed storage, not credential size alone.');
}
module.exports = { render, log, createStates, renderSummary };
