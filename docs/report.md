# AuthLab Report

## 1. Purpose and scope

AuthLab is a local educational CLI for comparing three credential models:

1. ZKAS / Schnorr-style verifier
2. Argon2id password hashing
3. Salted SHA-256 hashing

Each model has its own SQLite database and its own CLI process. Registration, normal authentication, and attack experiments run independently so the project can compare timing, stored data, mathematical operations, and security outcomes.

This is a classroom demonstration, not a production authentication service.

## 2. Stored data

Each database contains a users table with:

- user_id: unique account identifier
- salt: random per-user salt
- credential: model-specific verifier or hash
- parameters: algorithm configuration
- created_at: registration timestamp
- last_message: most recently authenticated message
- last_message_at: message timestamp

Each database also contains a messages table. A message is inserted only after the corresponding model reports successful authentication.

Database files:

- data/zkas.sqlite
- data/argon2id.sqlite
- data/sha256.sqlite

## 3. ZKAS / Schnorr-style verifier

### 3.1 Registration

The current implementation uses an educational finite-field construction.

Parameters:

p = FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F

g = 2

A random 128-bit salt is generated:

salt <- random()

The password-derived secret exponent is:

x = SHA-256(user_id || salt || password) mod (p - 1)

The public verifier is:

v = g^x mod p

The database stores salt, v, g, and protocol parameters. It does not store x or the plaintext password.

### 3.2 Authentication

The user still enters the password on the client side. The password is needed to regenerate x and construct the proof.

The current demonstration performs:

1. Load salt and public verifier v.
2. Recalculate x = SHA-256(user_id || salt || password) mod (p - 1).
3. Choose fresh random r.
4. Compute the commitment t = g^r mod p.
5. Compute the Fiat-Shamir challenge:

   c = SHA-256(user_id || salt || t || v) mod (p - 1)
6. Compute the response:

   s = r + c*x mod (p - 1)
7. Verify:

   g^s mod p == t * v^c mod p

If the equality holds, authentication succeeds and the message is stored.

### 3.3 Security meaning and limitation

The intended idea is that the verifier checks knowledge of a password-derived secret without storing the secret itself.

However, this implementation is educational:

- The password is passed to the local worker because the whole demonstration runs on one machine.
- The verifier v is deterministically derived from a password guess.
- An attacker with the database can calculate candidate verifiers and perform dictionary guessing.
- The group parameters are not a reviewed production Schnorr group construction.

A production password-blind design should use a reviewed PAKE such as OPAQUE or SPAKE2+.

## 4. Argon2id

### 4.1 Registration

The project uses:

- Memory: 65,536 KiB, or 64 MiB
- Iterations: 3
- Parallelism: 1
- Output length: 32 bytes
- Random salt: 128 bits

Conceptually:

hash = Argon2id(password, salt, memory=65536 KiB, iterations=3, parallelism=1)

The encoded Argon2id hash, salt, and cost parameters are stored. The password is not stored.

### 4.2 Authentication

The verifier loads the encoded hash, extracts its salt and parameters, recomputes the candidate hash, and compares the result:

candidate = Argon2id(submitted_password, stored_salt, stored_parameters)

authenticated = candidate == stored_hash

Argon2id is intentionally expensive in both CPU and memory. This makes large offline guessing attacks more expensive than attacks against fast hashes. OWASP recommends memory-hard password hashing such as Argon2id and warns that fast hashes are unsuitable for password storage.

## 5. SHA-256

### 5.1 Registration

A random salt is generated and the following digest is stored:

digest = SHA-256(user_id || salt || password)

Stored fields are the salt, digest, algorithm name, and digest length.

### 5.2 Authentication

The verifier calculates:

candidate = SHA-256(user_id || stored_salt || submitted_password)

It then performs a timing-safe comparison:

authenticated = constant_time_equal(candidate, stored_digest)

SHA-256 is fast by design. It is useful for general integrity checks, but it is a weak password-storage baseline because an attacker can test many guesses quickly.

## 6. Normal authentication workflow

The main menu is:

1. Registration comparison
2. Authentication
3. Exit

The authentication menu is:

1. Normal authentication and store a message
2. Attack lab
3. Back

