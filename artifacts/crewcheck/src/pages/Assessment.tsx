import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Mic, MicOff, Save, Siren } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRecords } from "@/lib/records-context";
import { useObservationDraft } from "@/hooks/use-observation-draft";
import { useCrewVoice } from "@/hooks/use-crew-voice";
import { getReportPrompts, makeObservation } from "@/lib/report-guide";

const MAX_Q = 3;

function EmergencyLink() {
  return <Link href="/emergency" className="btn btn-danger min-h-12 w-full justify-between no-underline sm:w-auto" data-testid="link-observation-emergency"><span className="flex items-center gap-2"><Siren size={18}/> Need urgent help now</span><ArrowRight size={17}/></Link>;
}

export default function AssessmentPage() {
  const { saveAssessment, assessments } = useRecords();
  const { draft, setDraft, clearDraft, storageError } = useObservationDraft();
  const voice = useCrewVoice();
  const [, navigate] = useLocation();
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const prompts = useMemo(() => getReportPrompts(draft.report).slice(0, MAX_Q), [draft.report]);
  const stopRef = voice.stop;
  useEffect(() => { if (draft.stage !== "report" && voice.listening) stopRef(); }, [draft.stage, voice.listening, stopRef]);

  const go = (stage: typeof draft.stage, questionIndex = draft.questionIndex) => setDraft((d) => ({ ...d, stage, questionIndex }));
  const answer = (key: string, value: string) => setDraft((d) => ({ ...d, answers: { ...d.answers, [key]: value } }));
  const nextQ = () => draft.questionIndex + 1 >= prompts.length ? go("review") : go("questions", draft.questionIndex + 1);

  const startVoice = () => { if (!consent) return; voice.start((text) => setDraft((d) => ({ ...d, report: `${d.report}${d.report && !/\s$/.test(d.report) ? " " : ""}${text}` }))); };

  const save = async () => {
    setSaving(true); setSaveError("");
    try { await saveAssessment(makeObservation(draft)); setSavedId(draft.id); clearDraft(); setSaved(true); setConsent(false); }
    catch (e) { setSaveError(`Not saved. Your words are still here. ${e instanceof Error ? e.message : "Device storage failed."}`); }
    finally { setSaving(false); }
  };

  const step = { report: 1, safety: 2, questions: 3, review: 4 }[draft.stage];

  return <div className="reveal mx-auto max-w-3xl">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">Own words · step {saved ? 4 : step} of 4</p></div>
      <EmergencyLink />
    </header>
    {storageError && <p className="card mb-4 p-4 text-sm" role="alert" data-testid="status-draft-storage">Draft could not be kept on this device: {storageError}. Keep this screen open.</p>}

    {saved ? <section className="card p-6 sm:p-8" data-testid="status-observation-saved">
      <Check size={32} className="text-[hsl(var(--primary))]"/>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em]">Saved on this device</h1>
      <p className="mt-2 leading-7 text-muted-foreground">Your report is stored in your own words, ready for handoff. It is a record, not an assessment.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href={`/handoff?observation=${encodeURIComponent(savedId)}`} className="btn btn-primary no-underline" data-testid="link-saved-handoff">Open handoff</Link>
        <Link href="/review" className="btn btn-soft no-underline" data-testid="link-saved-review"><ClipboardList size={17}/> Review records</Link>
        <button className="btn btn-soft" onClick={() => setSaved(false)} data-testid="button-new-report">New report</button>
      </div>
    </section>

    : draft.stage === "report" ? <section className="card p-5 sm:p-8">
      <h1 className="text-4xl font-extrabold tracking-[-.05em]">Tell me how you feel</h1>
      <p className="mt-2 leading-7 text-muted-foreground">Use your own words. Short is fine. You can edit everything before saving.</p>
      <label className="mt-5 block"><span className="sr-only">Your report</span>
        <textarea className="field min-h-48 text-lg leading-7" value={draft.report} onChange={(e) => setDraft((d) => ({ ...d, report: e.target.value }))} placeholder="For example: my head has hurt since the last shift and I feel dizzy when I stand." data-testid="input-report"/>
      </label>
      {voice.interim && <p className="mt-2 rounded-xl border border-dashed p-3 text-sm italic text-muted-foreground" aria-live="polite" data-testid="text-voice-interim">Hearing: {voice.interim} <span className="not-italic">(added when you pause or stop; check the wording)</span></p>}
      <p className="mt-2 text-xs text-muted-foreground">Typing stays on this device and works offline. These are guided reporting prompts, not a diagnosis or safety assessment.</p>

      <div className="mt-5 rounded-2xl border p-4">
        <p className="font-bold">Speak instead (optional)</p>
        {!voice.supported ? <p className="mt-2 text-sm text-muted-foreground" data-testid="text-voice-unsupported">Voice is not available in this browser. Typing works normally.</p> : <>
          <label className="mt-3 flex min-h-12 cursor-pointer items-start gap-3 text-sm leading-6">
            <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (!e.target.checked && voice.listening) voice.stop(); }} data-testid="checkbox-voice-consent"/>
            <span>I understand this browser may send my audio to its speech provider, and voice may need an Internet connection.</span>
          </label>
          <button type="button" className={`btn mt-3 w-full sm:w-auto ${voice.listening ? "btn-primary" : "btn-soft"}`} disabled={!consent || voice.status === "stopping"} style={{ opacity: consent ? 1 : .5 }} onClick={voice.listening ? voice.stop : startVoice} data-testid="button-voice-toggle">
            {voice.status === "stopping" ? "Keeping captured words…" : voice.listening ? <><MicOff size={18}/> Stop listening</> : <><Mic size={18}/> Start speaking</>}
          </button>
          {voice.status === "starting" && <p className="mt-2 text-sm" role="status">Connecting to the browser's speech service… Allow microphone access if asked. Wait for “Listening” before speaking.</p>}
          {voice.status === "listening" && <p className="mt-2 text-sm text-[hsl(var(--primary))]" role="status">Listening in English. Speak, then tap Stop listening. Check the captured words above before continuing.</p>}
        </>}
        {voice.error && <p className="mt-2 text-sm text-destructive" role="alert" data-testid="text-voice-error">{voice.error} You can keep typing.</p>}
        <details className="mt-3 text-sm">
          <summary className="min-h-12 cursor-pointer py-3 font-bold">Voice not capturing words?</summary>
          <p className="leading-6 text-muted-foreground">Microphone permission does not guarantee the browser's online speech service is available. Tap the text box and use the microphone on your tablet keyboard instead, if available. You can edit dictated words normally.</p>
          <a className="btn btn-soft mt-3 no-underline" href={window.location.href} target="_blank" rel="noopener noreferrer" data-testid="link-voice-new-tab">Open this page in a new tab</a>
          <p className="mt-2 text-xs text-muted-foreground">The new tab has a separate draft. Keep this tab open for any words already entered.</p>
        </details>
      </div>

      <details className="mt-4 rounded-2xl border p-4" data-testid="details-context">
        <summary className="min-h-10 cursor-pointer font-bold">Who is this about? (optional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Name or role<input className="field mt-2 font-normal" value={draft.person} onChange={(e) => setDraft((d) => ({ ...d, person: e.target.value }))} placeholder="Leave blank if not needed" data-testid="input-person"/></label>
          <fieldset className="text-sm font-bold"><legend>Who is writing</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">{(["Self", "Crewmate"] as const).map((o) => <button key={o} type="button" aria-pressed={draft.observer === o} className={`btn ${draft.observer === o ? "btn-primary" : "btn-soft"}`} onClick={() => setDraft((d) => ({ ...d, observer: o }))} data-testid={`button-observer-${o.toLowerCase()}`}>{o === "Self" ? "About me" : "A crewmate"}</button>)}</div>
          </fieldset>
        </div>
      </details>

      <button className="btn btn-primary mt-6 w-full text-lg" disabled={!draft.report.trim() || voice.listening} style={{ opacity: draft.report.trim() && !voice.listening ? 1 : .5 }} onClick={() => go("safety")} data-testid="button-continue-report">Continue <ArrowRight size={18}/></button>
    </section>

    : draft.stage === "safety" ? <section className="card p-5 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-[-.04em]">Is urgent help needed right now?</h1>
      <p className="mt-2 leading-7 text-muted-foreground">If you are unsure, treat it as yes. Your words are kept as a draft.</p>
      <div className="mt-6 grid gap-3">
        <button className="btn btn-danger min-h-16 text-lg" onClick={() => navigate("/emergency")} data-testid="button-safety-help">Get help now</button>
        <button className="btn btn-danger min-h-16 text-lg" onClick={() => navigate("/emergency")} data-testid="button-safety-unsure">I'm not sure</button>
        <button className="btn btn-soft min-h-16 text-lg" onClick={() => go("questions", 0)} data-testid="button-safety-continue">Continue describing</button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Continuing does not mean the situation is safe. You can open help at any time.</p>
      <button className="btn mt-4" onClick={() => go("report")} data-testid="button-back-report"><ArrowLeft size={17}/> Back to my words</button>
    </section>

    : draft.stage === "questions" && prompts.length > 0 && prompts[Math.min(draft.questionIndex, prompts.length - 1)] ? (() => {
      const i = Math.min(draft.questionIndex, prompts.length - 1); const p = prompts[i];
      return <section className="card p-5 sm:p-8" key={p.key}>
        <p className="eyebrow">Question {i + 1} of {prompts.length}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">{p.label}</h1>
        <textarea className="field mt-5 min-h-32 text-lg" value={draft.answers[p.key] || ""} onChange={(e) => answer(p.key, e.target.value)} placeholder={p.placeholder} data-testid={`input-answer-${p.key}`}/>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button className="btn btn-soft" onClick={() => { answer(p.key, "Not sure"); nextQ(); }} data-testid="button-answer-not-sure">Not sure</button>
          <button className="btn btn-soft" onClick={nextQ} data-testid="button-answer-skip">Skip</button>
          <button className="btn btn-primary" onClick={nextQ} data-testid="button-answer-next">Next <ArrowRight size={17}/></button>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-3">
          <button className="btn" onClick={() => i === 0 ? go("safety") : go("questions", i - 1)} data-testid="button-question-back"><ArrowLeft size={17}/> Back</button>
          <button className="btn" onClick={() => go("review")} data-testid="button-review-now">Review now</button>
        </div>
      </section>;
    })()

    : <section className="card p-5 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-[-.04em]">Check your words</h1>
      <p className="mt-2 leading-7 text-muted-foreground">Edit anything. Nothing becomes a saved report until you confirm. A temporary draft stays in this browser tab.</p>
      <label className="mt-5 block text-sm font-bold">In your own words
        <textarea className="field mt-2 min-h-36 text-lg font-normal" value={draft.report} onChange={(e) => setDraft((d) => ({ ...d, report: e.target.value }))} data-testid="input-review-report"/>
      </label>
      {prompts.map((p) => <label key={p.key} className="mt-4 block text-sm font-bold">{p.label}
        <input className="field mt-2 font-normal" value={draft.answers[p.key] || ""} onChange={(e) => answer(p.key, e.target.value)} placeholder="Not answered" data-testid={`input-review-${p.key}`}/>
      </label>)}
      <p className="mt-4 text-sm text-muted-foreground" data-testid="text-review-context">{draft.observer === "Self" ? "About me" : "About a crewmate"}{draft.person ? ` · ${draft.person}` : ""}</p>
      {saveError && <p className="mt-4 rounded-xl border border-[hsl(var(--destructive))] p-3 text-sm text-destructive" role="alert" data-testid="status-save-error">{saveError}</p>}
      <button className="btn btn-primary mt-6 w-full text-lg" disabled={saving || !draft.report.trim()} onClick={save} data-testid="button-confirm-save"><Save size={18}/> {saving ? "Saving..." : "Confirm and save"}</button>
      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <button className="btn" onClick={() => go("report")} data-testid="button-review-back"><ArrowLeft size={17}/> Back to start</button>
        {confirmDiscard ? <span className="flex flex-wrap gap-2"><button className="btn btn-danger" onClick={() => { clearDraft(); setConfirmDiscard(false); }} data-testid="button-discard-confirm">Yes, discard draft</button><button className="btn btn-soft" onClick={() => setConfirmDiscard(false)} data-testid="button-discard-cancel">Keep</button></span>
          : <button className="btn" onClick={() => setConfirmDiscard(true)} data-testid="button-discard">Discard draft</button>}
      </div>
    </section>}

    <details className="mt-8 rounded-2xl border p-4" data-testid="details-history">
      <summary className="min-h-10 cursor-pointer font-bold">Earlier saved reports ({assessments.length})</summary>
      <div className="mt-3 grid gap-3">
        {assessments.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="empty-assessments">None saved on this device yet.</p>
          : assessments.slice(0, 5).map((a) => <article key={a.id} className="card p-4" data-testid={`assessment-record-${a.id}`}><div className="flex justify-between gap-3 text-sm"><strong>{a.person || a.observer}</strong><span className="text-muted-foreground">{new Date(a.at).toLocaleString()}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.observations.reported || a.notes || Object.values(a.observations).filter(Boolean).join(" · ")}</p></article>)}
        <Link href="/review" className="btn btn-soft no-underline" data-testid="link-assessment-review"><ClipboardList size={17}/> Review all records</Link>
      </div>
    </details>
  </div>;
}
