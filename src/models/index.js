module.exports = {
  zkas: { register: require('./zkas').register, authenticate: require('./zkas/authenticate').authenticate, guess: require('./zkas/attack-guess').guess },
  argon2id: { register: require('./argon2id').register, authenticate: require('./argon2id/authenticate').authenticate, guess: require('./argon2id/attack-guess').guess },
  sha256: { register: require('./sha256').register, authenticate: require('./sha256/authenticate').authenticate, guess: require('./sha256/attack-guess').guess },
};
