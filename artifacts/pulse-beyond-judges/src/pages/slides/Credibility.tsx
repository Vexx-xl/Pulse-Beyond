const base = import.meta.env.BASE_URL;

export default function Credibility() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <h1 className="absolute left-[6vw] top-[8vh] w-[86vw] font-display font-extrabold text-[4.2vw] leading-[0.98] tracking-tight [text-wrap:balance]">Credibility means showing what we know—and what we don’t.</h1>
      <div className="absolute left-[6vw] top-[34vh] w-[50vw]">
        <div className="text-[2vw] leading-snug"><span className="font-bold text-primary">NASA context:</span> Human Research Program hazards inform the problem framing.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug"><span className="font-bold text-primary">NASA resource used:</span> ISS 3D model, credited to NASA/Ames; visual reference only.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug"><span className="font-bold text-primary">Software evidence:</span> 19 automated tests passed; production build passed.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug"><span className="font-bold text-accent">Still to verify:</span> real-device speech and installed-tablet offline use.</div>
        <div className="mt-[2.4vh] text-[2vw] leading-snug font-bold">Clinical and mission review pending. Not NASA-endorsed.</div>
      </div>
      <div className="absolute right-[6vw] top-[34vh] w-[30vw]">
        <div className="font-display font-extrabold text-[11vw] leading-none text-primary">19</div>
        <div className="text-[2vw] font-bold">automated tests passed</div>
        <img src={`${base}iss-a-preview.png`} crossOrigin="anonymous" alt="International Space Station 3D model preview" className="mt-[3vh] h-[18vh] w-full object-contain bg-navy2 rounded-[0.8vw]" />
        <div className="mt-[1vh] text-[1.5vw] text-muted">Image: NASA/Ames Research Center</div>
      </div>
      <div className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] text-muted">Sources: <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noopener noreferrer" className="underline">NASA HRP Hazards</a>; <a href="https://science.nasa.gov/3d-resources/international-space-station-iss-a/" target="_blank" rel="noopener noreferrer" className="underline">NASA ISS (A) 3D Resources</a>; <a href="../demo" target="_blank" rel="noopener noreferrer" className="underline">project test-evidence snapshot</a></div>
    </div>
  );
}
