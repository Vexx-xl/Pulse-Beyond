import { Link } from "wouter";
import { ArrowLeft, Info } from "lucide-react";
import StationViewer from "@/components/StationViewer";

const links = [
  { label: "NASA model source", href: "https://science.nasa.gov/3d-resources/international-space-station-iss-a/", id: "source" },
  { label: "NASA media usage guidelines", href: "https://www.nasa.gov/nasa-brand-center/images-and-media/", id: "usage" },
  { label: "NASA 3D resources", href: "https://science.nasa.gov/3d-resources/", id: "resources" },
];

export default function StationPage() {
  return <div className="reveal motion-reduce:animate-none">
    <Link href="/habitat" className="btn btn-soft mb-6 no-underline" data-testid="link-back-habitat"><ArrowLeft size={18}/> Back to habitat</Link>
    <header className="mb-6">
      <p className="eyebrow">Optional orientation · reference only</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Station exterior</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">A NASA 3D model of the International Space Station exterior, for general orientation.</p>
    </header>
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] p-4 text-sm leading-6" data-testid="notice-station-reference">
      <Info size={19} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" aria-hidden="true"/>
      <p><strong>NASA ISS exterior reference only.</strong> Not a current layout, equipment map or live tracker. Unrelated to the fictional habitat zones and lunar-surface profiles in this app.</p>
    </div>
    <section className="card overflow-hidden p-3 sm:p-5" aria-label="Station 3D viewer" data-testid="section-station-viewer">
      <StationViewer />
    </section>
    <details className="card mt-5 p-5" data-testid="details-station-credits">
      <summary className="flex min-h-[48px] cursor-pointer items-center font-bold" data-testid="button-station-details">Model details and credits</summary>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        <p>Model: International Space Station (ISS(A)) · GLB file, 39,708 bytes. Credit: NASA/Ames Research Center.</p>
        <p>Used under NASA media guidelines. NASA does not endorse Pulse Beyond.</p>
        <ul className="grid gap-2">
          {links.map(l => <li key={l.id}><a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center break-all font-semibold text-[hsl(var(--primary))] underline underline-offset-4" data-testid={`link-nasa-${l.id}`}>{l.label}</a></li>)}
        </ul>
      </div>
    </details>
  </div>;
}
