const crypto = require('node:crypto');
const { getUser, storeMessage, fileSize } = require('../../database/sqlite');
const { sha256Hex, modPow } = require('../../utils/crypto');
const { elapsedMs } = require('../../utils/time');

const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const G = 2n;

function randomScalar() { return BigInt(`0x${crypto.randomBytes(32).toString('hex')}`) % (P - 1n); }

async function authenticate(userId, password, message, emit) {
  const started = process.hrtime.bigint(); emit('Loading public verifier v from the ZKAS database');
  const user = getUser('zkas', userId);
  if (!user) return { authenticated: false, ms: elapsedMs(started), bytes: fileSize('zkas'), stored: 'nothing; unknown user id' };
  const lookupMs = elapsedMs(started); emit(`salt = ${String(user.salt).slice(0, 16)}...; verifier v = ${String(user.credential).slice(0, 16)}...`);
  const x = BigInt(`0x${sha256Hex(`${userId}|${user.salt}|${password}`)}`) % (P - 1n);
  emit('x = SHA-256(userId || salt || password) mod (p-1)');
  const r = randomScalar(); const t = modPow(G, r, P); emit('t = g^r mod p; creating a fresh proof commitment');
  const verifier = BigInt(`0x${user.credential}`);
  const c = BigInt(`0x${sha256Hex(`${userId}|${user.salt}|${t.toString(16)}|${user.credential}`)}`) % (P - 1n);
  const s = (r + c * x) % (P - 1n); emit('c = H(userId || salt || t || v); s = r + c*x mod (p-1)');
  const left = modPow(G, s, P); const right = (t * modPow(verifier, c, P)) % P;
  const authenticated = left === right; emit(`verify g^s == t * v^c: ${authenticated ? 'PASS' : 'FAIL'}`);
  const ms = elapsedMs(started); const metrics = { lookup_ms: Number(lookupMs.toFixed(2)), proof_ms: Number(ms.toFixed(2)), operation: 'Fiat-Shamir Schnorr-style proof' };
  if (authenticated) { storeMessage('zkas', userId, message, ms, metrics); emit(`Authenticated; message stored (${Buffer.byteLength(message)} bytes)`, 'complete'); }
  else emit('Authentication failed; message was not stored', 'complete');
  return { authenticated, ms, bytes: fileSize('zkas'), stored: authenticated ? 'message + updated user record' : 'nothing', metrics };
}
module.exports = { authenticate };
