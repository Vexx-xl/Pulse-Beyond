import { useState, type FormEvent } from "react";
import { Activity, ArrowRight, Check, ClipboardList, Save, Siren } from "lucide-react";
import { Link } from "wouter";
import { crew } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import type { Assessment } from "@/lib/local-store";
import { hasChestPainReported } from "@/lib/observation-logic";

const prompts = [
  ["reported", "What the person reports"], ["onset", "Symptom onset"], ["appearance", "What you observe"],
  ["breathing", "Breathing observation"], ["response", "Response / communication"], ["location", "Where they are"],
  ["recent-activity", "Recent activity"], ["context", "Other relevant context"],
];
const symptomOptions = ["Chest pain", "Breathing concern", "Injury", "Other symptom"];
export default function AssessmentPage() {
  const { saveAssessment, assessments } = useRecords();
  const [person, setPerson] = useState(crew[0].id);
  const [observer, setObserver] = useState("self");
  const [observations, setObservations] = useState<Record<string,string>>({});
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const hasChestPain = hasChestPainReported(observations.reported);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const entry: Assessment = { id: crypto.randomUUID(), person: crew.find((c) => c.id === person)?.name || person, observer: observer === "self" ? "Self" : "Crewmate", at: new Date().toISOString(), observations, notes };
    try { await saveAssessment(entry); setMessage("Observation saved on this device."); setObservations({}); setNotes(""); }
    catch { setMessage("Could not persist this observation. The device reports a storage failure."); }
  };
  return <div className="reveal">
    <header className="mb-7"><p className="eyebrow">Observe · describe · hand off</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Record an observation</h1><p className="mt-3 max-w-2xl leading-6 text-muted-foreground">Capture the person’s own words and what is directly observed. Leave anything unknown blank. This is not an assessment or diagnosis.</p></header>
    <form className="card p-5 sm:p-7" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold">Person
          <select className="field mt-2" value={person} onChange={(e)=>setPerson(e.target.value)} data-testid="select-assessment-person">{crew.map((c)=><option value={c.id} key={c.id}>{c.name} · fictional</option>)}</select>
        </label>
        <label className="text-sm font-bold">Entry mode
          <select className="field mt-2" value={observer} onChange={(e)=>setObserver(e.target.value)} data-testid="select-observer"><option value="self">Self observation</option><option value="crewmate">Observing a crewmate</option></select>
        </label>
      </div>
      <div className="mt-6 rounded-xl border bg-[hsl(var(--background))] p-4">
        <p className="text-sm font-bold">Quick symptom labels · not diagnoses</p>
        <div className="mt-3 flex flex-wrap gap-2">{symptomOptions.map((symptom) => <button key={symptom} type="button" className={symptom === "Chest pain" ? "btn btn-danger min-h-11 px-3" : "btn btn-soft min-h-11 px-3"} onClick={() => setObservations({ ...observations, reported: symptom })} data-testid={`button-symptom-${symptom.toLowerCase().replaceAll(" ", "-")}`}>{symptom === "Chest pain" && <Siren size={16}/>} {symptom}</button>)}</div>
        {hasChestPain && <Link href="/emergency" className="btn btn-danger mt-4 min-h-12 w-full justify-between no-underline" data-testid="link-chest-pain-emergency"><span className="flex items-center gap-2"><Siren size={18}/> Open emergency assistance now</span><ArrowRight size={17}/></Link>}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Do not wait for a completed form or measurement before opening the emergency pathway. Unknown details can remain blank.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {prompts.map(([key,label])=><label key={key} className="text-sm font-bold">{label}<input className="field mt-2 font-normal" value={observations[key] || ""} onChange={(e)=>setObservations({...observations,[key]:e.target.value})} placeholder="Not entered" data-testid={`input-observation-${key}`}/><details className="mt-2 text-xs font-normal"><summary className="cursor-pointer text-muted-foreground">Mark uncertainty</summary><div className="mt-2 flex flex-wrap gap-2">{["Not sure", "Unable to assess", "Not available"].map((status)=><button key={status} type="button" className="btn btn-soft min-h-9 px-2.5 text-xs" onClick={()=>setObservations({...observations,[key]:status})} data-testid={`button-observation-${key}-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</button>)}</div></details></label>)}
      </div>
      <label className="mt-4 block text-sm font-bold">Additional factual notes <textarea className="field mt-2 min-h-28 font-normal" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Optional. Use the person’s words where possible." data-testid="input-observation-notes"/></label>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Only saved entries become part of a handoff.</p><button className="btn btn-primary" type="submit" data-testid="button-save-observation"><Save size={17}/> Save observation</button></div>
      {message && <p className="mt-4 flex items-center gap-2 text-sm font-semibold" role="status" data-testid="status-assessment-save"><Check size={16}/>{message}</p>}
    </form>
    <section className="mt-7"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Activity size={17}/><h2 className="font-bold">Recent observations</h2></div><Link href="/review" className="btn btn-soft min-h-10 px-3 text-sm no-underline" data-testid="link-assessment-review"><ClipboardList size={16}/> Review saved entries</Link></div>
      {assessments.length === 0 ? <div className="card p-5 text-sm text-muted-foreground" data-testid="empty-assessments">No observations saved on this device yet.</div> : <div className="grid gap-3 sm:grid-cols-2">{assessments.slice(0,4).map((a)=><article className="card p-4" key={a.id} data-testid={`assessment-record-${a.id}`}><div className="flex justify-between gap-3"><strong>{a.person}</strong><span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span></div><p className="mt-2 text-sm text-muted-foreground">{Object.entries(a.observations).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(" · ") || "No observation fields entered"}{a.notes ? ` · ${a.notes}` : ""}</p></article>)}</div>}
    </section>
  </div>;
}
