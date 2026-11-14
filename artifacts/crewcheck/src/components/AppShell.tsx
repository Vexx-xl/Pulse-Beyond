import { Link, useLocation } from "wouter";
import { Activity, ClipboardList, Download, Gauge, House, Map, Settings2, Siren, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRecords } from "@/lib/records-context";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const navigation = [
  { href: "/", label: "Crew", icon: House },
  { href: "/assessment", label: "Observe", icon: Activity },
  { href: "/measurements", label: "Measure", icon: Gauge },
  { href: "/habitat", label: "Habitat", icon: Map },
  { href: "/handoff", label: "Handoff", icon: ClipboardList },
  { href: "/mission", label: "Mission", icon: Settings2 },
];

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isCurrentPage(location: string, href: string) {
  return location === href || (href === "/assessment" && location === "/review");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { persistence } = useRecords();
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineCache, setOfflineCache] = useState(import.meta.env.PROD ? "Preparing offline access…" : "Offline setup is available in the installed app");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
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
  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => {
      const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setInstalled(displayMode.matches || iosStandalone);
    };
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setInstallMessage("CrewCheck was added to this device.");
    };
    checkInstalled();
    displayMode.addEventListener("change", checkInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      displayMode.removeEventListener("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setInstallGuideOpen(true);
      return;
    }
    try {
      const prompt = installPrompt;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setInstallMessage(choice.outcome === "accepted" ? "CrewCheck was added to this device." : "Install was dismissed. You can add CrewCheck from the browser menu later.");
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } catch {
      setInstallGuideOpen(true);
    }
  };

  return <div className="app-shell">
    <header className="topbar sticky top-0 z-20">
      <div className="topbar-main page-wrap flex min-h-[70px] items-center justify-between gap-4">
        <Link href="/" className="topbar-brand flex items-center gap-3 no-underline text-inherit" data-testid="link-crewcheck-home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Activity size={21}/></span>
          <span><span className="block text-[17px] font-extrabold tracking-[-.04em]">CrewCheck</span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Training prototype</span></span>
        </Link>
        <nav className="nav-desktop flex items-center gap-1" aria-label="Main navigation">
          {navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} className="nav-link" aria-current={isCurrentPage(location, href) ? "page" : undefined} data-testid={`link-nav-${label.toLowerCase()}`}><Icon size={19}/>{label}</Link>)}
        </nav>
        <Link href="/emergency" className="topbar-emergency btn btn-danger min-h-[48px] px-4" data-testid="link-emergency-persistent"><Siren size={19}/> Emergency</Link>
      </div>
      <div className="status-row page-wrap flex min-h-8 flex-wrap items-center justify-end gap-x-4 gap-y-1 pb-2 text-[12px] font-semibold text-muted-foreground">
        <span role="status" aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 whitespace-nowrap" data-testid="status-connectivity"><span className={`status-dot ${online ? "" : "offline"}`}/>{online ? <><Wifi size={14}/> Online</> : <><WifiOff size={14}/> Offline</>}</span>
          <span className={`whitespace-nowrap ${persistence.error ? "font-bold text-[hsl(var(--destructive))]" : ""}`} data-testid="status-persistence">{persistence.ready ? "Records stay on this tablet" : persistence.error ? "Not saving. Records may be lost." : "Starting…"}</span>
          {installMessage && <span className="whitespace-nowrap text-[hsl(var(--primary))]" data-testid="status-install-message">{installMessage}</span>}
        </span>
        <details className="device-details" data-testid="details-device">
          <summary data-testid="button-device-details">Device details</summary>
          <div className="device-panel">
            <p data-testid="status-offline-cache">{offlineCache}</p>
            {!online && <p>Records stay on this device while offline.</p>}
            {installed ? <p className="text-[hsl(var(--primary))]" data-testid="status-installed">Installed on this device</p>
              : <button type="button" className="install-app-button" onClick={() => void installApp()} data-testid="button-install-pwa"><Download size={15}/>{installPrompt ? "Install CrewCheck" : "Add to Home Screen"}</button>}
            <p className="text-[hsl(var(--accent))]" data-testid="status-prototype">Training prototype</p>
          </div>
        </details>
      </div>
    </header>
    <main className="app-main page-wrap pb-24 pt-8">{children}</main>
    <nav className="mobile-nav fixed bottom-0 z-20 hidden w-full justify-around border-t bg-[hsl(var(--background)/.97)] px-2 py-2 backdrop-blur" aria-label="Mobile navigation">
      {navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} className="mobile-nav-link flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 text-[11px] font-bold text-muted-foreground no-underline" aria-current={isCurrentPage(location, href) ? "page" : undefined} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={20}/>{label}</Link>)}
    </nav>
    <Dialog open={installGuideOpen} onOpenChange={setInstallGuideOpen}>
      <DialogContent className="rounded-2xl p-6 sm:p-8" data-testid="dialog-install-guide">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-extrabold">Add CrewCheck to this device</DialogTitle>
          <DialogDescription>Use it like an app from your tablet’s Home Screen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-6">
          <div><strong>iPad or iPhone:</strong> In Safari, tap Share, then choose <strong>Add to Home Screen</strong>.</div>
          <div><strong>Android tablet or Chrome:</strong> Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</div>
          <div><strong>Offline use:</strong> Install while online, then open the screens you need once before disconnecting. CrewCheck keeps records on this device; it does not sync them to other devices.</div>
          {!import.meta.env.PROD && <p className="rounded-xl bg-[hsl(var(--muted))] p-3 text-muted-foreground">The current workspace preview does not enable the offline app shell. Offline setup is available in the installed production build.</p>}
        </div>
        {installMessage && <p role="status" className="text-sm font-semibold text-[hsl(var(--primary))]">{installMessage}</p>}
        <button type="button" className="btn btn-primary min-h-[52px] w-full" onClick={() => setInstallGuideOpen(false)}>Got it</button>
      </DialogContent>
    </Dialog>
  </div>;
}
