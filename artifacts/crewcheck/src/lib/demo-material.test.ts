import assert from "node:assert/strict";
import test from "node:test";
import { createDemoMaterial, demoEvidenceText } from "./demo-material.ts";
import { addDemoRecords } from "./local-store.ts";

test("demo records are stable, distinct, visibly fictional and never an active emergency", () => {
  const data = createDemoMaterial();
  assert.deepEqual(data, createDemoMaterial());
  const records = [...data.incidents, ...data.assessments, ...data.measurements];
  assert.equal(records.length, 5);
  assert.equal(new Set(records.map((r) => r.id)).size, 5);
  assert.ok(records.every((r) => r.id.startsWith("pb-demo-v1-")));
  assert.ok(data.assessments.every((r) => r.notes.includes("FICTIONAL DEMO")));
  assert.ok(data.measurements.every((r) => r.simulated && r.note.includes("FICTIONAL DEMO")));
  assert.ok(data.incidents.every((r) => r.status === "Closed" && r.events.every((e) => e.detail.includes("DEMO"))));
  assert.equal(data.assessments[1].observations["reported-detail"], "Not sure");
});

test("unavailable measurement has no fabricated numeric values", () => {
  const reading = createDemoMaterial().measurements.find((m) => m.quality === "unable-to-obtain")!;
  assert.ok(reading);
  for (const key of ["spo2", "pulse", "systolic", "diastolic"]) assert.equal(key in reading, false);
});

test("evidence preserves real-device limitations instead of claiming validation", () => {
  const evidence = demoEvidenceText();
  assert.match(evidence, /Real microphone transcription\nNot verified/);
  assert.match(evidence, /Installed PWA without network\nNot verified/);
  assert.match(evidence, /not a real network cut/);
  assert.match(evidence, /not a test of the new demo loader/);
  assert.match(evidence, /No presentation or slide deck has been created/);
});

test("loader commits once, retains existing records, is idempotent and rejects failed transactions", async () => {
  // Small transaction mock: stage writes, then apply only on completion.
  const maps = Object.fromEntries(["incidents", "assessments", "measurements"].map((name) => [name, new Map<string, unknown>()]));
  const edited = { ...createDemoMaterial().assessments[0], notes: "Existing edited record — preserve" };
  maps.assessments.set(edited.id, edited);
  maps.assessments.set("real-user-record", { id: "real-user-record", notes: "Preserve this too" });
  let fail = false;
  const db = {
    transaction(names: string[]) {
      let pending = 0, queued = false;
      const staged: Array<() => void> = [];
      const tx = {
        error: null as Error | null,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        objectStore(name: string) {
          assert.ok(names.includes(name));
          return {
            get(id: string) {
              pending++;
              const request = { result: undefined as unknown, onsuccess: null as (() => void) | null };
              queueMicrotask(() => {
                request.result = maps[name].get(id);
                request.onsuccess?.();
                pending--;
                if (pending === 0 && !queued) {
                  queued = true;
                  queueMicrotask(() => {
                    if (fail) { tx.error = new Error("Simulated storage failure"); tx.onabort?.(); }
                    else { staged.forEach((write) => write()); tx.oncomplete?.(); }
                  });
                }
              });
              return request;
            },
            add(record: { id: string }) { staged.push(() => maps[name].set(record.id, record)); },
          };
        },
      };
      return tx;
    },
  };
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalIndexedDb = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  const indexedDB = {
    open() {
      const request = { result: db, onsuccess: null as (() => void) | null };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { indexedDB } });
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: indexedDB });
  try {
    assert.equal(await addDemoRecords(createDemoMaterial()), 4);
    assert.equal(maps.assessments.get(edited.id), edited);
    assert.ok(maps.assessments.has("real-user-record"));
    assert.equal(await addDemoRecords(createDemoMaterial()), 0);
    maps.measurements.delete("pb-demo-v1-ox-mara");
    fail = true;
    await assert.rejects(addDemoRecords(createDemoMaterial()), /Simulated storage failure/);
    assert.equal(maps.measurements.has("pb-demo-v1-ox-mara"), false);
    assert.equal(maps.assessments.get(edited.id), edited);
    fail = false;
    assert.equal(await addDemoRecords(createDemoMaterial()), 1);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalIndexedDb) Object.defineProperty(globalThis, "indexedDB", originalIndexedDb);
    else Reflect.deleteProperty(globalThis, "indexedDB");
  }
});
