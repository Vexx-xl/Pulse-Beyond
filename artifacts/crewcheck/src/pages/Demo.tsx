import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileJson, FlaskConical, Loader2, RotateCcw } from "lucide-react";
import { useRecords } from "@/lib/records-context";
import { createDemoMaterial, DEMO_DATE, DEMO_NOTICE, demoEvidenceText, TEST_EVIDENCE } from "@/lib/demo-material";

type LoadState = { kind: "idle" } | { kind: "working" } | { kind: "done"; added: number } | { kind: "error"; message: string };

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

function Section({ title, meta, children, testid }: { title: string; meta: string; children: ReactNode; testid: string }) {
  return <details className="card group overflow-hidden" data-testid={testid}>
    <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
      <span><span className="font-bold">{title}</span><span className="ml-3 text-sm text-muted-foreground">{meta}</span></span>
      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
    </summary>
    <div className="grid gap-3 border-t border-border px-5 py-4">{children}</div>
  </details>;
}

export default function Demo() {
  const { incidents, assessments, measurements, persistence, loadDemoMaterial } = useRecords();
  const fixtures = useMemo(() => createDemoMaterial(), []);
  const [state, setState] = useState<LoadState>({ kind: "idle" });

  const present = useMemo(() => {
    const a = new Set(assessments.map((x) => x.id));
    const m = new Set(measurements.map((x) => x.id));
    const i = new Set(incidents.map((x) => x.id));
    return {
      reports: fixtures.assessments.filter((x) => a.has(x.id)).length,
      measures: fixtures.measurements.filter((x) => m.has(x.id)).length,
      help: fixtures.incidents.filter((x) => i.has(x.id)).length,
      ids: new Set([...a, ...m, ...i]),
    };
  }, [assessments, measurements, incidents, fixtures]);
  const total = fixtures.assessments.length + fixtures.measurements.length + fixtures.incidents.length;
  const loaded = present.reports + present.measures + present.help;
  const allLoaded = loaded === total;
  const maraReady = present.ids.has("pb-demo-v1-report-mara");
  const helpReady = present.ids.has("pb-demo-v1-help-mara");

  const load = async () => {
    setState({ kind: "working" });
    try { setState({ kind: "done", added: await loadDemoMaterial() }); }
    catch (e) { setState({ kind: "error", message: e instanceof Error ? e.message : "Could not save examples on this device." }); }
  };

  const saved = (id: string) => present.ids.has(id);
  const Tag = ({ id }: { id: string }) => (
    <span data-testid={`status-fixture-${id}`} className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${saved(id) ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
      {saved(id) ? "Saved on device" : "Preview only"}
    </span>
  );

  return (
    <div className="page-wrap grid gap-5 py-6 reveal">
      <header className="grid gap-2">
        <p className="eyebrow">Demo resources · snapshot {DEMO_DATE}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Fictional examples and test evidence</h1>
        <p role="note" data-testid="text-demo-notice" className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">{DEMO_NOTICE}</p>
      </header>

      <section aria-labelledby="load-h" className="card mission-summary grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-1">
          <h2 id="load-h" className="text-xl font-bold">Load examples on this device</h2>
          <p className="text-sm text-muted-foreground">Adds only missing examples. Your existing records stay untouched. Nothing loads unless you choose to.</p>
          <p data-testid="text-fixture-count" className="mt-1 font-mono text-sm">
            <span className={allLoaded ? "text-primary" : "text-accent"}>{loaded} of {total}</span> present · {present.reports}/2 reports · {present.measures}/2 measurements · {present.help}/1 help record
          </p>
        </div>
        <div className="grid gap-2 md:justify-items-end">
          {allLoaded ? (
            <p data-testid="status-all-loaded" className="flex min-h-[48px] items-center gap-2 font-bold text-primary"><CheckCircle2 className="h-5 w-5" aria-hidden />All 5 examples saved</p>
          ) : (
            <button data-testid="button-load-demo" className="btn btn-primary" onClick={load} disabled={state.kind === "working" || !persistence.ready} aria-busy={state.kind === "working"}>
              {state.kind === "working" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : state.kind === "error" ? <RotateCcw className="h-5 w-5" aria-hidden /> : <FlaskConical className="h-5 w-5" aria-hidden />}
              {state.kind === "working" ? "Saving examples..." : state.kind === "error" ? "Try again" : loaded ? "Add missing examples" : "Load 5 examples"}
            </button>
          )}
        </div>
        <div role="status" aria-live="polite" className="md:col-span-2 empty:hidden" data-testid="status-load">
          {!persistence.ready && !persistence.error && <p className="text-sm text-muted-foreground">Opening local storage...</p>}
          {persistence.error && state.kind !== "error" && <p className="text-sm text-destructive">Local storage problem: {persistence.error}</p>}
          {state.kind === "done" && <p className="text-sm text-primary">{state.added === 0 ? "No new examples needed. Nothing was replaced." : `${state.added} example${state.added === 1 ? "" : "s"} added. Nothing was replaced.`}</p>}
          {state.kind === "error" && <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" aria-hidden />Could not finish loading: {state.message} Existing records are unchanged.</p>}
        </div>
        {(maraReady || helpReady || present.measures > 0) && (
          <nav aria-label="Open loaded examples" className="flex flex-wrap gap-2 md:col-span-2">
            {maraReady && <Link data-testid="link-review" href="/review?observation=pb-demo-v1-report-mara" className="btn btn-soft">Review reports</Link>}
            {maraReady && <Link data-testid="link-handoff-report" href="/handoff?observation=pb-demo-v1-report-mara" className="btn btn-soft">Hand off Mara's report</Link>}
            {helpReady && <Link data-testid="link-handoff-help" href="/handoff?incident=pb-demo-v1-help-mara" className="btn btn-soft">Hand off help record</Link>}
            {present.measures > 0 && <Link data-testid="link-measurements" href="/measurements" className="btn btn-soft">Measurements</Link>}
          </nav>
        )}
      </section>

      <section aria-labelledby="fx-h" className="grid gap-3">
        <h2 id="fx-h" className="eyebrow">What the examples contain</h2>
        <Section testid="details-reports" title="Own-words reports" meta="2 people">
          {fixtures.assessments.map((r) => (
            <article key={r.id} className="grid gap-2 rounded-xl bg-muted p-4" data-testid={`card-report-${r.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{r.person} <span className="font-normal text-muted-foreground">· {time(r.at)}</span></h3><Tag id={r.id} /></div>
              <blockquote className="border-l-4 border-primary pl-3 text-lg">"{r.observations.reported}"</blockquote>
              <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                <div><dt className="font-mono text-[11px] uppercase">Started</dt><dd>{r.observations.onset}</dd></div>
                <div><dt className="font-mono text-[11px] uppercase">Detail</dt><dd>{r.observations["reported-detail"]}</dd></div>
                <div><dt className="font-mono text-[11px] uppercase">Where</dt><dd>{r.observations.location}</dd></div>
              </dl>
            </article>
          ))}
        </Section>
        <Section testid="details-measurements" title="Measurements" meta="1 entered, 1 unavailable">
          {fixtures.measurements.map((m) => (
            <article key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4" data-testid={`card-measurement-${m.id}`}>
              <div>
                <h3 className="font-bold">{m.kind === "blood-pressure" ? "Blood pressure" : "Pulse oximetry"} · {m.personName}</h3>
                <p className="text-sm text-muted-foreground">{m.kind === "blood-pressure" && "systolic" in m && m.systolic ? `${m.systolic}/${m.diastolic} mmHg, invented, needs confirmation` : "No reading obtained, no value invented"} · {m.device}</p>
              </div>
              <Tag id={m.id} />
            </article>
          ))}
        </Section>
        <Section testid="details-help" title="Closed help record (rehearsal)" meta="3 scripted events">
          {fixtures.incidents.map((i) => (
            <div key={i.id} className="grid gap-3" data-testid={`card-help-${i.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{i.concern} · {i.patientName} · {i.status}</h3><Tag id={i.id} /></div>
              <p className="text-sm text-muted-foreground">Could not assess: {i.unableToAssess.join("; ")}</p>
              <ol className="grid gap-2">
                {i.events.map((e) => <li key={e.id} className="grid gap-1 rounded-lg bg-muted p-3 text-sm sm:grid-cols-[96px_1fr]"><span className="font-mono text-primary">{time(e.at)}</span><span>{e.detail}</span></li>)}
              </ol>
            </div>
          ))}
        </Section>
      </section>

      <section aria-labelledby="ev-h" className="grid gap-3">
        <h2 id="ev-h" className="eyebrow">Test evidence · static record, not live</h2>
        {TEST_EVIDENCE.map((t, n) => {
          const ok = t.status.startsWith("Passed");
          return (
            <Section key={t.title} testid={`details-evidence-${n}`} title={t.title} meta={t.status}>
              <p className="flex gap-2 text-sm leading-relaxed">
                {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />}
                {t.detail}
              </p>
            </Section>
          );
        })}
        <p className="text-sm text-muted-foreground">Not validated medical equipment, clinical decision support, flight-qualified software, or NASA-endorsed.</p>
      </section>

      <section aria-labelledby="dl-h" className="flex flex-wrap items-center gap-3">
        <h2 id="dl-h" className="sr-only">Downloads</h2>
        <button data-testid="button-download-evidence" className="btn btn-soft" onClick={() => download(`pulse-beyond-test-evidence-${DEMO_DATE}.txt`, demoEvidenceText(), "text/plain;charset=utf-8")}>
          <Download className="h-5 w-5" aria-hidden />Evidence (.txt)
        </button>
        <button data-testid="button-download-fixtures" className="btn btn-soft" onClick={() => download(`pulse-beyond-fictional-demo-fixtures-${DEMO_DATE}.json`, JSON.stringify({ notice: DEMO_NOTICE, snapshot: DEMO_DATE, ...fixtures }, null, 2), "application/json")}>
          <FileJson className="h-5 w-5" aria-hidden />Fictional fixtures (.json)
        </button>
      </section>
    </div>
  );
}
