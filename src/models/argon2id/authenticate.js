const argon2 = require('argon2');
const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { elapsedMs } = require('../../utils/time');

async function authenticate(userId, password, message, emit) {
  const started = process.hrtime.bigint(); emit('Loading encoded Argon2id hash from the database');
  const user = getUser('argon2id', userId);
  if (!user) return { authenticated: false, ms: elapsedMs(started), bytes: fileSize('argon2id'), stored: 'nothing; unknown user id' };
  emit(`salt = ${String(user.salt).slice(0, 16)}...`); emit('Recomputing Argon2id with memory=64 MiB, iterations=3, parallelism=1');
  const verified = await argon2.verify(user.credential, password); emit(`Argon2id recomputed hash == stored hash: ${verified ? 'PASS' : 'FAIL'}`);
  const ms = elapsedMs(started); const metrics = { hash_ms: Number(ms.toFixed(2)), memory_kib: 65536, iterations: 3, parallelism: 1, operation: 'Argon2id password verification' };
  if (verified) { storeMessage('argon2id', userId, message, ms, metrics); emit(`Authenticated; message stored (${Buffer.byteLength(message)} bytes)`, 'complete'); }
  else emit('Authentication failed; message was not stored', 'complete');
  return { authenticated: verified, ms, bytes: fileSize('argon2id'), stored: verified ? 'message + updated user record' : 'nothing', metrics };
}
module.exports = { authenticate };
