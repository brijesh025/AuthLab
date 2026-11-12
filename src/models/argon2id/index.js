const argon2 = require('argon2'); const { insertUser, fileSize } = require('../../database/sqlite'); const { randomSalt } = require('../../utils/crypto'); const { elapsedMs } = require('../../utils/time');
async function register(userId, password, emit) {
  const started = process.hrtime.bigint(); emit('Generating 128-bit random salt'); const salt = Buffer.from(randomSalt(), 'hex'); emit('Argon2id: memory=64 MiB, iterations=3, parallelism=1'); emit('Filling memory matrix and mixing lanes...');
  const hash = await argon2.hash(password, { type: argon2.argon2id, salt, memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 32, raw: false }); insertUser('argon2id', userId, salt.toString('hex'), hash, { memory_kib: 65536, iterations: 3, parallelism: 1 }); const ms = elapsedMs(started);
  emit(`DB: encoded Argon2id hash ${hash.slice(0, 18)}...`, 'complete'); emit(`done in ${ms.toFixed(2)} ms; disk ${fileSize('argon2id')} B`, 'complete'); return { ms, bytes: fileSize('argon2id'), stored: 'salt + Argon2id encoded hash + cost params' };
}
module.exports = { register };
