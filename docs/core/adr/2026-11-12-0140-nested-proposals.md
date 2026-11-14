# Use structured, local proposal dependencies

Accepted; **unimplemented**. Expedition, runtime and downstream work remain paused.

Represent proposal ordering with nested sequence/parallel groups rather than generated cross-reference keys or the considered nested prerequisite trees; Core derives the stored edges while each proposed item appears once. This deliberately supports structured dependencies, including joins after parallel groups, rather than arbitrary reference-based DAG expressiveness. Separately, confine Delivery prerequisites to one Blueprint and Slice prerequisites to one Delivery: these endpoint-scope limits keep acceptance self-contained and ordering aligned with outcomes, at the cost of coarser cross-Delivery ordering and manual coordination between Blueprints.

Existing persisted IDs can reference scoped amendment targets, not identify new proposal parts; groups are structural values, not work records. Sequence waits for the preceding whole group, parallel children impose no mutual order, and cross-Blueprint coordination remains manual. Exact serialized group fields remain unselected.
