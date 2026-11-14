import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, Download, FileJson, Info } from "lucide-react";
import { useRecords } from "@/lib/records-context";
import { EMERGENCY_CONTENT_REVIEW, EMERGENCY_PROCEDURE_VERSION } from "@/content/emergency-procedure";

export default function HandoffPage() {
  const { incidents, assessments, measurements } = useRecords();
  const [selected, setSelected] = useState(() => {
    const observation = new URLSearchParams(window.location.search).get("observation");
    return observation ? `observation:${observation}` : new URLSearchParams(window.location.search).get("incident") || "";
  });
  const [report, setReport] = useState("");
  const [copied, setCopied] = useState("");
  const incident = selected.startsWith("observation:") ? undefined : incidents.find((i) => i.id === selected) || incidents[0];
  const observation = selected.startsWith("observation:")
    ? assessments.find((a) => a.id === selected.slice("observation:".length))
    : !incident ? assessments[0] : undefined;
  const related = useMemo(() => observation ? [observation] : assessments.filter((a) => incident && incident.patientId !== "unknown" && a.person === incident.patientName), [assessments, incident, observation]);
  const relatedMeasurements = useMemo(() => measurements.filter((item) => incident && item.personId === incident.patientId), [measurements, incident]);
  const generated = useMemo(() => {
    if (!incident) return observation ? [
      "PULSE BEYOND · OWN-WORDS HANDOFF (training prototype)",
      "Not validated medical equipment or flight-qualified software. Not NASA-endorsed.",
      "",
      `Person as entered: ${observation.person}`,
      `Reported by: ${observation.observer}`,
      `Saved: ${new Date(observation.at).toLocaleString()}`,
      "",
      ...Object.entries(observation.observations).map(([key, value]) => `${key.replaceAll("-", " ")}: ${value}`),
      observation.notes ? `Entry note: ${observation.notes}` : "",
      "",
      "No emergency incident is linked to this report. No diagnosis or safety clearance is inferred.",
      "Contact onboard support and follow approved procedures. This app does not call or message anyone.",
    ].join("\n") : "No saved report or incident has been selected on this device.";
    const confirmedEvents = incident.events.filter((item) => item.confirmed);
    return [
      "PULSE BEYOND · LOCAL HANDOFF (training prototype)",
      "Not validated medical equipment or flight-qualified software. Not NASA-endorsed.",
      "",
      `Person: ${incident.patientName}${incident.patientId === "unknown" ? " (identity not entered)" : " (fictional sample profile)"}`,
      `Concern selected by helper: ${incident.concern || "Not entered; see original event history"}`,
      `Incident started: ${new Date(incident.startedAt).toLocaleString()}`,
      `Status: ${incident.status}`,
      `Procedure content version: ${incident.procedureVersion || EMERGENCY_PROCEDURE_VERSION}`,
      `Procedure content review: ${EMERGENCY_CONTENT_REVIEW}`,
      "Procedure source references attached: None",
      `Condition change reported: ${incident.conditionChanged ? "Yes" : "Not reported"}`,
      `Responsiveness observation: ${incident.responsiveness || "Not recorded"}`,
      `Breathing observation: ${incident.breathingObservation || "Not recorded"}`,
      `Condition-change detail: ${incident.conditionChangeDetail || "Not recorded"}`,
      `Monitoring equipment: ${incident.equipment || "Not recorded"}`,
      `Unable to assess: ${incident.unableToAssess.join(", ") || "Not recorded"}`,
      `Helper flow: ${incident.events.some((item) => item.kind === "helper-count") ? (incident.helperCount === 1 ? "Single helper" : "Additional helper available") : "Not recorded"}`,
      "Crew coordination tasks:",
      ...(incident.helperTasks?.length ? incident.helperTasks.map((task) => `- ${task.title} · assigned to ${task.assignedTo} · ${task.status}`) : ["- No task assignment details recorded."]),
      "",
      "Confirmed / entered event history:",
      ...(confirmedEvents.length ? confirmedEvents.map((item) => `- ${new Date(item.at).toLocaleString()} · ${item.detail}`) : ["- No confirmed event details entered."]),
      "",
      "Saved observations:",
      ...(related.length ? related.map((a) => `- ${new Date(a.at).toLocaleString()} · ${a.observer} observation${Object.entries(a.observations).filter(([,v])=>v).map(([k,v])=>`; ${k}: ${v}`).join("")}${a.notes ? `; notes: ${a.notes}` : ""}`) : ["- None saved for this person."]),
      "",
      "Measurements:",
      ...(relatedMeasurements.length ? relatedMeasurements.map((item) => `- ${new Date(item.at).toLocaleString()} · ${item.kind === "blood-pressure" ? `Blood pressure ${item.systolic ?? "not entered"}/${item.diastolic ?? "not entered"} mmHg` : `Pulse oximeter SpO₂ ${item.spo2 ?? "not entered"}%${item.pulse === undefined ? "" : `, pulse ${item.pulse} bpm`}`} · ${item.quality.replaceAll("-", " ")} · ${item.device} · ${item.observer} · ${item.simulated ? "fictional sample" : "manual entry"}${item.note ? ` · note: ${item.note}` : ""}`) : ["- None saved for this person."]),
      "",
      "Unknown details are not inferred. Follow approved onboard procedures and contact onboard medical support."
    ].join("\n");
  }, [incident, related, relatedMeasurements, observation]);
  useEffect(() => { setReport(generated); }, [generated]);
  const structured = useMemo(() => incident ? {
    schema: "crewcheck-handoff-v1",
    app: "Pulse Beyond",
    prototype: true,
    disclaimer: "Training prototype only; not validated medical equipment or flight-qualified software; not NASA-endorsed.",
    incident: {
      id: incident.id, person: incident.patientName, fictional: true, startedAt: incident.startedAt, status: incident.status,
      concern: incident.concern || null,
      flow: incident.flow || "legacy-training-record",
      procedureVersion: incident.procedureVersion || EMERGENCY_PROCEDURE_VERSION,
      procedureReviewStatus: EMERGENCY_CONTENT_REVIEW,
      sourceReferences: [],
      conditionChanged: incident.conditionChanged ? true : null, responsiveness: incident.responsiveness || null,
      breathingObservation: incident.breathingObservation || null, conditionChangeDetail: incident.conditionChangeDetail || null,
      equipment: incident.equipment || null,
      unableToAssess: incident.unableToAssess,
      helperFlow: incident.events.some((item) => item.kind === "helper-count") ? (incident.helperCount === 1 ? "single-helper" : "additional-helper") : null,
       helperTasks: (incident.helperTasks || []).map(({ id, title, assignedTo, status }) => ({ id, title, assignedTo, status })),
      confirmedEvents: incident.events.filter((event) => event.confirmed).map(({ at, kind, detail }) => ({ at, kind, detail }))
    },
    observations: related.map(({ person, observer, at, observations, notes }) => ({ person, observer, at, observations, notes })),
    measurements: relatedMeasurements.map(({ kind, personId, personName, observer, at, systolic, diastolic, spo2, pulse, device, quality, note, source, simulated }) => ({ kind, personId, personName, observer, at, systolic: systolic ?? null, diastolic: diastolic ?? null, spo2: spo2 ?? null, pulse: pulse ?? null, device, quality, note, source, simulated })),
    unknowns: ["No diagnosis or cause inferred", "No treatment guidance generated"]
  } : {
    schema: "crewcheck-handoff-v1", app: "Pulse Beyond", prototype: true, incident: null,
    observations: related.map(({ person, observer, at, observations, notes }) => ({ person, observer, at, observations, notes })),
    measurements: [],
    unknowns: ["No emergency incident is linked", "No diagnosis or safety clearance inferred"],
  }, [incident, related, relatedMeasurements]);
  const copy = async (text: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
    } catch {
      const area = document.createElement("textarea"); area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select();
      const ok = document.execCommand("copy"); area.remove(); setCopied(ok ? kind : "failed");
    }
    window.setTimeout(() => setCopied(""), 2400);
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(structured, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `pulse-beyond-handoff-${incident?.id || observation?.id || "empty"}.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="reveal">
    <header className="mb-7"><p className="eyebrow">Continuity · local export</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Handoff</h1><p className="mt-3 max-w-2xl leading-6 text-muted-foreground">A factual template built from entered and confirmed information only. Review and edit before sharing. Copy and JSON export work without a network connection.</p></header>
    <div className="mb-5 flex items-start gap-3 rounded-xl bg-[hsl(var(--primary)/.08)] p-4 text-sm leading-6" data-testid="notice-handoff-scope"><Info size={18} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]"/><p>Unknown values stay unknown. No diagnoses, causes, thresholds, or treatments are generated.</p></div>
    {incidents.length + assessments.length > 0 && <label className="mb-4 block text-sm font-bold">Source record
      <select value={selected || incident?.id || (observation ? `observation:${observation.id}` : "")} onChange={(e)=>setSelected(e.target.value)} className="field mt-2 max-w-lg" data-testid="select-handoff-incident">
        {incidents.map((i)=><option key={i.id} value={i.id}>Help record · {i.patientName} · {new Date(i.startedAt).toLocaleString()} · {i.status}</option>)}
        {assessments.map((a)=><option key={a.id} value={`observation:${a.id}`}>Own-words report · {a.person} · {new Date(a.at).toLocaleString()}</option>)}
      </select>
    </label>}
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <section className="card p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Editable report</p><h2 className="mt-1 text-lg font-extrabold">Generated from local record</h2></div><div className="flex gap-2"><button className="btn btn-soft min-h-11 px-3" onClick={()=>void copy(report,"report")} data-testid="button-copy-handoff"><ClipboardCopy size={16}/>{copied==="report" ? "Copied" : "Copy"}</button><button className="btn btn-primary min-h-11 px-3" onClick={downloadJson} data-testid="button-export-json"><Download size={16}/> JSON</button></div></div>
        <textarea className="field min-h-[460px] resize-y font-mono text-xs leading-6" value={report} onChange={(e)=>setReport(e.target.value)} aria-label="Editable handoff report" data-testid="textarea-handoff-report"/>
        <p className="mt-3 text-xs text-muted-foreground" role="status" data-testid="status-copy">{copied === "failed" ? "Copy could not be completed; select and copy the text manually." : copied ? "Copied to clipboard." : "Changes here are for export only; original event history remains unchanged."}</p>
      </section>
      <aside className="grid content-start gap-4">
        <section className="card p-5"><div className="flex items-center gap-2"><FileJson size={18} className="text-[hsl(var(--primary))]"/><h2 className="font-bold">Structured export</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Download JSON includes confirmed incident events and saved observations. The text report is editable; JSON reflects the stored record.</p><button className="btn btn-soft mt-4 w-full" onClick={downloadJson} data-testid="button-download-structured"><Download size={16}/> Download structured JSON</button></section>
        <section className="card p-5"><p className="eyebrow">Included fields</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li className="flex gap-2"><Check size={16} className="text-[hsl(var(--primary))]"/> Timestamped confirmed events</li><li className="flex gap-2"><Check size={16} className="text-[hsl(var(--primary))]"/> Equipment and unable-to-assess responses</li><li className="flex gap-2"><Check size={16} className="text-[hsl(var(--primary))]"/> Saved observations and manual measurements</li><li className="flex gap-2"><Check size={16} className="text-[hsl(var(--primary))]"/> Private wellbeing notes are excluded</li><li className="flex gap-2"><Check size={16} className="text-[hsl(var(--primary))]"/> Explicitly unknown details stay blank</li></ul></section>
        {!incident && !observation && <p className="card p-4 text-sm text-muted-foreground" data-testid="empty-handoff">Save a report or start a help record to prepare a handoff.</p>}
      </aside>
    </div>
  </div>;
}
