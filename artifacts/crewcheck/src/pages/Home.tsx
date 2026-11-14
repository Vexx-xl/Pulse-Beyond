import { Link } from "wouter";
import { Activity, ArrowRight, ClipboardList, Gauge, Map, Settings2, ShieldAlert, Siren, UserRound, RotateCcw } from "lucide-react";
import { crew } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import { useState } from "react";

export default function Home() {
  const { incidents, assessments, persistence, reset, settings, reminders } = useRecords();
  const [resetMessage, setResetMessage] = useState("");
  const active = incidents.find((item) => item.status !== "Closed");
  return <div className="reveal">
    <section className="grid gap-8 border-b border-[hsl(var(--border))] pb-9 md:grid-cols-[1.2fr_.8fr] md:items-end">
      <div><p className="eyebrow mb-4">Mission day 084 · shared crew console</p><h1 className="max-w-[700px] text-4xl font-extrabold leading-[1.04] tracking-[-.055em] sm:text-5xl">Clear actions.<br/><span className="text-[hsl(var(--primary))]">Known facts.</span></h1><p className="mt-5 max-w-xl text-[16px] leading-7 text-muted-foreground">A calm place to record what is observed, support a crewmember, and pass on a factual handoff.</p></div>
      <div className="rounded-2xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/70"><ShieldAlert size={15}/> Scope & safety</div>
        <p className="mt-3 text-sm leading-6">Training and research prototype only. Not validated medical equipment or flight-qualified software; not NASA-endorsed. Follow your approved onboard procedures and contact onboard help.</p>
      </div>
    </section>
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      {crew.map((person) => <article key={person.id} className="card flex items-center gap-4 p-4" data-testid={`crew-profile-${person.id}`}>
        <span className={`crew-avatar ${person.color}`}>{person.initials}</span>
        <div className="min-w-0 flex-1"><h2 className="font-bold">{person.name}</h2><p className="text-sm text-muted-foreground">{person.role}</p></div>
        <span className="rounded-full bg-[hsl(155 27% 89%)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[hsl(158 32% 28%)]">Fictional</span>
      </article>)}
    </section>
    {active && <Link href="/emergency" className="mt-7 flex min-h-[82px] items-center justify-between rounded-2xl border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.07)] px-5 py-4 text-inherit no-underline" data-testid="active-incident-resume">
      <span><span className="eyebrow text-[hsl(var(--destructive))]">Active incident · resume</span><strong className="mt-1 block">{active.patientName} · chest discomfort scenario</strong></span><ArrowRight/>
    </Link>}
    <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="card overflow-hidden">
        <div className="border-b border-[hsl(var(--border))] p-5 sm:p-6"><p className="eyebrow">Start with what matters</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">How can we support the crew?</h2></div>
        <div className="grid gap-px bg-[hsl(var(--border))] sm:grid-cols-2">
          <Link href="/emergency" className="group flex min-h-[150px] flex-col justify-between bg-[hsl(var(--card))] p-5 text-inherit no-underline hover:bg-[hsl(var(--accent)/.06)]" data-testid="launch-emergency"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--destructive)/.1)] text-[hsl(var(--destructive))]"><Siren/></span><span><strong className="flex items-center justify-between">Emergency response <ArrowRight size={17}/></strong><small className="mt-1 block text-muted-foreground">Chest-pain training scenario</small></span></Link>
          <Link href="/assessment" className="group flex min-h-[150px] flex-col justify-between bg-[hsl(var(--card))] p-5 text-inherit no-underline hover:bg-[hsl(var(--primary)/.05)]" data-testid="launch-assessment"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Activity/></span><span><strong className="flex items-center justify-between">Record an observation <ArrowRight size={17}/></strong><small className="mt-1 block text-muted-foreground">Self or crewmate · no diagnosis</small></span></Link>
        </div>
      </div>
      <div className="grid gap-4">
        <Link href="/habitat" className="card flex min-h-[114px] items-center gap-4 p-5 text-inherit no-underline" data-testid="launch-habitat"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(38 48% 86%)] text-[hsl(32 45% 35%)]"><Map/></span><span className="flex-1"><span className="eyebrow">Fictional timeline</span><strong className="mt-1 block">Habitat observations</strong><small className="block text-muted-foreground">Three zones · overlap only</small></span><ArrowRight size={18}/></Link>
        <Link href="/handoff" className="card flex min-h-[114px] items-center gap-4 p-5 text-inherit no-underline" data-testid="launch-handoff"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(192 32% 86%)] text-[hsl(var(--primary))]"><ClipboardList/></span><span className="flex-1"><span className="eyebrow">For continuity</span><strong className="mt-1 block">Handoff report</strong><small className="block text-muted-foreground">Editable · facts only · offline export</small></span><ArrowRight size={18}/></Link>
        <Link href="/measurements" className="card flex min-h-[114px] items-center gap-4 p-5 text-inherit no-underline" data-testid="launch-measurements"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(185 28% 88%)] text-[hsl(var(--primary))]"><Gauge/></span><span className="flex-1"><span className="eyebrow">Manual entry only</span><strong className="mt-1 block">Measurement guides</strong><small className="block text-muted-foreground">Blood pressure · pulse oximeter</small></span><ArrowRight size={18}/></Link>
        <Link href="/mission" className="card flex min-h-[114px] items-center gap-4 p-5 text-inherit no-underline" data-testid="launch-mission"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(43 56% 83%)] text-[hsl(35 48% 30%)]"><Settings2/></span><span className="flex-1"><span className="eyebrow">Settings & reminders</span><strong className="mt-1 block">Mission & routines</strong><small className="block text-muted-foreground">{settings.profile === "station" ? "Space station" : settings.profile === "spacecraft" ? "Spacecraft" : "Lunar base"} · {reminders.filter((item) => item.profile === settings.profile && item.status !== "completed").length} open tasks</small></span><ArrowRight size={18}/></Link>
      </div>
    </section>
    <section className="mt-7 grid gap-4 sm:grid-cols-2">
      <div className="card p-5"><div className="flex items-center justify-between"><span className="eyebrow">Local activity</span><UserRound size={17} className="text-muted-foreground"/></div><div className="mt-4 flex gap-6"><div><strong className="text-3xl tracking-tight" data-testid="count-incidents">{incidents.length}</strong><span className="ml-2 text-sm text-muted-foreground">incidents</span></div><div><strong className="text-3xl tracking-tight" data-testid="count-assessments">{assessments.length}</strong><span className="ml-2 text-sm text-muted-foreground">observations</span></div></div></div>
      <div className="card flex items-center gap-4 p-5"><span className={`status-dot ${persistence.ready ? "" : "offline"}`}/><div><strong className="block text-sm">{persistence.ready ? "Device-local records" : "Local storage needs attention"}</strong><p className="mt-1 text-sm text-muted-foreground">{persistence.ready ? "Saved on this device only. No account or network required." : persistence.error || "Checking IndexedDB support."}</p></div></div>
    </section>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-5">
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">Demo reset permanently deletes this device’s saved incidents and observations. Event history is retained unless you confirm a reset.</p>
      <button className="btn btn-soft min-h-11" onClick={async () => { if (window.confirm("Reset CrewCheck demo data on this device? This deletes all saved incidents, events, and observations.")) { try { await reset(); setResetMessage("Local demo records cleared."); } catch { setResetMessage("Could not clear local records."); } } }} data-testid="button-reset-demo"><RotateCcw size={16}/> Reset demo data</button>
      {resetMessage && <span role="status" className="text-xs font-semibold" data-testid="status-reset-demo">{resetMessage}</span>}
    </div>
    <div className="mt-8 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-5 text-xs text-muted-foreground"><ShieldAlert size={14}/> Fictional sample data. This prototype does not replace approved onboard medical procedures.</div>
  </div>;
}
