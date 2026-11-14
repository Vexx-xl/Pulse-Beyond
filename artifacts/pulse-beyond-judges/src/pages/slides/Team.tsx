export default function Team() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-text text-bg font-body">
      <h1 className="absolute left-[6vw] top-[8vh] w-[80vw] font-display font-extrabold text-[5vw] leading-[0.95] tracking-tight">Three disciplines. One crew-centered mission.</h1>
      <div className="absolute left-[6vw] right-[6vw] top-[38vh] bottom-[8vh] grid grid-cols-3 gap-[2.4vw]">
        <div className="border-t-[0.5vh] border-bg pt-[3vh]">
          <div className="font-display font-extrabold text-[9vw] leading-none text-bg/15">A</div>
          <div className="mt-[1vh] font-display font-extrabold text-[3.4vw] leading-none">Abdullah</div>
          <div className="mt-[1.5vh] text-[1.9vw] font-bold text-[#0b6f63]">Computer science student</div>
          <div className="mt-[2vh] text-[2vw] leading-snug">Product, interface, and usability lead</div>
        </div>
        <div className="border-t-[0.5vh] border-bg pt-[3vh]">
          <div className="font-display font-extrabold text-[9vw] leading-none text-bg/15">J</div>
          <div className="mt-[1vh] font-display font-extrabold text-[3.4vw] leading-none">Jafar</div>
          <div className="mt-[1.5vh] text-[1.9vw] font-bold text-[#0b6f63]">Software engineering student</div>
          <div className="mt-[2vh] text-[2vw] leading-snug">Application logic, storage, offline operation, and integrations</div>
        </div>
        <div className="border-t-[0.5vh] border-bg pt-[3vh]">
          <div className="font-display font-extrabold text-[9vw] leading-none text-bg/15">O</div>
          <div className="mt-[1vh] font-display font-extrabold text-[3.4vw] leading-none">Omar</div>
          <div className="mt-[1.5vh] text-[1.9vw] font-bold text-[#0b6f63]">Medical student</div>
          <div className="mt-[2vh] text-[2vw] leading-snug">Scientific research, sourced content, and scenario review</div>
        </div>
      </div>
    </div>
  );
}
