const argon2 = require('argon2'); const { insertUser, fileSize } = require('../../database/sqlite'); const { randomSalt } = require('../../utils/crypto'); const { elapsedMs } = require('../../utils/time'); const { log } = require('../../ui/renderer');
async function register(userId, password, states) {
  const started = process.hrtime.bigint(); log(states, 'argon2id', 'Generating 128-bit random salt'); const salt = Buffer.from(randomSalt(), 'hex'); log(states, 'argon2id', 'Argon2id: memory=64 MiB, iterations=3, parallelism=1'); log(states, 'argon2id', 'Filling memory matrix and mixing lanes...');
  const hash = await argon2.hash(password, { type: argon2.argon2id, salt, memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 32, raw: false }); insertUser('argon2id', userId, salt.toString('hex'), hash, { memory_kib: 65536, iterations: 3, parallelism: 1 }); const ms = elapsedMs(started);
  log(states, 'argon2id', `DB: encoded Argon2id hash ${hash.slice(0, 18)}...`, 'complete'); log(states, 'argon2id', `done in ${ms.toFixed(2)} ms; disk ${fileSize('argon2id')} B`, 'complete'); return { ms, bytes: fileSize('argon2id'), stored: 'salt + Argon2id encoded hash + cost params' };
}
module.exports = { register };
