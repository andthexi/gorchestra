# Keep repository behavior in Core

Accepted architecture. Integration plans and remaining interface choices are tracked under [Repository-provider and Consumer integration](../FUTURE.md#repository-provider-and-consumer-integration).

Injecting a repository adapter into every Consumer would let the same Core domain operation acquire different provider semantics. The accepted design keeps the GitHub implementation in Core, resolving targets from Assets and credentials through [Core-owned Secret protection](2026-11-12-0140-secret-protection.md); Consumers supply isolated storage, encryption keys and runtime integration. An invocation captures one coherent Asset Secret binding and matching Stored Secret Value rather than switching credentials, restarting or falling back mid-read, so operational updates affect later acquisitions without rewriting that invocation's authority.

Metadata/configuration paths perform no provider preflight, and explicit live read failures do not mutate domain state. This ownership choice adds neither provider/runtime placeholders to foundation construction nor a guarantee that an external provider will continue accepting a captured credential.
