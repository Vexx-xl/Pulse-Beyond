import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, CircleHelp, Clock3, HeartPulse, PhoneCall, RotateCcw, Users } from "lucide-react";
import { crew, scenarioNotice } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import type { ActionEvent, Incident } from "@/lib/local-store";
import { applyIncidentChange, conditionObservationChanges, nextEmergencyStep } from "@/lib/scenario-logic";
import { EMERGENCY_PROCEDURE_VERSION, EMERGENCY_STEPS } from "@/content/emergency-procedure";

function stamp() { return new Date().toISOString(); }
function event(kind: string, detail: string, confirmed = false): ActionEvent { return { id: crypto.randomUUID(), at: stamp(), kind, detail, confirmed }; }
export default function EmergencyPage() {
  const { incidents, saveIncident, persistence, settings } = useRecords();
  const existing = incidents.find((item) => item.status !== "Closed");
  const [incident, setIncident] = useState<Incident | null>(existing || null);
  const current = incident && incident.status !== "Closed" ? incident : null;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const savingRef = useRef(false);
  useEffect(() => { if (!incident && existing) setIncident(existing); }, [existing, incident]);
  useEffect(() => {
    if (!current) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [current?.id]);
  const persist = async (next: Incident) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIncident(next); setBusy(true); setError("");
    try { await saveIncident(next); } catch { setError("Local save failed. Keep this screen open; incident changes may not survive reload."); }
    finally { savingRef.current = false; setBusy(false); }
  };
  const start = async (personId: string) => {
    const person = crew.find((c) => c.id === personId)!;
    const at = stamp();
    const next: Incident = {
      id: crypto.randomUUID(), patientId: person.id, patientName: person.name, startedAt: at, status: "Active", procedureVersion: EMERGENCY_PROCEDURE_VERSION,
      conditionChanged: false, step: 0, helperCount: 1, equipment: "", unableToAssess: [],
      responsiveness: "", breathingObservation: "", conditionChangeDetail: "",
      helperTasks: [
        { id: "stay-with-patient", title: "Stay with the crewmember and relay observations", assignedTo: "Self", status: "assigned" },
        { id: "contact-support", title: "Contact onboard support using the approved pathway", assignedTo: "Self", status: "assigned" },
        { id: "locate-equipment", title: "Check the listed location and actual equipment availability", assignedTo: "Self", status: "assigned" },
      ],
      events: [event("scenario-started", "Fictional chest-pain scenario initiated; scenario content simulated and unreviewed.", true), event("symptom-reported", `${person.name} reports acute chest pain (scripted scenario).`, true)]
    };
    await persist(next);
  };
  const update = (changes: Partial<Incident>, action?: ActionEvent) => {
    if (!incident) return;
    const next = applyIncidentChange(incident, changes, action);
    void persist(next);
  };
  const acknowledge = () => {
    if (!incident) return;
    if (incident.step === 3) return;
    const nextStep = nextEmergencyStep(incident.step);
    update({ step: nextStep, status: nextStep > 3 ? "Active" : incident.status }, event("instruction-acknowledged", EMERGENCY_STEPS[incident.step]?.title || "Action acknowledged", true));
  };
  const changed = () => {
    if (!incident || incident.conditionChanged) return;
    update({ conditionChanged: true, step: 2 }, event("condition-changed", "Helper reported a change in condition; prior event history retained.", true));
  };
  const observeCondition = (field: "responsiveness" | "breathingObservation", value: string) => {
    if (!current) return;
    if (current[field] === value) return;
    const changes = conditionObservationChanges(field, value);
    const urgentChange = changes.conditionChanged === true;
    update(changes, event(urgentChange ? "urgent-condition-observation" : "crew-observation", `${field === "responsiveness" ? "Responsiveness" : "Breathing"} recorded as: ${value}.${urgentChange ? " Follow the applicable trained-crew protocol and onboard device prompts; this prototype supplies no technique." : ""}`, true));
  };
  const recordConditionDetail = (detail: string) => {
    if (!current) return;
    update({ conditionChangeDetail: detail }, event("condition-change-detail", `Condition-change detail recorded: ${detail}. Continue under the applicable trained-crew protocol.`, true));
  };
  const recordEquipment = (availability: string) => {
    if (!incident) return;
    update({ equipment: availability, step: 4 }, event("equipment-response", `Onboard monitoring equipment: ${availability}.`, true));
  };
  const unable = (item: string) => {
    if (!incident || incident.unableToAssess.includes(item)) return;
    update({ unableToAssess: [...incident.unableToAssess, item] }, event("unable-to-assess", `Unable to assess: ${item}.`, true));
  };
  const close = () => { if (incident) update({ status: "Closed" }, event("incident-closed", "Helper marked this scenario incident closed.", true)); };
  const activeStep = current && current.step < 4 ? EMERGENCY_STEPS[Math.min(current.step, 3)] : null;
  const helperOptions = current?.helperCount === 2
    ? ["Self", ...crew.filter((person) => person.id !== current?.patientId).map((person) => person.name)]
    : ["Self"];
  const updateHelperCount = () => {
    if (!current) return;
    const nextCount = current.helperCount === 1 ? 2 : 1;
    const helperTasks = nextCount === 1 ? (current.helperTasks || []).map((task) => ({ ...task, assignedTo: "Self" })) : current.helperTasks;
    update({ helperCount: nextCount, helperTasks }, event("helper-count", nextCount === 1 ? "Single-helper flow recorded; tasks returned to Self." : "Another helper is available for task assignment.", true));
  };
  const assignTask = (taskId: string, assignee: string) => {
    if (!current) return;
    const task = (current.helperTasks || []).find((item) => item.id === taskId);
    if (!task || task.status === "completed") return;
    const helperTasks = (current.helperTasks || []).map((item) => item.id === taskId ? { ...item, assignedTo: assignee } : item);
    update({ helperTasks }, event("helper-task-assigned", `"${task.title}" assigned to ${assignee}.`, true));
  };
  const completeTask = (taskId: string) => {
    if (!current) return;
    const task = (current.helperTasks || []).find((item) => item.id === taskId);
    if (!task || task.status === "completed") return;
    const helperTasks = (current.helperTasks || []).map((item) => item.id === taskId ? { ...item, status: "completed" as const } : item);
    update({ helperTasks }, event("helper-task-completed", `${task.assignedTo} marked coordination task complete: ${task.title}.`, true));
  };
  const equipmentLocation = settings.profile === "station" ? "Medical / work area (fictional)" : settings.profile === "spacecraft" ? "Medical stowage area (fictional)" : "Medical / work area (fictional)";

  return <div className="reveal">
    <Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted-foreground no-underline" data-testid="link-emergency-back"><ArrowLeft size={17}/> Crew overview</Link>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--destructive))]">Emergency response · deterministic scenario</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Chest pain</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Use the supported next action; capture only what is confirmed. In a real emergency, contact onboard medical support and follow approved procedures.</p></div><span className="rounded-full border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.1)] px-3 py-2 text-[10px] font-extrabold tracking-[.12em] text-[hsl(var(--accent))]" data-testid="badge-scenario">{scenarioNotice}</span></header>
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-4 text-sm leading-6" role="note" data-testid="notice-emergency-safety"><AlertTriangle className="mt-0.5 shrink-0 text-[hsl(var(--destructive))]" size={19}/><p><strong>Not medical equipment or flight-qualified software.</strong> No diagnosis or treatment is provided. Follow the approved onboard plan; do not wait for this prototype.</p></div>

    {!current ? <section className="card p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]"><HeartPulse/></span><div><p className="eyebrow">Rapid entry · no form</p><h2 className="text-xl font-extrabold">Who needs support?</h2></div></div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">Choose the fictional crewmember. This begins a scripted acute chest-pain scenario and saves a timestamped local incident.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{crew.map((person)=><button key={person.id} onClick={()=>void start(person.id)} disabled={busy} className="card flex min-h-[78px] items-center gap-3 p-4 text-left transition hover:border-[hsl(var(--destructive)/.5)] disabled:opacity-50" data-testid={`button-start-${person.id}`}><span className={`crew-avatar ${person.color}`}>{person.initials}</span><span><strong className="block">{person.name}</strong><small className="text-muted-foreground">Start scenario</small></span></button>)}</div>
      {incidents.length > 0 && <div className="mt-6 border-t pt-5"><p className="eyebrow">Previous event history</p><div className="mt-3 grid gap-2">{incidents.slice(0,3).map((i)=><div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[hsl(var(--muted))] p-3 text-sm" key={i.id} data-testid={`history-incident-${i.id}`}><span>{i.patientName} · {i.status}</span><span className="text-muted-foreground">{new Date(i.startedAt).toLocaleString()}</span></div>)}</div></div>}
    </section> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-5"><div className="flex items-center gap-3"><span className="crew-avatar coral">{crew.find((c)=>c.id===current.patientId)?.initials}</span><div><p className="eyebrow">Active incident · fictional</p><h2 className="text-xl font-extrabold">{current.patientName}</h2></div></div><span className="rounded-full bg-[hsl(4 56% 43% / .1)] px-3 py-1.5 text-xs font-bold text-[hsl(var(--destructive))]" data-testid="status-incident">{current.status}</span></div>
        <div className="mt-5 rounded-xl bg-[hsl(var(--muted))] p-4"><div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground"><span className="flex items-center gap-2"><Clock3 size={15}/> REPORTED · {new Date(current.events[1]?.at || current.startedAt).toLocaleTimeString()}</span><span data-testid="text-incident-elapsed">ELAPSED · {Math.floor(Math.max(0, now - new Date(current.startedAt).getTime()) / 60000)} min</span></div><p className="mt-2 font-semibold">Acute chest pain reported <span className="text-xs font-normal text-muted-foreground">(scripted; not a diagnosis)</span></p></div>
        {current.conditionChanged && <div className="mt-4 rounded-xl border border-[hsl(var(--accent)/.38)] bg-[hsl(var(--accent)/.08)] p-4" role="status" data-testid="status-condition-changed"><strong className="text-[hsl(var(--accent))]">Condition change recorded</strong><p className="mt-1 text-sm">Continue with applicable onboard trained-crew protocol and available device prompts. This prototype supplies no resuscitation technique. Previous event history is preserved.</p>{!current.conditionChangeDetail && <label className="mt-3 block text-sm font-semibold">Optional detail<select className="field mt-2" value="" onChange={(e)=>e.target.value && recordConditionDetail(e.target.value)} data-testid="select-condition-detail"><option value="">Not recorded</option><option>Unresponsive reported</option><option>Breathing changed</option><option>Other / not sure</option><option>Unable to assess</option></select></label>}{current.conditionChangeDetail && <p className="mt-2 text-sm">Detail recorded: {current.conditionChangeDetail}</p>}</div>}
        {activeStep ? <div className="mt-6 border-l-[3px] border-[hsl(var(--primary))] pl-4 sm:pl-5" data-testid="current-instruction">
          <p className="eyebrow">Next supported action · {current.step + 1} of 4</p><h3 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">{activeStep.title}</h3><p className="mt-3 max-w-xl text-base leading-7">{activeStep.instruction}</p>
          <details className="mt-4 rounded-lg bg-[hsl(var(--muted))] p-3 text-xs leading-5"><summary className="cursor-pointer font-bold">Applicability and review status</summary><div className="mt-2 space-y-2 text-muted-foreground"><p>{activeStep.applicability}</p><p><strong>Expected record:</strong> {activeStep.expectedObservation}</p><p><strong>Equipment:</strong> {activeStep.equipmentRequirements}</p><p><strong>Alternative:</strong> {activeStep.supportedAlternatives}</p><p><strong>Review:</strong> {activeStep.reviewStatus}</p></div></details>
          {current.step === 3 ? <div className="mt-5 flex flex-wrap gap-3"><button className="btn btn-primary" onClick={()=>recordEquipment("available")} data-testid="button-equipment-available"><Check size={17}/> Available</button><button className="btn btn-soft" onClick={()=>recordEquipment("unavailable")} data-testid="button-equipment-unavailable">Equipment unavailable</button></div> : <button className="btn btn-primary mt-5" onClick={acknowledge} data-testid="button-acknowledge"><Check size={17}/>{current.step === 0 ? "I contacted onboard medical support" : current.step === 1 ? "I am with the crewmember" : "I reviewed the applicable protocol"}<ChevronRight size={17}/></button>}
          {current.step >= 2 && <p className="mt-3 text-xs text-muted-foreground">This is a process reminder, not a medical instruction.</p>}
        </div> : <div className="mt-6 rounded-xl bg-[hsl(155 27% 89%)] p-4 text-sm" data-testid="status-action-recorded"><strong>Device response recorded: {current.equipment}.</strong><p className="mt-1">Continue only under the approved onboard plan. This prototype provides no treatment guidance.</p></div>}
        {current.equipment === "unavailable" && <p className="mt-3 rounded-lg bg-[hsl(var(--muted))] p-3 text-sm" data-testid="text-equipment-unavailable">Equipment unavailable was recorded. Do not substitute unapproved equipment or procedures.</p>}
        <section className="mt-6 rounded-xl border bg-[hsl(var(--background))] p-4" aria-label="Record responsiveness and breathing observations" data-testid="section-condition-observations">
          <div className="mb-3"><p className="eyebrow">Optional observation capture</p><p className="mt-1 text-xs text-muted-foreground">Record what is observed or reported; do not delay the first support prompt.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Responsiveness
              <select className="field mt-2" value={current.responsiveness || ""} onChange={(e)=>e.target.value && observeCondition("responsiveness",e.target.value)} data-testid="select-responsiveness"><option value="">Not recorded</option><option>Responds</option><option>Does not respond</option><option>Not sure</option><option>Unable to assess</option></select>
            </label>
            <label className="text-sm font-semibold">Breathing observation
              <select className="field mt-2" value={current.breathingObservation || ""} onChange={(e)=>e.target.value && observeCondition("breathingObservation",e.target.value)} data-testid="select-breathing-observation"><option value="">Not recorded</option><option>No change observed / reported</option><option>Change observed</option><option>Not sure</option><option>Unable to assess</option></select>
            </label>
          </div>
          {(current.responsiveness || current.breathingObservation) && <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Recorded: responsiveness {current.responsiveness || "not assessed"} · breathing {current.breathingObservation || "not assessed"}. No normal reading clears an urgent symptom.</p>}
        </section>
        {current.step >= 2 && <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="btn btn-soft justify-start" onClick={()=>unable("condition details")} data-testid="button-unable-condition"><CircleHelp size={17}/> Unable to assess details</button>
          <button className="btn btn-soft justify-start" onClick={()=>unable("device readings")} data-testid="button-unable-device"><CircleHelp size={17}/> Unable to assess device</button>
        </div>}
        <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">
          <button className="btn min-h-11 border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--card))] text-[hsl(var(--destructive))]" onClick={changed} disabled={current.conditionChanged} data-testid="button-condition-changed"><AlertTriangle size={17}/> Condition changed</button>
          <button className="btn btn-soft min-h-11" onClick={updateHelperCount} data-testid="button-helper-count"><Users size={17}/>{current.helperCount === 1 ? "Another helper available" : "Working alone"}</button>
          <Link href="/handoff" className="btn btn-soft min-h-11 no-underline" data-testid="link-incident-handoff"><PhoneCall size={17}/> Prepare handoff</Link>
        </div>
      </section>
      <aside className="grid content-start gap-4">
        <section className="card p-5"><p className="eyebrow">Fictional equipment location</p><p className="mt-2 text-sm font-semibold">{equipmentLocation}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Confirm actual stock onboard. The location shown is a sample only.</p><p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">Communication scenario: {settings.communicationStatus.replaceAll("-", " ")}{settings.communicationDelay ? ` · configured delay: ${settings.communicationDelay}` : " · delay not configured"}. No live transmission is implemented.</p></section>
        <section className="card p-5"><div className="flex items-center justify-between gap-2"><p className="eyebrow">Crew coordination</p><span className="text-xs text-muted-foreground">{current.helperCount === 1 ? "Single helper" : "Additional helper available"}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Coordination tasks only; marking one complete does not confirm a medical procedure.</p><div className="mt-4 space-y-3">{(current.helperTasks || []).map((task) => <div key={task.id} className="border-t pt-3" data-testid={`helper-task-${task.id}`}><p className="text-sm font-semibold">{task.title}</p><div className="mt-2 flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`assign-${task.id}`}>Assign {task.title}</label><select id={`assign-${task.id}`} className="field min-h-10 flex-1 py-2 text-sm" value={task.assignedTo} onChange={(e)=>assignTask(task.id,e.target.value)} disabled={task.status === "completed"} data-testid={`select-helper-${task.id}`}>{helperOptions.map((name)=><option key={name}>{name}</option>)}</select><button className="btn btn-soft min-h-10 px-3 text-xs" onClick={()=>completeTask(task.id)} disabled={task.status === "completed"} data-testid={`button-complete-helper-${task.id}`}>{task.status === "completed" ? "Recorded" : "Mark done"}</button></div><p className="mt-1 text-[11px] text-muted-foreground">{task.status === "completed" ? "Coordination task recorded complete" : `Assigned to ${task.assignedTo}`}</p></div>)}</div></section>
        <section className="card p-5"><p className="eyebrow">Confirmed responses</p><div className="mt-3 space-y-3 text-sm">
          <div><span className="font-bold">Equipment</span><p className="text-muted-foreground" data-testid="text-equipment-state">{current.equipment || "Not yet recorded"}</p></div>
          <div><span className="font-bold">Unable to assess</span><p className="text-muted-foreground" data-testid="text-unable-state">{current.unableToAssess.join(", ") || "None recorded"}</p></div>
          <div><span className="font-bold">Helper flow</span><p className="text-muted-foreground" data-testid="text-helper-state">{current.helperCount === 1 ? "Single helper" : "Additional helper available"}</p></div>
        </div></section>
        <section className="card p-5"><div className="flex items-center justify-between"><p className="eyebrow">Event history</p><span className="text-xs text-muted-foreground">{current.events.length} entries</span></div><ol className="mt-4 space-y-4">{[...current.events].reverse().map((item)=><li key={item.id} className="relative border-l border-[hsl(var(--border))] pl-4" data-testid={`event-${item.id}`}><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]"/><time className="block font-mono text-[10px] text-muted-foreground">{new Date(item.at).toLocaleTimeString()}</time><strong className="mt-1 block text-xs">{item.kind.replaceAll("-", " ")}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></li>)}</ol></section>
        <button className="btn btn-soft w-full" onClick={close} data-testid="button-close-incident"><RotateCcw size={16}/> Close scenario incident</button>
      </aside>
    </div>}
     <p className="mt-4 text-xs text-muted-foreground">Elapsed time is calculated from the saved start timestamp while this screen is open; no background timer is promised.</p>
     {(error || (!persistence.ready && persistence.error)) && <p role="alert" className="mt-4 rounded-xl bg-[hsl(var(--destructive)/.1)] p-4 text-sm font-semibold text-[hsl(var(--destructive))]" data-testid="status-persistence-error">{error || persistence.error}</p>}
    {!current && incident?.status === "Closed" && <p className="mt-5 rounded-xl bg-[hsl(var(--muted))] p-4 text-sm" data-testid="status-closed">Scenario incident closed. Its event history remains available in the handoff.</p>}
  </div>;
}
