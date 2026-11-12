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

Choose `1` and enter a unique user id and password. The parent CLI opens three separate Windows Terminal windows through `src/workers/registration-worker.js`: one for ZKAS, one for Argon2id, and one for SHA-256. Windows Terminal is instructed to create new windows, not tabs in the parent terminal, and the layout helper places them side by side. Each window runs independently and prints its own timestamps, formulae, intermediate values (truncated), database writes, elapsed time, and observed SQLite file size. Each operation window waits for Enter before closing; the parent CLI returns to its main menu independently.

The ZKAS implementation is an educational Schnorr-style registration record; production authentication needs a reviewed protocol, a safe group, rate limiting, recovery, and secure transport.

## Authentication

Choose `2` from the main menu and enter the user id, password, and message. The three authentication CLIs independently verify the credential:

- **ZKAS** creates a fresh Schnorr-style Fiat-Shamir proof and checks `g^s = t * v^c mod p`.
- **Argon2id** recomputes the configured memory-hard password hash.
- **SHA-256** recomputes the salted digest and uses a timing-safe comparison.

The message is stored only after successful verification in each model's `messages` table and as the user's `last_message`/`last_message_at`. Authentication time, database size, operation details, and algorithm-specific metrics are shown in the parent CLI. Authentication opens a fresh set of three windows; it does not reuse the registration windows.
