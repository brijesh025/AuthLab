const argon2 = require('argon2');
const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { elapsedMs } = require('../../utils/time');
async function guess(userId, message, dictionary, emit) {
  const started = process.hrtime.bigint(); const user = getUser('argon2id', userId);
  if (!user) return { broken: false, attempts: 0, ms: elapsedMs(started), bytes: fileSize('argon2id'), stored: 'nothing; unknown user id' };
  emit(`Loaded Argon2id parameters: memory=${user.parameters.memory_kib} KiB, iterations=${user.parameters.iterations}`);
  for (let i = 0; i < dictionary.length; i += 1) { const candidate = dictionary[i]; emit(`try ${i + 1}/${dictionary.length}: Argon2id(${JSON.stringify(candidate)})`); if (await argon2.verify(user.credential, candidate)) { const ms = elapsedMs(started); storeMessage('argon2id', userId, message, ms, { attack: 'bounded dictionary', attempts: i + 1, memory_kib: user.parameters.memory_kib, operation: 'Argon2id guess comparison' }); emit(`PASSWORD BROKEN after ${i + 1} tries; message stored`, 'complete'); return { broken: true, attempts: i + 1, ms, bytes: fileSize('argon2id'), stored: 'message + updated user record', candidate }; } }
  const ms = elapsedMs(started); emit(`Password not found after ${dictionary.length} tries; message not stored`, 'complete'); return { broken: false, attempts: dictionary.length, ms, bytes: fileSize('argon2id'), stored: 'nothing' };
}
module.exports = { guess };
