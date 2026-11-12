const crypto = require('node:crypto');
const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { sha256Hex } = require('../../utils/crypto');
const { elapsedMs } = require('../../utils/time');

async function authenticate(userId, password, message, emit) {
  const started = process.hrtime.bigint(); emit('Loading salt and SHA-256 digest from the database');
  const user = getUser('sha256', userId);
  if (!user) return { authenticated: false, ms: elapsedMs(started), bytes: fileSize('sha256'), stored: 'nothing; unknown user id' };
  emit(`salt = ${String(user.salt).slice(0, 16)}...`); emit('digest = SHA-256(userId || salt || password)');
  const digest = sha256Hex(`${userId}|${user.salt}|${password}`); const authenticated = crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(user.credential, 'hex')); emit(`computed digest == stored digest: ${authenticated ? 'PASS' : 'FAIL'}`);
  const ms = elapsedMs(started); const metrics = { hash_ms: Number(ms.toFixed(2)), digest_bits: 256, operation: 'salted SHA-256 comparison' };
  if (authenticated) { storeMessage('sha256', userId, message, ms, metrics); emit(`Authenticated; message stored (${Buffer.byteLength(message)} bytes)`, 'complete'); }
  else emit('Authentication failed; message was not stored', 'complete');
  return { authenticated, ms, bytes: fileSize('sha256'), stored: authenticated ? 'message + updated user record' : 'nothing', metrics };
}
module.exports = { authenticate };
