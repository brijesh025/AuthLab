const { MODELS } = require('../config');
const { launchModelClis } = require('./registration');
const dictionary = require('../attacks/dictionary');

async function passwordGuessingAttack(userId, message) {
  if (!userId || !message) throw new Error('User id and message are required.');
  const results = await launchModelClis('attack-password', { userId, message, dictionary });
  console.log('\nPassword-guessing attack comparison complete.');
  console.table(MODELS.map((model) => ({ model: model.title, password_broken: results[model.key].broken, attempts: results[model.key].attempts, time_ms: Number(results[model.key].ms.toFixed(2)), message_stored: results[model.key].stored.includes('message') })));
  console.log(`Dictionary size: ${dictionary.length} candidates.`); return results;
}

async function replayAttack(userId, password, message) {
  const results = await launchModelClis('attack-replay', { userId, password, message });
  console.log('\nCredential-replay attack comparison complete.');
  console.table(MODELS.map((model) => ({ model: model.title, replay_accepted: results[model.key].replayed, attempts: results[model.key].attempts, time_ms: Number(results[model.key].ms.toFixed(2)), result: results[model.key].stored })));
  return results;
}

async function messageTamperingAttack(userId, tamperedMessage) {
  const results = await launchModelClis('attack-tamper', { userId, tamperedMessage });
  console.log('\nMessage-tampering attack comparison complete.');
  console.table(MODELS.map((model) => ({ model: model.title, database_changed: results[model.key].changed, tamper_detected: results[model.key].detected, restored: results[model.key].stored.includes('restored') })));
  return results;
}

async function databaseLeakAttack(userId) {
  const results = await launchModelClis('attack-leak', { userId });
  console.log('\nDatabase-leak comparison complete.');
  console.table(MODELS.map((model) => ({ model: model.title, exposed_fields: results[model.key].exposed.join(', '), exposed_bytes: results[model.key].exposed_bytes, database_bytes: results[model.key].bytes })));
  return results;
}

module.exports = { passwordGuessingAttack, replayAttack, messageTamperingAttack, databaseLeakAttack };
