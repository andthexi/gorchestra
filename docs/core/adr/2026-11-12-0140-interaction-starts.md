# Acknowledge runtime starts inside the local transaction

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

Starting an Expedition or planning interaction must keep local phase/claim changes coherent with an acknowledged runtime association. Validate and create the local records, open the session, submit the first run and record its acknowledgment inside one transaction, returning after acknowledgment and commit rather than after the answer. Direct starts were chosen over a persisted pending-start queue or durable submission processor, accepting longer-held locks and possible external orphan work because local rollback cannot undo a remote session or run.

An uncertain submission is not presumed failure: explicit reconciliation inspects the exact known attempt, and a safely repeatable identical transport request reuses its stable key/fingerprint while new execution gets a new identity. This promises neither idempotent session creation nor automatic resubmission, and does not introduce Core Session/Run domain models.
