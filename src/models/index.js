module.exports = {
  zkas: { register: require('./zkas').register, authenticate: require('./zkas/authenticate').authenticate },
  argon2id: { register: require('./argon2id').register, authenticate: require('./argon2id/authenticate').authenticate },
  sha256: { register: require('./sha256').register, authenticate: require('./sha256/authenticate').authenticate },
};
