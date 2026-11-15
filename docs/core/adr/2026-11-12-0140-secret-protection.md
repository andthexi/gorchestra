# Core owns Portfolio Secret protection

Accepted and implemented. Consumers supply only `secrets.encryptionKey`: explicit null selects plaintext storage, while a canonical base64-encoded 32-byte key selects AES-256-GCM.

Setup atomically creates one stable-identity Secret Protection record even for an empty Portfolio. Encrypted protection contains an authenticated known-marker verifier but never the key; every ready open validates the record and authenticates the supplied key without repair, fallback, or mutation.

Core persists Secret values as a plaintext/encrypted discriminated union. Encrypted values use fresh 12-byte nonces, 16-byte authentication tags, and distinct authenticated contexts that bind verifier data to the protection identity and values to both protection and Secret identities. Public Secret operations return metadata only.
