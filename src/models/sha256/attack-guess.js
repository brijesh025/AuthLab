const crypto = require('node:crypto');
const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { sha256Hex } = require('../../utils/crypto');
const { elapsedMs } = require('../../utils/time');
async function guess(userId, message, dictionary, emit) {
  const started = process.hrtime.bigint(); const user = getUser('sha256', userId);
  if (!user) return { broken: false, attempts: 0, ms: elapsedMs(started), bytes: fileSize('sha256'), stored: 'nothing; unknown user id' };
  emit('Loaded salted SHA-256 digest; each guess is intentionally fast');
  for (let i = 0; i < dictionary.length; i += 1) { const candidate = dictionary[i]; const digest = sha256Hex(`${userId}|${user.salt}|${candidate}`); emit(`try ${i + 1}/${dictionary.length}: SHA-256(userId || salt || ${JSON.stringify(candidate)})`); if (crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(user.credential, 'hex'))) { const ms = elapsedMs(started); storeMessage('sha256', userId, message, ms, { attack: 'bounded dictionary', attempts: i + 1, operation: 'SHA-256 guess comparison' }); emit(`PASSWORD BROKEN after ${i + 1} tries; message stored`, 'complete'); return { broken: true, attempts: i + 1, ms, bytes: fileSize('sha256'), stored: 'message + updated user record', candidate }; } }
  const ms = elapsedMs(started); emit(`Password not found after ${dictionary.length} tries; message not stored`, 'complete'); return { broken: false, attempts: dictionary.length, ms, bytes: fileSize('sha256'), stored: 'nothing' };
}
module.exports = { guess };
