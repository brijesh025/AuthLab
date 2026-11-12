const { insertUser, fileSize } = require('../../database/sqlite');
const { sha256Hex, randomSalt, modPow } = require('../../utils/crypto');
const { elapsedMs } = require('../../utils/time');
const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F'); const G = 2n;
async function register(userId, password, emit) {
  const started = process.hrtime.bigint(); emit('Generating 128-bit random salt'); const salt = randomSalt(); emit(`salt = ${salt.slice(0, 16)}...`); emit('x = SHA-256(userId || salt || password) mod (p-1)');
  const x = BigInt(`0x${sha256Hex(`${userId}|${salt}|${password}`)}`) % (P - 1n); emit(`x = ${x.toString(16).slice(0, 16)}... (secret exponent)`); emit('v = g^x mod p; storing public verifier v only');
  const verifier = modPow(G, x, P).toString(16); insertUser('zkas', userId, salt, verifier, { protocol: 'Schnorr-style', generator: G.toString(), modulus_bits: P.toString(2).length }); const ms = elapsedMs(started);
  emit(`DB: verifier ${verifier.slice(0, 14)}... stored`, 'complete'); emit(`done in ${ms.toFixed(2)} ms; disk ${fileSize('zkas')} B`, 'complete'); return { ms, bytes: fileSize('zkas'), stored: 'salt + public verifier + protocol params' };
}
module.exports = { register };
