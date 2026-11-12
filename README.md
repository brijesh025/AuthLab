# AuthLab

An educational CLI that compares three registration models using separate SQLite databases:

- **ZKAS / Schnorr-style verifier** — stores a salt and public verifier `v = g^x mod p`; the password-derived secret exponent is not stored.
- **Argon2id** — stores an encoded, salted, memory-hard password hash.
- **SHA-256** — stores a salted but fast password digest as a deliberately weaker baseline.

## Run

```powershell
npm install
npm start
```

Choose `1` and enter a unique user id and password. The three live panels show timestamps, formulae, intermediate values (truncated), database writes, elapsed time, and observed SQLite file size. Databases are created under `data/` as `zkas.sqlite`, `argon2id.sqlite`, and `sha256.sqlite`.

Authentication and message storage are intentionally reserved for the next phase. The ZKAS implementation is an educational Schnorr-style registration record; production authentication needs a reviewed protocol, a safe group, rate limiting, recovery, and secure transport.
