const { MODELS } = require('../config');
const { launchModelClis } = require('./registration');

async function authenticateAcrossModels(userId, password, message) {
  if (!userId || !password || !message) throw new Error('User id, password, and message are required.');
  const results = await launchModelClis('authentication', { userId, password, message });
  console.log('\nAuthentication comparison complete.');
  console.table(MODELS.map((model) => ({ model: model.title, authenticated: results[model.key].authenticated, time_ms: Number(results[model.key].ms.toFixed(2)), database_bytes: results[model.key].bytes, stored: results[model.key].stored })));
  console.log('\nDetailed metrics:');
  for (const model of MODELS) console.log(`${model.title}:`, results[model.key].metrics || 'No metrics because authentication failed.');
  return results;
}

module.exports = { authenticateAcrossModels };
