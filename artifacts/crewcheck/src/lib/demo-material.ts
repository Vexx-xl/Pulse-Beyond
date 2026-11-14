import type { Assessment, Incident, Measurement } from "./local-store";

export const DEMO_NOTICE = "FICTIONAL DEMO — invented for demonstration. Not real crew data, medical evidence, or a live emergency.";
export const DEMO_DATE = "2026-11-14";
export function createDemoMaterial(): { incidents: Incident[]; assessments: Assessment[]; measurements: Measurement[] } {
  return {
    assessments: [
      {
        id: "pb-demo-v1-report-mara", person: "Mara Vale", observer: "Self",
        at: "2026-11-14T08:00:00.000Z",
        observations: {
          reported: "My head has hurt since the last shift. I feel dizzy when I stand, and I want to tell onboard support.",
          onset: "After the last shift, about 30 minutes ago.",
          "reported-detail": "Across my forehead. I am not sure what caused it.",
          location: "Fictional habitat — common area",
        },
        notes: `${DEMO_NOTICE} Example of preserving a person's words and uncertainty. No diagnosis or safety clearance.`,
      },
      {
        id: "pb-demo-v1-report-eli", person: "Eli Navarro", observer: "Self",
        at: "2026-11-14T08:20:00.000Z",
        observations: {
          reported: "I slept badly and feel worried about the next shift. I would like someone to check in with me.",
          onset: "Since waking up.",
          "reported-detail": "Not sure",
          location: "Fictional habitat — crew quarters",
        },
        notes: `${DEMO_NOTICE} Example of a non-pain concern. This is a shared observation, not a private wellbeing entry.`,
      },
    ],
    measurements: [
      {
        id: "pb-demo-v1-bp-mara", personId: "mara-vale", personName: "Mara Vale",
        observer: "Demo helper", at: "2026-11-14T08:05:00.000Z",
        kind: "blood-pressure", systolic: 118, diastolic: 76,
        device: "Fictional training cuff", quality: "needs-confirmation",
        note: `${DEMO_NOTICE} Invented numbers to demonstrate manual entry only. No clinical interpretation.`,
        source: "manual-entry", simulated: true,
      },
      {
        id: "pb-demo-v1-ox-mara", personId: "mara-vale", personName: "Mara Vale",
        observer: "Demo helper", at: "2026-11-14T08:07:00.000Z",
        kind: "pulse-ox", device: "Fictional training oximeter", quality: "unable-to-obtain",
        note: `${DEMO_NOTICE} No reading was obtained in this example; no value has been invented to fill the gap.`,
        source: "manual-entry", simulated: true,
      },
    ],
    incidents: [{
      id: "pb-demo-v1-help-mara", patientId: "mara-vale", patientName: "Mara Vale",
      startedAt: "2026-11-14T08:10:00.000Z", status: "Closed",
      flow: "general-help", concern: "DEMO — pain or sudden illness",
      step: 3, conditionChanged: false, helperCount: 1, equipment: "Fictional training cuff",
      unableToAssess: ["Cause unknown", "Pulse-ox reading unavailable"],
      responsiveness: "In this fictional example, the person speaks to the helper.",
      breathingObservation: "Not recorded",
      events: [
        { id: "pb-demo-v1-event-start", at: "2026-11-14T08:10:00.000Z", kind: "help-record-started", confirmed: true, detail: `${DEMO_NOTICE} Scripted help record opened; no call or message was placed.` },
        { id: "pb-demo-v1-event-share", at: "2026-11-14T08:12:00.000Z", kind: "demo-handoff", confirmed: true, detail: "FICTIONAL DEMO — helper rehearsed sharing entered facts. No real help was contacted." },
        { id: "pb-demo-v1-event-close", at: "2026-11-14T08:15:00.000Z", kind: "demo-closed", confirmed: true, detail: "FICTIONAL DEMO — rehearsal record closed, not a clinical outcome or safety clearance." },
      ],
    }],
  };
}

export const TEST_EVIDENCE = [
  {
    title: "Automated logic checks",
    status: "Passed · 2026-11-14",
    detail: "19 automated tests passed, plus TypeScript and service-worker syntax checks. Includes report wording, draft validation, emergency-state logic, simulated speech lifecycle, fictional fixtures and a mocked storage transaction checking no overwrite, repeat loading and failure recovery. These are software tests, not clinical validation or a real-browser demo-loader test.",
  },
  {
    title: "Earlier browser walkthrough",
    status: "Passed with simulations · 2026-11-14",
    detail: "A previous walkthrough checked report saving, reload recovery, forced save failure and handoff JSON. Speech used mocked recognition; offline used a simulated online flag, not a real network cut. This was not a test of the new demo loader.",
  },
  {
    title: "Real microphone transcription",
    status: "Not verified",
    detail: "The user reported no words after microphone permission. Recovery handling was corrected and tested with simulated events; a real device/audio result is still needed.",
  },
  {
    title: "Installed PWA without network",
    status: "Not verified",
    detail: "No full installed-tablet test with the network disconnected has been completed. Do not present offline certification or flight readiness.",
  },
] as const;

export function demoEvidenceText() {
  return [
    "PULSE BEYOND — DEMO MATERIAL AND TEST EVIDENCE",
    `Evidence snapshot: ${DEMO_DATE}. Static development record, not a live test dashboard.`,
    DEMO_NOTICE,
    "",
    "Demo set: 2 own-words reports; 2 measurement records (one unavailable); 1 closed fictional help record with 3 scripted events.",
    "Fixed example timestamps: 14 November 2026, UTC. Repeated loading adds missing examples only; existing records are not replaced.",
    "",
    ...TEST_EVIDENCE.flatMap((item) => [item.title, item.status, item.detail, ""]),
    "Reproduce automated checks: pnpm --filter @workspace/crewcheck run typecheck",
    "pnpm --filter @workspace/crewcheck run test:unit",
    "",
    "Not validated medical equipment, clinical decision support, flight-qualified software, or NASA-endorsed.",
    "No presentation or slide deck has been created.",
  ].join("\n");
}
