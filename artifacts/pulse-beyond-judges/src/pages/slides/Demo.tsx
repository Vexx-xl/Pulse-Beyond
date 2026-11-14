import shot from "@assets/pulse-beyond-observe-demo.jpg";

export default function Demo() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <div className="absolute left-[4vw] top-[6vh] h-[88vh] w-[45vw] bg-navy2 p-[1.2vw] shadow-[0_2vh_6vh_rgba(0,0,0,0.45)] rounded-[1.4vw]">
        <img src={shot} crossOrigin="anonymous" alt="Actual Pulse Beyond Observe entry screen" className="w-full h-full object-cover object-top rounded-[0.8vw]" />
      </div>
      <div className="absolute left-[53vw] right-[5vw] top-[7vh]">
        <div className="font-display text-[1.6vw] uppercase tracking-[0.12em] text-accent font-extrabold">Fictional scenario · Mara Vale</div>
        <h1 className="mt-[2vh] font-display font-extrabold text-[4.2vw] leading-[0.95] tracking-tight">Demo: “I feel dizzy when I stand.”</h1>
        <div className="mt-[4vh] text-[2vw] leading-snug">Tell it in your own words: <span className="text-primary">“My head has hurt since the last shift.”</span></div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug">Answer one plain-language question at a time.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug">Need urgent help—or unsure? Open general emergency help immediately.</div>
        <div className="mt-[4vh] bg-accent text-bg rounded-[1vw] px-[1.8vw] py-[2.4vh] text-[2vw] leading-snug"><span className="font-extrabold">Creative choice:</span> start with the person’s words, not a wall of medical fields.</div>
        <div className="mt-[3vh] text-[1.5vw] text-muted">Actual app screen · fictional demo person · typing shown; voice optional and device-dependent</div>
      </div>
    </div>
  );
}
