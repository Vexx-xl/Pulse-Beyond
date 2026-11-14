---
name: Speech verification
description: Limits of browser speech recognition verification on the tablet PWA
---
Microphone permission, API availability, and passing mocked recognition tests do not establish that a device can reach its browser's transcription service.

**Why:** The user reported that speaking produced no result after permission, despite earlier simulated speech tests passing.

**How to apply:** Keep starting and listening states distinct, terminate stalled sessions with an actionable message, and preserve captured words. State explicitly when verification used simulated events rather than a real microphone. Do not describe real speech transcription as verified without an actual device/audio result. Keep offline typing available independently.
