# Keep repository behavior in Core

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

Injecting a repository adapter into every Consumer would let the same Core domain operation acquire different provider semantics. Core therefore constructs its own GitHub implementation and resolves targets from Assets and credentials through Consumer decoding, while leaving storage, protection and runtime integration Consumer-owned. An invocation captures one coherent Asset Secret binding and matching protected reference rather than switching credentials, restarting or falling back mid-read, so operational updates affect later acquisitions without rewriting that invocation's authority.

Metadata/configuration paths perform no provider preflight, and explicit live read failures do not mutate domain state. Repository API/ref-selection details and the concrete AgentRuntime port remain unselected: this ownership choice adds neither provider/runtime placeholders to foundation construction nor a claim that a captured opaque reference freezes external credential data.
