# Editable content review files

These files are separate from page logic so the team can review the wording and metadata:

- `emergency-procedure.ts` — deterministic demo step text, applicability, expected record, alternatives, version, and review status.
- `measurement-guides.ts` — measurement scope and the specific content gaps that block detailed instructions.
- `source-index.ts` — source links and the fact that they are starting references, not approvals.

All procedure and measurement content is currently unreviewed. `sourceReferences` is intentionally empty for scripted emergency steps and draft measurement guides. Do not change a status to reviewed or attach a source unless the content has actually been checked against that source and the relevant mission/device context. Do not add treatment-specific instructions, medication doses, microgravity techniques, or diagnosis logic without appropriate approved material and review.
