---
name: NASA asset selection
description: Budgeting NASA 3D resources for the offline tablet app
---

Evaluate a model's decoding and viewer dependencies before selecting it for an offline feature; a small GLB download is not the complete download or runtime budget.

**Why:** The lightweight NASA ISS asset is Draco-compressed and needs a decoder even though its catalog download is tiny. An online decoder CDN would defeat the app's offline purpose.

**How to apply:** Inspect required GLB extensions before integration, account for local decoders and rendering code, and include those resources when confirming offline readiness. Keep model loading optional rather than making crew-support actions depend on it.
