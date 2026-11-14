import assert from "node:assert/strict";
import test from "node:test";
import { createVoiceSession, type Recognition, type RecognitionResult } from "./voice-session.ts";

function setup() {
  const states: string[] = [], words: string[] = [], errors: string[] = [];
  let interim = "", ended = 0, aborted = 0, stopped = 0;
  let timerId = 0;
  const timers = new Map<number, { fn: () => void; ms: number }>();
  const recognition: Recognition = {
    lang: "", continuous: false, interimResults: false,
    onstart: null, onresult: null, onerror: null, onend: null,
    start() {}, stop() { stopped++; }, abort() { aborted++; },
  };
  const session = createVoiceSession(recognition, {
    state: (s) => states.push(s), words: (s) => words.push(s),
    interim: (s) => { interim = s; }, error: (s) => errors.push(s),
    ended: () => { ended++; },
  }, {
    set(fn, ms) { timers.set(++timerId, { fn, ms }); return timerId; },
    clear(id) { timers.delete(id as number); },
  });
  return {
    recognition, session, states, words, errors, timers,
    info: () => ({ interim, ended, aborted, stopped }),
    fireTimer() { const next = [...timers.values()][0]; assert.ok(next); next.fn(); },
    result(results: Array<[string, boolean]>) {
      recognition.onresult?.({
        resultIndex: 0,
        results: results.map(([transcript, isFinal]): RecognitionResult => ({ isFinal, 0: { transcript } })),
      });
    },
  };
}

test("permission/start does not claim the service is listening; stalled startup terminates", () => {
  const s = setup();
  s.session.start();
  assert.deepEqual(s.states, ["starting"]);
  s.fireTimer();
  assert.match(s.errors[0], /did not start after permission/);
  assert.equal(s.info().aborted, 1);
  assert.equal(s.info().ended, 1);
  assert.equal(s.states.at(-1), "idle");
});

test("silent listening times out instead of staying active forever", () => {
  const s = setup();
  s.session.start(); s.recognition.onstart?.(); s.fireTimer();
  assert.match(s.errors[0], /returned no words/);
  assert.equal(s.states.at(-1), "idle");
});

test("final words append only once, partial words survive stop without a final result", () => {
  const s = setup();
  s.session.start(); s.recognition.onstart?.();
  s.result([["I feel dizzy", true], ["and tired", false]]);
  s.result([["I feel dizzy", true], ["and very tired", false]]);
  assert.deepEqual(s.words, ["I feel dizzy"]);
  assert.equal(s.info().interim, "and very tired");
  s.session.stop(); s.recognition.onend?.();
  assert.deepEqual(s.words, ["I feel dizzy", "and very tired"]);
  assert.equal(s.info().interim, "");
  assert.equal(s.info().ended, 1);
});

test("late final result replaces partial before stop completes without duplication", () => {
  const s = setup();
  s.session.start(); s.result([["my head", false]]);
  s.session.stop();
  s.result([["my head hurts", true]]);
  s.recognition.onend?.();
  assert.deepEqual(s.words, ["my head hurts"]);
});

test("stop completes even when browser never sends end; late events cannot append", () => {
  const s = setup();
  s.session.start(); s.result([["keep this", false]]);
  const lateResult = s.recognition.onresult;
  s.session.stop(); s.fireTimer();
  lateResult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "keep this" } }] });
  assert.deepEqual(s.words, ["keep this"]);
  assert.equal(s.info().ended, 1);
});

test("empty end and network errors explain the failure and release session", () => {
  const empty = setup(); empty.session.start(); empty.recognition.onend?.();
  assert.match(empty.errors[0], /without capturing words/);
  const denied = setup(); denied.session.start();
  denied.recognition.onerror?.({ error: "network" });
  assert.match(denied.errors[0], /permission alone does not provide transcription/);
  assert.equal(denied.states.at(-1), "idle");
  assert.equal(denied.timers.size, 0);
});

test("unmount aborts recognition and does not append partial text", () => {
  const s = setup();
  s.session.start(); s.result([["unfinished", false]]);
  s.session.dispose();
  assert.deepEqual(s.words, []);
  assert.equal(s.info().aborted, 1);
  assert.equal(s.timers.size, 0);
});
