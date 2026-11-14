import logo from "@assets/Pulse_Beyond_1794658541006.png";

export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <div className="absolute right-0 top-0 h-screen w-[48vw] bg-navy2" />
      <img src={logo} crossOrigin="anonymous" alt="Pulse Beyond astronaut logo" className="absolute right-[4vw] top-[8vh] h-[84vh] w-[42vw] object-contain" />
      <div className="absolute left-[6vw] top-[10vh] w-[46vw]">
        <div className="font-display text-[1.6vw] uppercase tracking-[0.14em] text-accent">NASA Space Apps Challenge 2026</div>
        <h1 className="mt-[3vh] font-display font-extrabold text-[8.5vw] leading-[0.88] tracking-tight">Pulse <span className="text-accent">Beyond</span></h1>
        <div className="mt-[3vh] h-[5vh] w-[34vw] text-primary"><svg viewBox="0 0 400 40" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="M0 28 L150 28 L170 28 L185 6 L198 38 L212 18 L222 28 L400 28" /></svg></div>
        <p className="mt-[3vh] font-display font-extrabold text-[2.9vw] leading-[1.1] [text-wrap:balance]">Far from Earth. Every crew member deserves to be heard.</p>
        <p className="mt-[5vh] text-[2vw] leading-snug text-muted">A tablet-first health-reporting prototype for space missions</p>
        <p className="mt-[2vh] text-[2vw] leading-snug text-primary font-bold">Describe what you feel. Record known facts. Prepare a clear handoff.</p>
      </div>
    </div>
  );
}
