# CrewCheck

CrewCheck is an offline-oriented, tablet-first training and research prototype for recording fictional crew observations, walking through a scripted chest-pain scenario, and preparing a factual handoff. It is not validated medical equipment, flight-qualified software, a clinical decision system, or NASA-endorsed.

## Run in Replit

Use the CrewCheck web preview. The project runs through its managed Replit workflow; records are stored in the browser's IndexedDB and are not sent to the shared API or a cloud database.

## Offline preparation

- Open the app online in a supported browser.
- In a production HTTPS build, wait for the status line to report that the offline shell and loaded assets are prepared.
- The service worker caches the app shell and loaded same-origin assets; it does not cache external source pages.
- IndexedDB records remain on the current browser/device. They do not sync across devices.
- The development preview does not register the service worker. A disconnected production walkthrough has not been verified yet.
- The app does not promise background timers or notifications. Reminder due states are evaluated when the app is opened.

## Local records

Incidents, observations, manual measurement entries, reminders, mission settings, and wellbeing entries are stored locally. Use the dashboard's reset control only after reviewing its confirmation; it clears all demo records from this browser. Wellbeing entries are omitted from the handoff, but the shared-device prototype has no user authentication or access control.

## Verification

Run `pnpm --filter @workspace/crewcheck run typecheck` and `pnpm --filter @workspace/crewcheck run test:unit`. The current unit tests cover deterministic emergency transitions and event-history retention. A disconnected browser walkthrough has not been run.

## Demonstration

See [DEMO.md](./DEMO.md) for a short walkthrough.

## Current scope and limitations

- Implemented: fictional crew dashboard; deterministic chest-pain scenario; timestamped local incident history; helper task assignment; local handoff text and JSON export; observations and review; manual BP and pulse-ox record entry; three fictional mission profiles; sample equipment and routines; private local wellbeing entries; habitat overlap timeline; source index; install manifest; service-worker shell caching.
- Not implemented: source-reviewed measurement instructions; mission-approved treatment procedures; real NASA dataset excerpt; AI assistance; live devices, telemetry, external transmission, multi-device sync, clinical interpretation, or production access control.
- The source list contains the project's starting references, not claims that the cited pages were reviewed or approve a procedure.
- No clinician, crew health officer, NASA, or mission authority review is claimed. Do not use this prototype to make care decisions or delay approved emergency response.

Medical and mission text that needs team review is in [`src/content/`](./src/content/README.md), separate from page behavior.
