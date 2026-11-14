import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Info, Ruler } from "lucide-react";
import { useRecords } from "@/lib/records-context";

export default function AssessmentReviewPage() {
  const { assessments, measurements } = useRecords();
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => assessments.find((item) => item.id === selectedId) || assessments[0], [assessments, selectedId]);
  const relatedMeasurements = measurements.filter((item) => selected && item.personName === selected.person);
  const entered = selected ? Object.entries(selected.observations).filter(([, value]) => value.trim()) : [];
  const uncertain = selected ? Object.entries(selected.observations).filter(([, value]) => /not sure|unable|not available/i.test(value)) : [];
  const missing = selected ? Object.entries(selected.observations).filter(([, value]) => !value.trim()) : [];

  return <div className="reveal">
    <Link href="/assessment" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted-foreground no-underline" data-testid="link-review-back"><ArrowLeft size={17}/> Observation entry</Link>
    <header className="mb-7">
      <p className="eyebrow">Review · descriptive only</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Observation review</h1>
      <p className="mt-3 max-w-2xl leading-6 text-muted-foreground">Review saved information, uncertainty, and missing fields. This screen does not diagnose or assign a clinical risk level.</p>
    </header>
    {assessments.length === 0 ? <section className="card p-6" data-testid="empty-review"><h2 className="text-xl font-extrabold">No saved observations yet</h2><p className="mt-2 text-sm text-muted-foreground">Save an observation before opening its review.</p><Link href="/assessment" className="btn btn-primary mt-4 inline-flex no-underline" data-testid="link-review-new">Record an observation</Link></section> : <>
      <label className="mb-5 block max-w-2xl text-sm font-bold">Observation record
        <select className="field mt-2" value={selected?.id || ""} onChange={(event) => setSelectedId(event.target.value)} data-testid="select-review-observation">{assessments.map((item) => <option key={item.id} value={item.id}>{item.person} · {new Date(item.at).toLocaleString()}</option>)}</select>
      </label>
      {selected && <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <section className="card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><p className="eyebrow">Saved locally · {selected.observer}</p><h2 className="mt-1 text-xl font-extrabold">{selected.person}</h2></div><time className="text-xs text-muted-foreground">{new Date(selected.at).toLocaleString()}</time></div>
          <div className="mt-5 space-y-4">{Object.entries(selected.observations).map(([key, value]) => <div key={key} className="border-b pb-3" data-testid={`review-field-${key}`}><p className="eyebrow">{key.replaceAll("-", " ")}</p><p className="mt-1 text-sm">{value.trim() || <span className="text-muted-foreground">Not entered</span>}</p></div>)}</div>
          {selected.notes && <div className="mt-5 rounded-xl bg-[hsl(var(--muted))] p-4"><p className="eyebrow">Additional factual note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.notes}</p></div>}
        </section>
        <aside className="grid content-start gap-4">
          <section className="card p-5"><div className="flex items-center gap-2"><Info size={17}/><p className="eyebrow">Information quality</p></div><div className="mt-4 space-y-3 text-sm"><p><strong>Entered fields:</strong> {entered.length}</p><p><strong>Uncertain responses:</strong> {uncertain.length ? uncertain.map(([key]) => key.replaceAll("-", " ")).join(", ") : "None explicitly marked"}</p><p><strong>Missing fields:</strong> {missing.length ? missing.map(([key]) => key.replaceAll("-", " ")).join(", ") : "None in this entry"}</p></div><p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">Missing or uncertain information is not treated as normal. No diagnosis is inferred from absence of data.</p></section>
          <section className="card p-5"><div className="flex items-center gap-2"><Ruler size={17}/><p className="eyebrow">Related measurements</p></div>{relatedMeasurements.length ? <ul className="mt-3 space-y-3">{relatedMeasurements.map((item) => <li key={item.id} className="border-t pt-3 text-sm" data-testid={`review-measurement-${item.id}`}><strong>{item.kind === "blood-pressure" ? `Blood pressure ${item.systolic ?? "—"} / ${item.diastolic ?? "—"} mmHg` : `SpO₂ ${item.spo2 ?? "—"}%${item.pulse === undefined ? "" : ` · pulse ${item.pulse} bpm`}`}</strong><p className="mt-1 text-xs text-muted-foreground">{new Date(item.at).toLocaleString()} · {item.quality.replaceAll("-", " ")} · manual entry</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No measurements linked to this fictional crew profile.</p>}</section>
          <Link href={`/handoff?observation=${encodeURIComponent(selected.id)}`} className="btn btn-primary min-h-12 justify-center no-underline" data-testid="link-review-handoff">Prepare a factual handoff</Link>
        </aside>
      </div>}
    </>}
  </div>;
}
