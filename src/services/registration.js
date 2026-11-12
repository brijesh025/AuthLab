const { MODELS } = require('../config');
const { userExists } = require('../database/sqlite');
const models = require('../models');
const { createStates, render, renderSummary } = require('../ui/renderer');
async function registerAcrossModels(userId, password) {
  if (!userId || !password) throw new Error('User id and password are required.');
  for (const model of MODELS) if (userExists(model.key, userId)) throw new Error(`User id already exists in ${model.title}.`);
  const states = createStates(); render(states); const results = {};
  // Sequential execution keeps the timing comparison fair and readable.
  for (const model of MODELS) results[model.key] = await models[model.key].register(userId, password, states);
  renderSummary(results, userId); return results;
}
module.exports = { registerAcrossModels };
