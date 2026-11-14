import logo from "@assets/Pulse_Beyond_1794658541006.png";

export default function Close() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary text-bg font-body">
      <h1 className="absolute left-[6vw] top-[8vh] w-[62vw] font-display font-extrabold text-[4.6vw] leading-[0.95] tracking-tight [text-wrap:balance]">Help the crew be heard. Help support receive the facts.</h1>
      <div className="absolute left-[6vw] top-[40vh] w-[58vw]">
        <div className="text-[2vw] leading-snug"><span className="font-extrabold">Built today:</span> own-words reports, guided follow-ups, manual measurements, and factual handoff.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug"><span className="font-extrabold">Next:</span> tablet usability trials, real offline checks, and qualified medical and mission review.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug"><span className="font-extrabold">Then:</span> evaluate approved device integrations—not simulated live monitoring.</div>
        <div className="mt-[5vh] font-display font-extrabold text-[2.8vw] leading-[1.05]">Our ambition: make health reporting easier when the mission is hardest.</div>
      </div>
      <div className="absolute right-[5vw] top-[12vh] w-[27vw] flex flex-col items-center">
        <img src={logo} crossOrigin="anonymous" alt="Pulse Beyond logo" className="w-[24vw] h-[24vw] rounded-[2vw] object-cover" />
        <div className="mt-[4vh] font-display font-extrabold text-[2.4vw] text-center">Pulse Beyond</div>
        <div className="mt-[1vh] text-[2vw] text-center">Abdullah · Jafar · Omar</div>
      </div>
    </div>
  );
}
