import { Link, useLocation } from "wouter";
import { Activity, ClipboardList, Gauge, House, Map, Settings2, Siren, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRecords } from "@/lib/records-context";

const navigation = [
  { href: "/", label: "Crew", icon: House },
  { href: "/assessment", label: "Observe", icon: Activity },
  { href: "/measurements", label: "Measure", icon: Gauge },
  { href: "/habitat", label: "Habitat", icon: Map },
  { href: "/handoff", label: "Handoff", icon: ClipboardList },
  { href: "/mission", label: "Mission", icon: Settings2 },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { persistence } = useRecords();
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineCache, setOfflineCache] = useState(import.meta.env.PROD ? "Checking offline preparation…" : "Offline cache requires a production HTTPS build");
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    const update = (event: Event) => setOfflineCache(String((event as CustomEvent<string>).detail || "Offline preparation status unavailable"));
    window.addEventListener("crewcheck-offline-cache", update);
    return () => window.removeEventListener("crewcheck-offline-cache", update);
  }, []);
  return <div className="app-shell">
    <header className="topbar sticky top-0 z-20">
      <div className="page-wrap flex min-h-[70px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 no-underline text-inherit" data-testid="link-crewcheck-home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Activity size={21}/></span>
          <span><span className="block text-[17px] font-extrabold tracking-[-.04em]">CrewCheck</span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Crew health · prototype</span></span>
        </Link>
        <nav className="nav-desktop flex items-center gap-1" aria-label="Main navigation">
          {navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} className="nav-link" aria-current={location === href ? "page" : undefined} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={17}/>{label}</Link>)}
        </nav>
        <Link href="/emergency" className="btn btn-danger min-h-[46px] px-4" data-testid="link-emergency-persistent"><Siren size={18}/> Emergency</Link>
      </div>
      <div className="page-wrap flex min-h-8 flex-wrap items-center justify-end gap-x-4 gap-y-1 pb-2 text-[11px] font-semibold text-muted-foreground">
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap" data-testid="status-connectivity"><span className={`status-dot ${online ? "" : "offline"}`}/>{online ? <><Wifi size={13}/> Online</> : <><WifiOff size={13}/> Offline</>}</span>
        <span className={`shrink-0 whitespace-nowrap ${persistence.error ? "text-[hsl(var(--destructive))]" : ""}`} data-testid="status-persistence">{persistence.ready ? "Local storage ready" : persistence.error ? "Persistence unavailable" : "Checking local storage…"}</span>
        <span className="shrink-0 whitespace-nowrap" data-testid="status-offline-cache">{offlineCache}</span>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-[hsl(var(--accent)/.12)] px-2 py-1 text-[hsl(var(--accent))]" data-testid="status-prototype">TRAINING PROTOTYPE</span>
      </div>
    </header>
    <main className="page-wrap pb-24 pt-8">{children}</main>
    <nav className="mobile-nav fixed bottom-0 z-20 hidden w-full justify-around border-t bg-[hsl(var(--background)/.97)] px-2 py-2 backdrop-blur" aria-label="Mobile navigation">
      {navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} className="flex min-h-[50px] flex-col items-center justify-center gap-1 px-2 text-[10px] font-bold text-muted-foreground no-underline" data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={19}/>{label}</Link>)}
    </nav>
  </div>;
}
