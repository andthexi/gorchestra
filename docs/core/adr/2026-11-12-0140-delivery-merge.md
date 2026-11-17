# Integrate and verify a whole Delivery

Accepted architecture. Delivery scope is tracked under [Delivery, review and external effects](../FUTURE.md#delivery-review-and-external-effects).

Individual Slices can be assessed separately, but the accepted Delivery is the outcome integrated into its Project. Keep Delivery independent of Expedition/Blueprint, owning its Slices and immutable Instructions, and merge the whole reviewed Delivery rather than publish Slice merges by default or require one Expedition-wide merge. A Delivery prerequisite is satisfied only after its Project merge is verified and recorded, trading earlier dependent starts for an integrated baseline rather than treating Slice completion, approval or a submitted merge request as integration.

Origin references preserve accepted scope without granting later Blueprint edits authority over execution. Derived readiness never automatically starts dependent work.
