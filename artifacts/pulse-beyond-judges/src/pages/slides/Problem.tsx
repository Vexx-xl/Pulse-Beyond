export default function Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <div className="absolute left-[6vw] top-[8vh] w-[52vw]">
        <h1 className="font-display font-extrabold text-[5.4vw] leading-[0.95] tracking-tight [text-wrap:balance]">When someone feels unwell, clarity matters.</h1>
        <div className="mt-[6vh] border-t border-text/25 pt-[2.5vh] text-[2.1vw] leading-snug">Distance from Earth makes medical support more challenging.</div>
        <div className="mt-[2.5vh] border-t border-text/25 pt-[2.5vh] text-[2.1vw] leading-snug">Crew need a simple way to describe concerns—not diagnose themselves.</div>
        <div className="mt-[2.5vh] border-t border-text/25 pt-[2.5vh] text-[2.1vw] leading-snug"><span className="font-bold text-primary">Our focus:</span> capture the person’s words, preserve uncertainty, and keep help within reach.</div>
      </div>
      <div className="absolute right-0 top-0 h-screen w-[32vw] bg-accent text-bg px-[3vw] py-[8vh] flex flex-col justify-between">
        <div>
          <div className="font-display text-[1.6vw] uppercase tracking-[0.12em] font-extrabold">Challenge</div>
          <p className="mt-[2vh] font-display font-extrabold text-[3vw] leading-[1.05]">Create Health Monitoring Software for Astronauts on Space Missions</p>
        </div>
        <div className="text-[1.6vw] leading-snug">Source: <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noopener noreferrer" className="underline font-bold">NASA Human Research Program — Hazards of Human Spaceflight</a></div>
      </div>
    </div>
  );
}
