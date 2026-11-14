# Require explicit authority to progress Core

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

Runtime completion and failed prerequisites do not grant authority to advance or repair domain state. Authoritative starts, acceptance, resolution, materialization and state-changing runtime reconciliation are explicit user-invoked operations rather than background schedulers, completion callbacks, automatic retries or implicit setup/fallback work. This preserves control over consequential effects at the accepted cost of more user actions and potentially stale observations; read polling stays read-only, and agent tools may save unaccepted proposals but never approve them.

Defined mechanics such as ID/stamp generation, transaction cleanup, accepted atomic materialization and supported same-value writes remain part of the requested operation, not additional approval gates.
