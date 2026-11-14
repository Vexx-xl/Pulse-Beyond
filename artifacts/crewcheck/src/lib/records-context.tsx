import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearDemoData, readAll, writeRecord, type Assessment, type Incident, type Measurement, type MissionSettings, type Reminder, type WellbeingEntry } from "@/lib/local-store";

type Persistence = { ready: boolean; error: string };
type ContextValue = {
  incidents: Incident[]; assessments: Assessment[]; persistence: Persistence;
  measurements: Measurement[]; reminders: Reminder[]; settings: MissionSettings;
  wellbeing: WellbeingEntry[];
  saveIncident: (incident: Incident) => Promise<void>;
  saveAssessment: (assessment: Assessment) => Promise<void>;
  saveMeasurement: (measurement: Measurement) => Promise<void>;
  saveReminder: (reminder: Reminder) => Promise<void>;
  saveSettings: (settings: MissionSettings) => Promise<void>;
  saveWellbeing: (entry: WellbeingEntry) => Promise<void>;
  reset: () => Promise<void>;
};
const RecordsContext = createContext<ContextValue | null>(null);
export function RecordsProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const defaultSettings: MissionSettings = { id: "mission-settings", profile: "station", communicationDelay: "", communicationStatus: "not-configured" };
  const [settings, setSettings] = useState<MissionSettings>(defaultSettings);
  const [wellbeing, setWellbeing] = useState<WellbeingEntry[]>([]);
  const [persistence, setPersistence] = useState<Persistence>({ ready: false, error: "" });
  useEffect(() => {
    let alive = true;
    Promise.all([
      readAll<Incident>("incidents"),
      readAll<Assessment>("assessments"),
      readAll<Measurement>("measurements"),
      readAll<Reminder>("reminders"),
      readAll<MissionSettings>("settings"),
      readAll<WellbeingEntry>("wellbeing"),
    ]).then(async ([i,a,m,r,s,w]) => {
      const currentSettings: MissionSettings = s[0] ? { ...defaultSettings, ...s[0] } : defaultSettings;
      if (!s[0]) await writeRecord("settings", currentSettings);
      if (alive) {
        setIncidents(i.sort((x,y) => y.startedAt.localeCompare(x.startedAt)));
        setAssessments(a.sort((x,y) => y.at.localeCompare(x.at)));
        setMeasurements(m.sort((x,y) => y.at.localeCompare(x.at)));
        setReminders(r.sort((x,y) => x.dueAt.localeCompare(y.dueAt)));
        setSettings(currentSettings);
        setWellbeing(w.sort((x,y) => y.at.localeCompare(x.at)));
        setPersistence({ ready: true, error: "" });
      }
    }).catch((error: unknown) => { if (alive) setPersistence({ ready: false, error: error instanceof Error ? error.message : "Local persistence is unavailable." }); });
    return () => { alive = false; };
  }, []);
  const saveIncident = async (incident: Incident) => {
    try { await writeRecord("incidents", incident); setIncidents((items) => [incident, ...items.filter((item) => item.id !== incident.id)].sort((a,b) => b.startedAt.localeCompare(a.startedAt))); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save incident." }); throw error; }
  };
  const saveAssessment = async (assessment: Assessment) => {
    try { await writeRecord("assessments", assessment); setAssessments((items) => [assessment, ...items.filter((item) => item.id !== assessment.id)]); setPersistence({ ready: true, error: "" }); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save observation." }); throw error; }
  };
  const saveMeasurement = async (measurement: Measurement) => {
    try { await writeRecord("measurements", measurement); setMeasurements((items) => [measurement, ...items.filter((item) => item.id !== measurement.id)].sort((a,b) => b.at.localeCompare(a.at))); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save measurement." }); throw error; }
  };
  const saveReminder = async (reminder: Reminder) => {
    try { await writeRecord("reminders", reminder); setReminders((items) => [reminder, ...items.filter((item) => item.id !== reminder.id)].sort((a,b) => a.dueAt.localeCompare(b.dueAt))); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save reminder." }); throw error; }
  };
  const saveSettings = async (next: MissionSettings) => {
    try { await writeRecord("settings", next); setSettings(next); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save mission settings." }); throw error; }
  };
  const saveWellbeing = async (entry: WellbeingEntry) => {
    try { await writeRecord("wellbeing", entry); setWellbeing((items) => [entry, ...items.filter((item) => item.id !== entry.id)].sort((a,b) => b.at.localeCompare(a.at))); }
    catch (error) { setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not save private wellbeing entry." }); throw error; }
  };
  const reset = async () => {
    try {
      await clearDemoData();
      setIncidents([]); setAssessments([]); setMeasurements([]); setReminders([]); setWellbeing([]);
      const defaults: MissionSettings = { id: "mission-settings", profile: "station", communicationDelay: "", communicationStatus: "not-configured" };
      await writeRecord("settings", defaults); setSettings(defaults);
    }
    catch (error) {
      setPersistence({ ready: false, error: error instanceof Error ? error.message : "Could not clear local records." });
      throw error;
    }
  };
  const value = useMemo(() => ({ incidents, assessments, measurements, reminders, settings, wellbeing, persistence, saveIncident, saveAssessment, saveMeasurement, saveReminder, saveSettings, saveWellbeing, reset }), [incidents, assessments, measurements, reminders, settings, wellbeing, persistence]);
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}
export function useRecords() {
  const value = useContext(RecordsContext);
  if (!value) throw new Error("useRecords must be used inside RecordsProvider");
  return value;
}
