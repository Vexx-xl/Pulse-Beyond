export default function Team() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <div className="absolute left-0 top-0 h-screen w-[1.2vw] bg-accent"></div>
      <h1 className="absolute left-[6vw] top-[8vh] w-[70vw] font-display font-extrabold text-[5vw] leading-[0.95] tracking-tight [text-wrap:balance]">One place to record, review, and coordinate.</h1>
      <div className="absolute left-[6vw] right-[6vw] top-[30vh] grid grid-cols-2 gap-x-[4vw] gap-y-[3vh]">
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">01</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">Own-words reports</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Describe concerns with plain-language follow-ups.</div>
          </div>
        </div>
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">02</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">General emergency help</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Reach help instructions without choosing a diagnosis.</div>
          </div>
        </div>
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">03</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">Manual measurements</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Record readings and explicitly unavailable values.</div>
          </div>
        </div>
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">04</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">Mission routines</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Choose a profile and track local reminders.</div>
          </div>
        </div>
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">05</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">Habitat timeline</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Explore fictional observations without inferring causes.</div>
          </div>
        </div>
        <div className="border-t border-text/25 pt-[2.4vh] flex gap-[1.6vw]">
          <div className="font-display font-extrabold text-[2.4vw] leading-none text-accent">06</div>
          <div>
            <div className="font-display font-extrabold text-[2.6vw] leading-[1.05] text-primary">NASA station reference</div>
            <div className="mt-[1.2vh] text-[2vw] leading-snug">Explore the ISS exterior; not an operational map.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
