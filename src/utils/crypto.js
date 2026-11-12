const crypto = require('node:crypto');
function sha256Hex(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function randomSalt() { return crypto.randomBytes(16).toString('hex'); }
function modPow(base, exponent, modulus) {
  let result = 1n; base %= modulus;
  while (exponent > 0n) { if (exponent & 1n) result = (result * base) % modulus; base = (base * base) % modulus; exponent >>= 1n; }
  return result;
}
module.exports = { sha256Hex, randomSalt, modPow };