For normal authentication, the user enters user_id, password, and message. Three fresh authentication CLIs verify the credential independently. A message is stored only when that model authenticates successfully.

The parent CLI compares:

- Authentication result
- Authentication time
- Database size
- Stored result
- Algorithm-specific metrics

## 7. Attack laboratory

The attack lab is bounded and local. It does not attack external systems or use an unrestricted password-cracking list.

Available attacks:

1. Bounded password-guessing attack
2. Credential replay attack
3. Message-tampering attack
4. Database-leak comparison

Every attack opens a fresh set of three CLI processes.

### 7.1 Password guessing

The attacker enters only a target user ID and a message. The attacker does not enter a password.

AuthLab tries the same 22-candidate educational dictionary against all three databases.

SHA-256 candidate:

candidate_digest = SHA-256(user_id || salt || candidate)

Argon2id candidate:

candidate_hash = Argon2id(candidate, salt, stored_parameters)

Current ZKAS candidate:

x_candidate = SHA-256(user_id || salt || candidate) mod (p - 1)

v_candidate = g^x_candidate mod p

The candidate succeeds when v_candidate equals the stored verifier.

Metrics:

- Candidate number
- Formula/calculation
- Progress
- Attempts
- Elapsed time
- Whether the password was broken
- Whether the message was stored

Expected comparison:

- SHA-256: fastest guesses
- Argon2id: slowest guesses because of memory-hard work
- Current ZKAS: dictionary-guessable from a stolen verifier when the password is in the dictionary

### 7.2 Credential replay

The attacker supplies a captured password or credential and a message. AuthLab performs authentication twice using the captured material and reports whether the second attempt succeeds.

This demonstrates credential replay, not a complete network transcript replay. The current ZKAS demo generates a fresh proof each time and does not yet expose a session protocol with server nonces.

A production proof must be bound to a fresh server challenge and session identifier. A proof captured from one session should fail in another session.

### 7.3 Message tampering

The attack directly changes last_message in the local SQLite database:

original_message -> attacker_modified_message

AuthLab reads the modified value, reports whether it was detected, and restores the original message.

Current result:

- database_changed: true
- tamper_detected: false
- restored: true

This demonstrates that authentication does not automatically protect a database from an attacker with direct write access.

Message integrity requires an independent mechanism such as HMAC or authenticated encryption:

ciphertext = AEAD_Encrypt(key, nonce, message, associated_data)

The same message-integrity layer should be used for all three models if the goal is to isolate authentication differences.

### 7.4 Database-leak comparison

This attack performs a read-only dump of the credential record and reports the exposed fields:

- user_id
- salt
- credential
- parameters

The comparison focuses on the meaning of credential:

- SHA-256: fast salted digest
- Argon2id: slow memory-hard encoded hash
- Current ZKAS: public verifier derived from a password-derived exponent

The attack measures exposed material and offline-guessing potential. It does not claim that a public verifier immediately reveals the password.

## 8. Comparison metrics

Performance:

- Registration time in milliseconds
- Authentication time in milliseconds
- Attack time in milliseconds
- Attempts per second
- Database file size
- Credential record size

Security outcome:

- Authentication succeeded or failed
- Password broken or not broken
- Attempts required
- Replay accepted or rejected
- Message tampering detected or undetected
- Credential fields exposed
- Message stored after attack

Resource cost:

- Argon2id memory cost
- Argon2id iterations
- Argon2id parallelism
- ZKAS modular exponentiations
- SHA-256 digest count

## 9. Recommended conclusions

1. SHA-256 is the fastest and weakest password-storage baseline.
2. Argon2id makes offline guessing more expensive through memory-hard computation.
3. A verifier-based ZK or PAKE design can reduce password exposure, but this educational deterministic ZKAS verifier still permits dictionary testing.
4. Replay resistance requires fresh challenges, nonces, and session binding.
5. Authentication does not automatically provide message integrity against direct database modification.
6. Message protection needs an independent authenticated-encryption or integrity layer.
7. A production password-blind system should use a reviewed PAKE such as OPAQUE rather than this classroom Schnorr-style construction.

References:

- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- RFC 9807, OPAQUE: https://www.rfc-editor.org/rfc/rfc9807.html
- RFC 9383, SPAKE2+: https://www.rfc-editor.org/rfc/rfc9383.html
