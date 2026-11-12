const fs = require('node:fs');
const readline = require('node:readline');
let pipedAnswers = null;
function createReadline() { if (!process.stdin.isTTY) pipedAnswers = fs.readFileSync(0, 'utf8').split(/\r?\n/); return readline.createInterface({ input: process.stdin, output: process.stdout }); }
function ask(rl, question, hidden = false) {
  if (pipedAnswers) { process.stdout.write(question); return Promise.resolve((pipedAnswers.shift() || '').trim()); }
  if (!hidden) return new Promise((resolve) => rl.question(question, resolve));
  return new Promise((resolve) => {
    const stdin = process.stdin; process.stdout.write(question); stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8'); let value = '';
    const onData = (character) => { if (character === '\r' || character === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); process.stdout.write('\n'); resolve(value); } else if (character === '\u0003') process.exit(); else if (character === '\u007f') value = value.slice(0, -1); else value += character; };
    stdin.on('data', onData);
  });
}
module.exports = { ask, createReadline };
