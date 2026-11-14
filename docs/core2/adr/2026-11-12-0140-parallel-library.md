# A parallel clean break

Accepted; **unimplemented** in this documentation-only snapshot.

The redesigned API and stored model intentionally break compatibility, while the Server Consumer must keep using the existing Core. Build an independent private ESM package at `libs/core2` (`@gorchestra/core2`) rather than replace `libs/core` in place, import its implementation, or maintain a compatibility shim; this isolates the clean break without hiding a Consumer cutover or legacy-store conversion. The numeric suffix distinguishes packages, not domain identifiers.

Source: accepted Core Foundation Implementation Plan, package boundary; `rework/hermes-gorchestra-revision-draft.md`, clean-break policy.
