import test from "node:test";
import assert from "node:assert/strict";
import { getReportPrompts, makeObservation, parseObservationDraft } from "./report-guide.ts";

const draft = {
  id: "test-report", report: "  I feel dizzy, not sure why.  ", person: "Not specified",
  observer: "Self" as const, answers: { onset: "After lunch", location: "Not sure" },
  stage: "review" as const, questionIndex: 0,
};
test("report questions adapt without diagnosing or changing the reported words", () => {
  assert.match(getReportPrompts("I feel dizzy")[1].label, /feeling/);
  assert.match(getReportPrompts("My arm hurts")[1].label, /discomfort/);
  assert.match(getReportPrompts("I cannot breathe")[1].label, /breathing/);
  assert.match(getReportPrompts("I feel worried")[1].label, /feelings/);
  assert.equal(getReportPrompts("Something is wrong").length, 3);
});
test("reports preserve exact words, explicit uncertainty and an unknown person", () => {
  const entry = makeObservation(draft);
  assert.equal(entry.id, draft.id);
  assert.equal(entry.observations.reported, draft.report);
  assert.equal(entry.observations.location, "Not sure");
  assert.equal(entry.person, "Not specified");
  assert.equal(entry.observer, "Self");
  assert.equal("diagnosis" in entry.observations, false);
});
test("empty words cannot be saved and unreviewed fields are not inferred", () => {
  assert.throws(() => makeObservation({ ...draft, report: "  " }));
  assert.deepEqual(Object.keys(makeObservation({ ...draft, answers: {} }).observations), ["reported"]);
});
test("draft recovery validates its shape and retains wording without truncation", () => {
  assert.equal(parseObservationDraft(JSON.parse(JSON.stringify(draft))).report, draft.report);
  assert.throws(() => parseObservationDraft({ ...draft, stage: "invented" }));
  assert.throws(() => parseObservationDraft({ ...draft, questionIndex: 500 }));
  assert.throws(() => parseObservationDraft({ ...draft, answers: { onset: true } }));
});
