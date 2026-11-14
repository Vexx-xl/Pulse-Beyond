export type ActionEvent = { id: string; at: string; kind: string; detail: string; confirmed?: boolean };
export type HelperTask = {
  id: string;
  title: string;
  assignedTo: string;
  status: "assigned" | "completed";
};
export type Incident = {
  id: string; patientId: string; patientName: string; startedAt: string; status: string;
  procedureVersion?: string;
  concern?: string;
  flow?: "general-help";
  conditionChanged: boolean; step: number; events: ActionEvent[]; helperCount: number;
  equipment: string; unableToAssess: string[]; helperTasks?: HelperTask[];
  responsiveness?: string; breathingObservation?: string; conditionChangeDetail?: string;
};
export type Assessment = { id: string; person: string; observer: string; at: string; observations: Record<string, string>; notes: string };
export type Measurement = {
  id: string;
  kind: "blood-pressure" | "pulse-ox";
  personId: string;
  personName: string;
  observer: string;
  at: string;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
  pulse?: number;
  device: string;
  quality: "recorded" | "needs-confirmation" | "unable-to-obtain";
  note: string;
  source: "manual-entry";
  simulated: boolean;
};
export type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  status: "due" | "completed" | "rescheduled" | "overdue";
  category: "wellbeing" | "measurement" | "routine" | "follow-up";
  profile: "station" | "spacecraft" | "lunar";
  fictional: true;
};
export type MissionSettings = {
  id: "mission-settings";
  profile: "station" | "spacecraft" | "lunar";
  communicationDelay: string;
  communicationStatus: "not-configured" | "available-scenario" | "delayed-scenario" | "unavailable-scenario";
};
export type WellbeingEntry = {
  id: string;
  personId: string;
  personName: string;
  at: string;
  sleepHours: number | null;
  sleepQuality: string;
  fatigue: string;
  mood: string;
  privateNote: string;
};

const DB_NAME = "crewcheck-local-v1";
const STORES = ["incidents", "assessments", "measurements", "reminders", "settings", "wellbeing"] as const;
type StoreName = typeof STORES[number];
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) { reject(new Error("IndexedDB is unavailable in this browser.")); return; }
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((name) => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" }); });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error("Could not open local storage."));
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error("Local storage upgrade is blocked by another open Pulse Beyond tab."));
    };
  });
  return dbPromise;
}
export async function readAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, "readonly").objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error || new Error("Could not read local records."));
  });
}
export async function writeRecord<T extends { id: string }>(store: StoreName, record: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    transaction.objectStore(store).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not save locally."));
    transaction.onabort = () => reject(transaction.error || new Error("Local save was interrupted."));
  });
}
export async function clearDemoData(): Promise<void> {
  const db = await openDb();
  await Promise.all(STORES.map((store) => new Promise<void>((resolve, reject) => {
    const request = db.transaction(store, "readwrite").objectStore(store).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Could not reset local records."));
  })));
}

/** Add only missing demo IDs, atomically. Never clears or replaces existing data. */
export async function addDemoRecords(data: {
  incidents: Incident[]; assessments: Assessment[]; measurements: Measurement[];
}): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["incidents", "assessments", "measurements"], "readwrite");
    let inserted = 0;
    tx.oncomplete = () => resolve(inserted);
    tx.onerror = () => reject(tx.error || new Error("Could not add demo records. No demo changes were committed."));
    tx.onabort = () => reject(tx.error || new Error("Demo loading was interrupted. No demo changes were committed."));
    for (const name of ["incidents", "assessments", "measurements"] as const) {
      const store = tx.objectStore(name);
      for (const record of data[name]) {
        const request = store.get(record.id);
        request.onsuccess = () => {
          if (request.result === undefined) {
            store.add(record);
            inserted++;
          }
        };
      }
    }
  });
}
