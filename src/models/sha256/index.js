const { insertUser, fileSize } = require('../../database/sqlite'); const { randomSalt, sha256Hex } = require('../../utils/crypto'); const { elapsedMs } = require('../../utils/time');
async function register(userId, password, emit) {
  const started = process.hrtime.bigint(); emit('Generating 128-bit random salt'); const salt = randomSalt(); emit('digest = SHA-256(userId || salt || password)'); const digest = sha256Hex(`${userId}|${salt}|${password}`); emit(`digest = ${digest.slice(0, 18)}... (256 bits)`); emit('Fast single-pass hash; no memory-hard work factor');
  insertUser('sha256', userId, salt, digest, { algorithm: 'SHA-256', digest_bits: 256 }); const ms = elapsedMs(started); emit(`DB: digest ${digest.slice(0, 18)}... stored`, 'complete'); emit(`done in ${ms.toFixed(2)} ms; disk ${fileSize('sha256')} B`, 'complete'); return { ms, bytes: fileSize('sha256'), stored: 'salt + SHA-256 digest' };
}
module.exports = { register };
