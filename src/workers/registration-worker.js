const fs = require('node:fs');
const readline = require('node:readline');
const { initializeModel } = require('../database/sqlite');
const models = require('../models');
const { timestamp } = require('../utils/time');

const [mode, modelKey, inputFile, resultFile] = process.argv.slice(2);
function print(message) { console.log(`[${timestamp().slice(11, 19)}] ${message}`); }
function waitForEnter() { return new Promise((resolve) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question('\nPress Enter to close this CLI window... ', () => { rl.close(); resolve(); }); }); }
async function main() {
  try {
    const input = JSON.parse(fs.readFileSync(inputFile, 'utf8')); await initializeModel(modelKey);
    console.log(`\n=== AuthLab ${modelKey.toUpperCase()} ${mode.toUpperCase()} CLI ===\n`);
    const operation = models[modelKey][mode === 'authentication' ? 'authenticate' : 'register'];
    const result = await operation(input.userId, input.password, ...(mode === 'authentication' ? [input.message] : []), (message, status) => print(`${status === 'complete' ? 'COMPLETE: ' : ''}${message}`));
    fs.writeFileSync(resultFile, JSON.stringify({ result })); print('Operation finished.'); await waitForEnter();
  } catch (error) { fs.writeFileSync(resultFile, JSON.stringify({ error: error.message })); print(`ERROR: ${error.message}`); await waitForEnter(); process.exitCode = 1; }
}
main();
