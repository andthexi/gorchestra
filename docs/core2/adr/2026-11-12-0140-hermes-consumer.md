# Use a one-shot Core host, not a chat daemon

Accepted; **unimplemented** in this documentation-only snapshot. Expedition, runtime and downstream work remain paused.

Hermes already owns conversation and execution, while Core must retain reusable domain rules. Use a thin Python plugin bridge and one-shot TypeScript/Node host for JSON commands and queries, instead of a long-running Gorchestra daemon, direct Python store writes or duplicated domain logic. The host validates/transacts and exits; ongoing chat stays in Hermes rather than the earlier Core chat-relay design, leaving Core's boundary at typed proposals and human-authorized actions.

Trusted endpoint/auth and caller context come from the Consumer, never model-selected authority or command-line credentials. Successful Core acceptance precedes closing/redirecting the chat view and does not imply transcript deletion or provider session closure; concrete runtime integration remains unimplemented.

Sources: `rework/hermes-gorchestra-revision-draft.md`, one-shot architecture; `rework/pre-delivery-interactions.md`, Hermes-owned ongoing chat.
