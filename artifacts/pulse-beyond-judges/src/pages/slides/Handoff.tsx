export default function Handoff() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <div className="absolute left-[6vw] top-[7vh] w-[47vw]">
        <div className="font-display text-[1.6vw] uppercase tracking-[0.12em] text-primary font-extrabold">Fictional demo · Record → Review → Handoff</div>
        <h1 className="mt-[2vh] font-display font-extrabold text-[4.2vw] leading-[0.95] tracking-tight">From a concern to a clear handoff.</h1>
        <div className="mt-[3.5vh] text-[2vw] leading-snug">Keep Mara’s words, onset, location, and uncertainty together.</div>
        <div className="mt-[1.8vh] text-[2vw] leading-snug">Record measurements manually; unavailable readings stay unavailable.</div>
        <div className="mt-[1.8vh] text-[2vw] leading-snug">Save records on this device and export a factual handoff.</div>
        <div className="mt-[3vh] text-[2.2vw] leading-snug font-bold text-accent">Intended impact: less information lost between a crew member and trained support.</div>
        <div className="mt-[2.5vh] text-[1.7vw] text-muted">No diagnosis. No automatic call. No measured health-outcome claim.</div>
      </div>
      <div className="absolute right-[5vw] top-[10vh] w-[36vw] bg-text text-bg rounded-[1.2vw] px-[2.4vw] py-[4vh]">
        <div className="text-[1.5vw] font-bold uppercase tracking-[0.1em] text-[#a3361f]">Fictional demo — not real crew data</div>
        <div className="mt-[1.5vh] font-display font-extrabold text-[2.8vw] leading-none">Handoff · Mara Vale</div>
        <div className="mt-[3vh] border-t border-bg/25 pt-[2vh] text-[1.5vw] font-bold uppercase tracking-[0.08em] text-bg/60">Own words</div>
        <div className="mt-[0.8vh] text-[2.1vw] leading-snug">“My head has hurt since the last shift.”</div>
        <div className="mt-[2.5vh] border-t border-bg/25 pt-[2vh] text-[1.5vw] font-bold uppercase tracking-[0.08em] text-bg/60">Uncertainty kept</div>
        <div className="mt-[0.8vh] text-[2.1vw] leading-snug">“I am not sure what caused it.”</div>
        <div className="mt-[2.5vh] border-t border-bg/25 pt-[2vh] text-[1.5vw] font-bold uppercase tracking-[0.08em] text-bg/60">Pulse-ox</div>
        <div className="mt-[0.8vh] text-[2.1vw] leading-snug font-bold">Unable to obtain</div>
      </div>
    </div>
  );
}
