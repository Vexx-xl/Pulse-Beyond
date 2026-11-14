import { ChevronRight, Info, MapPin, Orbit, Wind } from "lucide-react";
import { Link } from "wouter";

const zones = [
  { id: "exercise", name: "Exercise area", tag: "Zone A", time: "08:12 · 08:20 · 08:34", observation: "Earlier fictional report: Mara noted throat irritation at 08:12. Sensor ENV-DEMO-01 logged a qualitative simulated change flag at 08:20; numeric value and units unavailable, quality unverified. Later training incident: sharp chest pain reported at 08:34. Locations are manually assigned in this scripted example.", type: "Fictional reports + demo flag" },
  { id: "living", name: "Living / sleep area", tag: "Zone B", time: "Reading unavailable", observation: "No environmental reading is available for this zone. Missing data does not indicate a safe or unsafe condition.", type: "Data unavailable" },
  { id: "medical", name: "Medical / work area", tag: "Zone C", time: "No reading available", observation: "No environmental reading is available for this zone. The fictional inventory location is not sensor data.", type: "Data unavailable" },
];
export default function HabitatPage() {
  return <div className="reveal">
    <header className="mb-7"><p className="eyebrow">Environmental context · fictional sample</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Habitat timeline</h1><p className="mt-3 max-w-2xl leading-6 text-muted-foreground">A three-zone view of fictional observations. It shows possible overlap in time and location only—not a relationship, exposure, or explanation.</p><Link href="/station" className="btn btn-soft mt-4 no-underline text-sm" data-testid="link-station-orientation"><Orbit size={18}/> Optional: NASA station exterior reference <ChevronRight size={16}/></Link></header>
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] p-4 text-sm leading-6" data-testid="notice-cause-undetermined"><Info size={19} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]"/><p><strong>Possible overlap only. Cause undetermined.</strong> Environmental observations never delay patient assistance. Contact onboard help and follow approved onboard procedures first.</p></div>
    <section className="card p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Mission day 084 · fictional local records</p><h2 className="mt-1 text-xl font-extrabold">Three habitat zones</h2></div><span className="flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3 py-2 text-xs font-bold"><Wind size={15}/> No live sensor feed</span></div>
       <div className="relative grid gap-4 md:grid-cols-3">
        {zones.map((zone,index)=><article className="relative rounded-xl border bg-[hsl(var(--background))] p-4" key={zone.id} data-testid={`habitat-zone-${zone.id}`}>
          <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.09)] text-[hsl(var(--primary))]"><MapPin size={18}/></span><span className="eyebrow">{zone.tag}</span></div>
          <h3 className="mt-4 text-lg font-extrabold">{zone.name}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">{zone.time}</p>
          <div className="mt-4 border-t pt-3"><span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold uppercase tracking-wide">{zone.type}</span><p className="mt-3 text-sm leading-6 text-muted-foreground">{zone.observation}</p></div>
           <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]"/>{zone.id === "exercise" ? "Possible shared environmental concern · cause undetermined" : "Data unavailable · no inference"}</div>
          {index < zones.length - 1 && <div className="absolute -right-3 top-5 z-10 hidden h-px w-6 bg-[hsl(var(--border))] md:block"/>}
        </article>)}
      </div>
    </section>
     <section className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="card p-5"><p className="eyebrow">Evidence behind the notice</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The demo compares fictional manual location labels and timestamps in the exercise area. The sensor change is a qualitative simulation flag with no numeric value or units and unverified quality. Observations overlap in time and location only; this does not establish exposure or cause. The scenario is not connected to actual incident records or live sensors.</p></div><div className="rounded-xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><span className="block text-xs font-bold uppercase tracking-[.12em] text-[hsl(var(--primary-foreground)/.8)]">Always first</span><strong className="mt-2 block max-w-[220px] text-lg">Assist the person. Never wait on environmental context.</strong></div></section>
  </div>;
}
