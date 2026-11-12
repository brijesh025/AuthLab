const fs = require('node:fs');
const readline = require('node:readline');
const { initializeModel } = require('../database/sqlite');
const { getUser, readLastMessage, replaceLastMessage, fileSize } = require('../database/sqlite');
const models = require('../models');
const { timestamp } = require('../utils/time');

const [mode, modelKey, inputFile, resultFile] = process.argv.slice(2);
function print(message) { console.log(`[${timestamp().slice(11, 19)}] ${message}`); }
function waitForEnter() { return new Promise((resolve) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question('\nPress Enter to close this CLI window... ', () => { rl.close(); resolve(); }); }); }
async function main() {
  try {
    const input = JSON.parse(fs.readFileSync(inputFile, 'utf8')); await initializeModel(modelKey);
    console.log(`\n=== AuthLab ${modelKey.toUpperCase()} ${mode.toUpperCase()} CLI ===\n`);
    if (mode === 'attack-tamper') {
      const original = readLastMessage(modelKey, input.userId); print(`Loaded last_message: ${original === null ? 'none' : `${String(original).slice(0, 30)}...`}`);
      if (original === null) { const result = { detected: false, changed: false, ms: 0, bytes: fileSize(modelKey), stored: 'no message to tamper with' }; fs.writeFileSync(resultFile, JSON.stringify({ result })); await waitForEnter(); return; }
      replaceLastMessage(modelKey, input.userId, input.tamperedMessage); const changed = readLastMessage(modelKey, input.userId) === input.tamperedMessage; print(`Direct database edit changed the message: ${changed ? 'YES' : 'NO'}`); replaceLastMessage(modelKey, input.userId, original); print('Original message restored after the lab attack.', 'complete');
      const result = { detected: false, changed, ms: 0, bytes: fileSize(modelKey), stored: changed ? 'tampered value was accepted; restored' : 'tamper failed' }; fs.writeFileSync(resultFile, JSON.stringify({ result })); await waitForEnter(); return;
    }
    if (mode === 'attack-leak') {
      const user = getUser(modelKey, input.userId); const exposed = user ? ['userId', 'salt', 'credential', 'parameters'] : []; print(user ? `Database dump exposed: ${exposed.join(', ')}` : 'Unknown user id; no record exposed', 'complete');
      const result = { exposed, exposed_bytes: user ? JSON.stringify(user).length : 0, ms: 0, bytes: fileSize(modelKey), stored: user ? 'credential material exposed' : 'nothing' }; fs.writeFileSync(resultFile, JSON.stringify({ result })); await waitForEnter(); return;
    }
    if (mode === 'attack-replay') {
      print('Capturing one successful authentication exchange'); const first = await models[modelKey].authenticate(input.userId, input.password, input.message, (message) => print(`capture: ${message}`)); print('Replaying the captured credential/exchange a second time'); const second = await models[modelKey].authenticate(input.userId, input.password, input.message, (message) => print(`replay: ${message}`), { replay: true });
      const result = { replayed: Boolean(first.authenticated && second.authenticated), attempts: 2, ms: first.ms + second.ms, bytes: fileSize(modelKey), stored: second.authenticated ? 'replay accepted' : 'replay rejected' }; print(`Replay result: ${result.replayed ? 'ACCEPTED' : 'REJECTED'}`, 'complete'); fs.writeFileSync(resultFile, JSON.stringify({ result })); await waitForEnter(); return;
    }
    const operationName = mode === 'authentication' ? 'authenticate' : mode === 'attack-password' ? 'guess' : 'register';
    const operation = models[modelKey][operationName];
    const args = mode === 'authentication' ? [input.userId, input.password, input.message] : mode === 'attack-password' ? [input.userId, input.message, input.dictionary] : [input.userId, input.password];
    const result = await operation(...args, (message, status) => print(`${status === 'complete' ? 'COMPLETE: ' : ''}${message}`));
    fs.writeFileSync(resultFile, JSON.stringify({ result })); print('Operation finished.'); await waitForEnter();
  } catch (error) { fs.writeFileSync(resultFile, JSON.stringify({ error: error.message })); print(`ERROR: ${error.message}`); await waitForEnter(); process.exitCode = 1; }
}
main();
