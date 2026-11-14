# Pulse Beyond

## Optional NASA station reference

Open **Habitat → Optional: NASA station exterior reference** for the ISS preview.
**Explore in 3D** loads the interactive renderer only when requested. Drag/pinch
or use the accessible rotation, zoom and reset buttons. There is no automatic
rotation or continuous rendering loop.

The original NASA/Ames ISS (A) model is 39,708 bytes. Its preview, local Draco
decoder and license notices bring the static reference directory to about
500 KB. No third-party viewer CDN or remote texture is required. Credits and
source links appear in the page's expandable details and `public/nasa/NOTICE.md`.
Reproduce these files with `node artifacts/crewcheck/scripts/prepare-station-assets.mjs`.

The installed production app precaches the image, model and decoder. Use
**Save for offline** online to also cache the on-demand renderer and its JS
chunks; success is shown only after the service worker confirms caching.
Offline saving is intentionally unavailable in Vite's development preview.
Browser storage eviction or clearing site data can remove cached assets.

This is an illustrative **exterior reference only**: not an interior/equipment
map, current verified configuration, medical reference or live tracker. The
app's fictional habitat zones are not assigned to NASA model geometry. Emergency
and record workflows do not depend on this viewer.

Pulse Beyond is a **tablet-first PWA** for local crew observation and factual handoff. The responsive workspace keeps primary navigation in a large, persistent tablet toolbar and uses a thumb-friendly tab bar on small screens.

Pulse Beyond is an offline-oriented training prototype for non-doctor crew: get onboard help for any urgent concern, record only observations, and prepare a factual handoff. It does not diagnose conditions or teach treatment. It is not validated medical equipment, flight-qualified software, a clinical decision system, or NASA-endorsed.

## Run in Replit

Use the Pulse Beyond web preview. The project runs through its managed Replit workflow; records are stored in the browser's IndexedDB and are not sent to the shared API or a cloud database.

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

- Implemented: fictional crew dashboard; general help-first emergency recording; timestamped local incident history; preserved legacy helper tasks; local handoff text and JSON export; observations and review; manual BP and pulse-ox record entry; three fictional mission profiles; sample equipment and routines; private local wellbeing entries; habitat overlap timeline; source index; install manifest; service-worker shell caching.
- Not implemented: source-reviewed measurement instructions; mission-approved treatment procedures; real NASA dataset excerpt; AI assistance; live devices, telemetry, external transmission, multi-device sync, clinical interpretation, or production access control.
- The source list contains the project's starting references, not claims that the cited pages were reviewed or approve a procedure.
- No clinician, crew health officer, NASA, or mission authority review is claimed. Do not use this prototype to make care decisions or delay approved emergency response.

Medical and mission text that needs team review is in [`src/content/`](./src/content/README.md), separate from page behavior.
