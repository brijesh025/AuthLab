const { insertUser, fileSize } = require('../../database/sqlite'); const { randomSalt, sha256Hex } = require('../../utils/crypto'); const { elapsedMs } = require('../../utils/time'); const { log } = require('../../ui/renderer');
async function register(userId, password, states) {
  const started = process.hrtime.bigint(); log(states, 'sha256', 'Generating 128-bit random salt'); const salt = randomSalt(); log(states, 'sha256', 'digest = SHA-256(userId || salt || password)'); const digest = sha256Hex(`${userId}|${salt}|${password}`); log(states, 'sha256', `digest = ${digest.slice(0, 18)}... (256 bits)`); log(states, 'sha256', 'Fast single-pass hash; no memory-hard work factor');
  insertUser('sha256', userId, salt, digest, { algorithm: 'SHA-256', digest_bits: 256 }); const ms = elapsedMs(started); log(states, 'sha256', `DB: digest ${digest.slice(0, 18)}... stored`, 'complete'); log(states, 'sha256', `done in ${ms.toFixed(2)} ms; disk ${fileSize('sha256')} B`, 'complete'); return { ms, bytes: fileSize('sha256'), stored: 'salt + SHA-256 digest' };
}
module.exports = { register };
