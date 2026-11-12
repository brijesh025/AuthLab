const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { sha256Hex, modPow } = require('../../utils/crypto');
const { elapsedMs } = require('../../utils/time');
const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const G = 2n;

async function guess(userId, message, dictionary, emit) {
  const started = process.hrtime.bigint(); const user = getUser('zkas', userId);
  if (!user) return { broken: false, attempts: 0, ms: elapsedMs(started), bytes: fileSize('zkas'), stored: 'nothing; unknown user id' };
  emit(`Loaded public verifier v = ${String(user.credential).slice(0, 16)}...; no password is read from the user`);
  for (let i = 0; i < dictionary.length; i += 1) {
    const candidate = dictionary[i]; const x = BigInt(`0x${sha256Hex(`${userId}|${user.salt}|${candidate}`)}`) % (P - 1n); const candidateVerifier = modPow(G, x, P).toString(16);
    emit(`try ${i + 1}/${dictionary.length}: v_candidate = g^H(${JSON.stringify(candidate)}) mod p`);
    if (candidateVerifier === user.credential) { const ms = elapsedMs(started); storeMessage('zkas', userId, message, ms, { attack: 'bounded dictionary', attempts: i + 1, operation: 'verifier comparison' }); emit(`PASSWORD BROKEN after ${i + 1} tries; message stored`, 'complete'); return { broken: true, attempts: i + 1, ms, bytes: fileSize('zkas'), stored: 'message + updated user record', candidate }; }
  }
  const ms = elapsedMs(started); emit(`Password not found after ${dictionary.length} tries; message not stored`, 'complete'); return { broken: false, attempts: dictionary.length, ms, bytes: fileSize('zkas'), stored: 'nothing' };
}
module.exports = { guess };
