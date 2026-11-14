import assert from "node:assert/strict";
import test from "node:test";
import type { ActionEvent, Incident } from "@/lib/local-store";
import { applyIncidentChange, conditionObservationChanges, nextEmergencyStep } from "./scenario-logic.ts";
import { hasChestPainReported } from "./observation-logic.ts";

const baseIncident: Incident = {
  id: "incident-1",
  patientId: "mara-vale",
  patientName: "Mara Vale",
  startedAt: "2026-01-01T00:00:00.000Z",
  status: "Active",
  conditionChanged: false,
  step: 0,
  events: [{ id: "start", at: "2026-01-01T00:00:00.000Z", kind: "scenario-started", detail: "Scenario started", confirmed: true }],
  helperCount: 1,
  equipment: "",
  unableToAssess: [],
};

test("emergency acknowledgements advance one step and stop at equipment selection", () => {
  assert.equal(nextEmergencyStep(0), 1);
  assert.equal(nextEmergencyStep(2), 3);
  assert.equal(nextEmergencyStep(3), 3);
});

test("unresponsive or changed breathing records the observation and escalates", () => {
  assert.deepEqual(conditionObservationChanges("responsiveness", "Does not respond"), {
    responsiveness: "Does not respond",
    conditionChanged: true,
    step: 2,
    conditionChangeDetail: "Does not respond",
  });
  assert.deepEqual(conditionObservationChanges("breathingObservation", "Change observed"), {
    breathingObservation: "Change observed",
    conditionChanged: true,
    step: 2,
    conditionChangeDetail: "Change observed",
  });
});

test("uncertainty or no reported breathing change does not become an urgent finding", () => {
  assert.deepEqual(conditionObservationChanges("responsiveness", "Not sure"), { responsiveness: "Not sure" });
  assert.deepEqual(conditionObservationChanges("breathingObservation", "No change observed / reported"), {
    breathingObservation: "No change observed / reported",
  });
});

test("incident corrections append events without deleting prior history", () => {
  const action: ActionEvent = { id: "change-1", at: "2026-01-01T00:01:00.000Z", kind: "condition-changed", detail: "Condition changed", confirmed: true };
  const next = applyIncidentChange(baseIncident, { conditionChanged: true, step: 2 }, action);
  assert.equal(next.conditionChanged, true);
  assert.equal(next.events.length, 2);
  assert.equal(next.events[0].id, "start");
  assert.equal(next.events[1].id, "change-1");
});

test("an empty observation is safe and only an explicit report shows the emergency link", () => {
  assert.equal(hasChestPainReported(undefined), false);
  assert.equal(hasChestPainReported(""), false);
  assert.equal(hasChestPainReported("Chest pain"), true);
});
