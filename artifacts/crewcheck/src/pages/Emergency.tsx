import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Check, PhoneCall, Users } from "lucide-react";
import { crew } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import type { ActionEvent, Incident } from "@/lib/local-store";
import { applyIncidentChange, conditionObservationChanges, nextEmergencyStep } from "@/lib/scenario-logic";
import { EMERGENCY_PROCEDURE_VERSION, EMERGENCY_STEPS } from "@/content/emergency-procedure";

const concerns = [
  "Someone does not respond",
  "Breathing looks difficult or has changed",
  "Someone is hurt or bleeding",
  "Pain or sudden illness",
  "Something else / I’m not sure",
];

function event(kind: string, detail: string): ActionEvent {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), kind, detail, confirmed: true };
}

export default function EmergencyPage() {
  const { incidents, saveIncident, persistence } = useRecords();
  const existing = incidents.find((item) => item.status !== "Closed");
  const [incident, setIncident] = useState<Incident | null>(existing || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const saving = useRef(false);
  const actionSection = useRef<HTMLElement>(null);
  const observationDetails = useRef<HTMLDetailsElement>(null);
  const current = incident?.status !== "Closed" ? incident : null;
  useEffect(() => { if (!incident && existing) setIncident(existing); }, [incident, existing]);

  const persist = async (next: Incident) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await saveIncident(next);
      setIncident(next);
    } catch {
      setError("Could not save on this device. Get onboard help anyway; do not wait for this app.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const update = (changes: Partial<Incident>, action: ActionEvent) => {
    if (current) void persist(applyIncidentChange(current, changes, action));
  };
  const start = (concern: string) => {
    setBlocked(false);
    void persist({
      id: crypto.randomUUID(), patientId: "unknown", patientName: "Person not selected",
      startedAt: new Date().toISOString(), status: "Active", concern, flow: "general-help",
      procedureVersion: EMERGENCY_PROCEDURE_VERSION, step: 0, conditionChanged: false,
      helperCount: 1, equipment: "", unableToAssess: [], helperTasks: [],
      events: [event("help-record-started", "General help record opened in the training prototype. No call was placed."),
        event("concern-reported", `Helper selected: ${concern}. No diagnosis inferred.`)],
    });
  };
  const changed = () => {
    setBlocked(false);
    update({ conditionChanged: true, step: 0 }, event("condition-changed", "Helper reported a change. Prompted to contact onboard help again."));
  };
  const recordObservation = (field: "responsiveness" | "breathingObservation", value: string) => {
    const changes = conditionObservationChanges(field, value);
    if (changes.conditionChanged) {
      setBlocked(false);
      if (observationDetails.current) observationDetails.current.open = false;
      actionSection.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    update(changes, event("crew-observation", `${field === "responsiveness" ? "Response" : "Breathing"}: ${value}.`));
  };
  const step = current ? Math.min(Math.max(0, current.step), 3) : 0;
  const instruction = EMERGENCY_STEPS[step];
  const actionLabels = ["I reached onboard help", "I’m nearby / help is with them", "I have instructions from trained help", "I shared what I know"];

  return <div className="reveal mx-auto max-w-3xl">
    <header className="mb-5">
      <p className="eyebrow text-[hsl(var(--destructive))]">Any urgent concern</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Get help now</h1>
      <p className="mt-3 text-lg text-muted-foreground">You do not need to know what is wrong.</p>
    </header>

    {!current && <div className="mb-5 rounded-2xl bg-[hsl(var(--destructive))] p-5 text-white sm:p-6" data-testid="notice-call-help">
      <div className="flex items-center gap-3"><PhoneCall size={24}/><h2 className="text-xl font-extrabold">Call onboard help now</h2></div>
      <p className="mt-2 leading-6">Use your mission’s emergency channel. Say where you are and what you can see.</p>
      <p className="mt-3 text-sm font-bold">This app does not call or message anyone.</p>
    </div>}
    <p className="mb-5 text-sm text-muted-foreground" data-testid="notice-emergency-safety">Training prototype only. Do not delay help to fill in this app. Follow your approved emergency plan.</p>
    {current && <p className="mb-4 font-bold text-[hsl(var(--destructive))]">This app does not call or message anyone.</p>}

    {!current ? <section className="card p-5 sm:p-6">
      <h2 className="text-xl font-extrabold">What can you see?</h2>
      <p className="mt-2 text-sm text-muted-foreground">Optional: choose a concern to start a local record. No diagnosis needed.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {concerns.map((concern, index) => <button key={concern} type="button" disabled={busy} onClick={() => start(concern)} className="btn btn-soft min-h-[64px] justify-between text-left disabled:opacity-50" data-testid={`button-concern-${index}`}><span>{concern}</span><ArrowRight className="shrink-0" size={18}/></button>)}
      </div>
      {incident?.status === "Closed" && <p className="mt-4 text-sm text-muted-foreground" role="status">Record closed. Its history is still available in Handoff.</p>}
      {incidents.length > 0 && <details className="mt-5 border-t pt-3"><summary className="min-h-12 cursor-pointer py-3 font-bold">Previous records ({incidents.length})</summary><ul className="space-y-3">{incidents.slice(0, 5).map(item => <li key={item.id} className="text-sm">{item.patientName} · {item.status} · {new Date(item.startedAt).toLocaleString()}</li>)}</ul><Link href="/handoff" className="btn btn-soft mt-4">Open handoff</Link></details>}
    </section> : <>
      <section ref={actionSection} className="card scroll-mt-52 p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <p className="font-bold">{current.flow === "general-help" ? current.concern : "Earlier training record"}<span className="mt-1 block text-sm font-normal text-muted-foreground">{current.patientName} · started {new Date(current.startedAt).toLocaleTimeString()}</span></p>
          <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs font-bold">Saved locally</span>
        </div>
        {current.conditionChanged && current.step === 0 && <p className="mb-4 rounded-xl bg-[hsl(var(--destructive)/.08)] p-4 font-bold text-[hsl(var(--destructive))]" role="alert">Something changed. Tell onboard help now.</p>}
        {current.step < 4 ? <div data-testid="current-instruction">
          <p className="eyebrow">One action at a time · {step + 1} of 4</p>
          <h2 className="mt-3 text-2xl font-extrabold">{instruction.title}</h2>
          <p className="mt-3 text-lg leading-7">{instruction.instruction}</p>
          <button type="button" className="btn btn-primary mt-6 min-h-14 w-full disabled:opacity-50" disabled={busy} onClick={() => { setBlocked(false); update({ step: nextEmergencyStep(step) }, event("instruction-acknowledged", actionLabels[step])); }} data-testid="button-acknowledge"><Check size={20}/>{actionLabels[step]}</button>
          <button type="button" className="btn btn-soft mt-3 min-h-12 w-full" disabled={busy} onClick={() => { setBlocked(true); update({ unableToAssess: [...new Set([...current.unableToAssess, instruction.title])] }, event("action-unavailable", `Helper could not complete: ${instruction.title}.`)); }} data-testid="button-action-unavailable">Can’t do this / not sure</button>
          {blocked && <p className="mt-4 rounded-xl bg-[hsl(var(--muted))] p-4 text-base leading-6" role="status">{step === 0 ? "Try your mission’s alternative emergency channel or ask another crewmember to contact help. This app cannot connect you." : "Tell onboard help what you cannot do. Do not put yourself in danger or attempt an action you are not trained to do."}</p>}
        </div> : <div data-testid="status-action-recorded"><h2 className="text-2xl font-extrabold">Keep following onboard help</h2><p className="mt-3 leading-7">Tell them if anything changes. You can share the facts recorded here.</p><Link href="/handoff" className="btn btn-primary mt-5 w-full">Open handoff <ArrowRight size={18}/></Link></div>}
        <button type="button" className="btn mt-5 min-h-14 w-full border border-[hsl(var(--destructive))] text-[hsl(var(--destructive))]" disabled={busy} onClick={changed} data-testid="button-condition-changed"><AlertTriangle size={20}/> Something changed — get help again</button>
      </section>

      <details ref={observationDetails} className="card mt-4 p-5" data-testid="details-incident-observations">
        <summary className="min-h-12 cursor-pointer py-3 text-lg font-bold">Add details for the handoff · optional</summary>
        <p className="mb-4 text-sm text-muted-foreground">Only record what you know. It is okay to be unsure.</p>
        <label className="block font-bold">Who needs help?<select className="field mt-2" value={current.patientId} disabled={busy} onChange={e => {
          const person = crew.find(item => item.id === e.target.value);
          update({ patientId: person?.id || "unknown", patientName: person?.name || "Person not selected" }, event("person-selected", `Person: ${person?.name || "Not sure"}.`));
        }} data-testid="select-incident-person"><option value="unknown">Not sure / not selected</option>{crew.map(person => <option key={person.id} value={person.id}>{person.name} · fictional</option>)}</select></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="font-bold">Do they respond?<select className="field mt-2" value={current.responsiveness || ""} disabled={busy} onChange={e => recordObservation("responsiveness", e.target.value)} data-testid="select-responsiveness"><option value="">Not recorded</option><option>Responds</option><option>Does not respond</option><option>Not sure</option><option>Unable to assess</option></select></label>
          <label className="font-bold">Has their breathing changed?<select className="field mt-2" value={current.breathingObservation || ""} disabled={busy} onChange={e => recordObservation("breathingObservation", e.target.value)} data-testid="select-breathing-observation"><option value="">Not recorded</option><option>No change observed / reported</option><option>Change observed</option><option>Not sure</option><option>Unable to assess</option></select></label>
        </div>
        <label className="mt-5 block font-bold">Equipment available?<select className="field mt-2" value={current.equipment} disabled={busy} onChange={e => update({ equipment: e.target.value }, event("equipment-response", `Equipment: ${e.target.value || "Not recorded"}.`))}><option value="">Not recorded</option><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="not sure">Not sure</option></select></label>
        <button type="button" className="btn btn-soft mt-5 w-full" disabled={busy} onClick={() => update({ helperCount: current.helperCount === 1 ? 2 : 1 }, event("helper-count", current.helperCount === 1 ? "Another helper is available." : "Working alone."))} data-testid="button-helper-count"><Users size={19}/>{current.helperCount === 1 ? "Another helper is available" : "I’m working alone"}</button>
        {(current.helperTasks || []).map(task => <div key={task.id} className="mt-4 border-t pt-4"><p className="font-bold">{task.title}</p><select className="field mt-2" aria-label={`Assign ${task.title}`} disabled={busy || task.status === "completed"} value={task.assignedTo} onChange={e => update({ helperTasks: current.helperTasks?.map(item => item.id === task.id ? { ...item, assignedTo: e.target.value } : item) }, event("helper-task-assigned", `${task.title}: assigned to ${e.target.value}.`))}>{[...new Set(["Self", task.assignedTo, ...crew.filter(person => person.id !== current.patientId).map(person => person.name)])].map(name => <option key={name}>{name}</option>)}</select><button type="button" className="btn btn-soft mt-2" disabled={busy || task.status === "completed"} onClick={() => update({ helperTasks: current.helperTasks?.map(item => item.id === task.id ? { ...item, status: "completed" } : item) }, event("helper-task-completed", `${task.title}: marked complete.`))}>{task.status === "completed" ? "Recorded" : "Mark done"}</button></div>)}
      </details>

      <details className="card mt-4 p-5">
        <summary className="min-h-12 cursor-pointer py-3 font-bold">Saved history & record options</summary>
        <ol className="mt-3 space-y-4">{[...current.events].reverse().map(item => <li key={item.id} className="border-l-2 pl-3 text-sm"><time className="text-muted-foreground">{new Date(item.at).toLocaleTimeString()}</time><p className="mt-1">{item.detail}</p></li>)}</ol>
        <Link href="/handoff" className="btn btn-soft mt-5 w-full">Open handoff</Link>
        <button type="button" className="btn btn-soft mt-3 w-full" disabled={busy} onClick={() => { if (window.confirm("Close this local record? This does not mean the person is safe or cancel the need for help. The history will be kept.")) update({ status: "Closed" }, event("incident-closed", "Helper closed the local record; no medical outcome inferred.")); }} data-testid="button-close-incident">Close local record</button>
        <p className="mt-4 text-xs text-muted-foreground">{instruction.reviewStatus}</p>
      </details>
    </>}
    {(error || persistence.error) && <p role="alert" className="mt-4 rounded-xl bg-[hsl(var(--destructive)/.1)] p-4 font-bold text-[hsl(var(--destructive))]" data-testid="status-persistence-error">{error || persistence.error}</p>}
  </div>;
}
