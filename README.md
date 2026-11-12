# AuthLab

Full model equations, authentication flow, attack descriptions, metrics, and security conclusions: [docs/technical-report.md](docs/technical-report.md)

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

## Attack lab

Under `2) Authentication`, choose `2) Attack lab`. The attacker comparison now has four bounded local-lab attacks: password guessing, credential replay, message tampering, and database-leak comparison. Each attack opens three fresh CLIs, reports progress and calculations, and returns to the main menu. Password guessing uses the same 22-candidate educational dictionary for every model. Credential replay uses a captured password/credential twice; it is intentionally labeled credential replay because the current classroom ZKAS implementation generates a fresh proof from the supplied password rather than exposing a network transcript API. Message tampering edits the local user record, reports whether the edit was detected, and restores the original value. Database-leak comparison reports exactly which credential fields each database exposes.

For ZKAS, the user still enters a password on the client side so the client can derive the proof secret and generate a proof. The verifier should receive only the proof and store only public verification data. This single-machine classroom demo passes the password to the worker so all three models can be compared consistently; it must not be presented as a production password-blind deployment. Standardized PAKE designs such as OPAQUE are the appropriate reference point for a real client/server password-blind system.
