import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Box, Download, Image, Minus, Plus, RotateCcw } from "lucide-react";
import type { StationControls } from "@/lib/station-renderer";

const base = import.meta.env.BASE_URL;
const referencePaths = ["nasa/iss-a.glb", "nasa/iss-a-preview.png", "nasa/draco/draco_wasm_wrapper.js", "nasa/draco/draco_decoder.wasm"];

export default function StationViewer() {
  const [explore, setExplore] = useState(() => new URLSearchParams(window.location.search).get("view") === "3d");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [offline, setOffline] = useState<"idle" | "saving" | "ready" | "error">("idle");
  const [posterError, setPosterError] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const controls = useRef<StationControls | null>(null);
  const offlineRequest = useRef<MessagePort | null>(null);
  useEffect(() => () => { offlineRequest.current?.close(); }, []);

  useEffect(() => {
    if (!explore || !container.current) return;
    const controller = new AbortController();
    let current: StationControls | null = null;
    let finished = false;
    setStatus("loading");
    const timer = window.setTimeout(() => {
      if (finished) return;
      controller.abort();
      setStatus("error");
    }, 25000);
    import("@/lib/station-renderer")
      .then(({ mountStation }) => {
        if (controller.signal.aborted || !container.current) return null;
        return mountStation(container.current, controller.signal, () => setStatus("error"));
      })
      .then((mounted) => {
        if (!mounted) return;
        if (controller.signal.aborted) { mounted.dispose(); return; }
        current = mounted;
        controls.current = mounted;
        finished = true;
        window.clearTimeout(timer);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      current?.dispose();
      controls.current = null;
    };
  }, [explore]);

  const changeView = (value: boolean) => {
    setExplore(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("view", "3d"); else url.searchParams.delete("view");
    window.history.replaceState(window.history.state, "", url);
  };

  const saveOffline = async () => {
    setOffline("saving");
    try {
      if (!import.meta.env.PROD || !("serviceWorker" in navigator)) throw new Error("Installed app required");
      // Import before collecting resources, so both the renderer and its shared chunks are cached.
      await import("@/lib/station-renderer");
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Offline service unavailable")), 8000)),
      ]);
      if (!registration.active) throw new Error("Offline service unavailable");
      const urls = [...new Set([
        ...referencePaths.map((path) => `${base}${path}`),
        ...performance.getEntriesByType("resource").map((entry) => entry.name)
          .filter((url) => url.startsWith(`${window.location.origin}/`))
          .map((url) => new URL(url).pathname + new URL(url).search),
      ])];
      await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        offlineRequest.current = channel.port1;
        const timer = window.setTimeout(() => { channel.port1.close(); reject(new Error("Offline preparation timed out")); }, 20000);
        channel.port1.onmessage = (event: MessageEvent<{ status?: string }>) => {
          window.clearTimeout(timer);
          channel.port1.close();
          if (event.data?.status === "ready") resolve(); else reject(new Error("Offline preparation incomplete"));
        };
        registration.active!.postMessage({ type: "PRECACHE_VISITED", urls }, [channel.port2]);
      });
      setOffline("ready");
    } catch {
      setOffline("error");
    }
  };

  return <section className="card overflow-hidden" aria-label="NASA station reference">
    <div className="relative isolate h-[310px] bg-[#020726] sm:h-[420px]" data-testid="station-viewer">
      {(!explore || status !== "ready") && !posterError && <img
        src={`${base}nasa/iss-a-preview.png`}
        alt="NASA illustration of the International Space Station exterior, showing its solar arrays and connected structure"
        className={`absolute inset-0 h-full w-full object-contain p-5 ${explore ? "opacity-30" : ""}`}
        onError={() => setPosterError(true)}
      />}
      {explore && <div ref={container} className={`absolute inset-0 ${status === "ready" ? "" : "invisible"}`} />}
      {((explore && status !== "ready") || (!explore && posterError)) && <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-sm rounded-xl border bg-[hsl(var(--card))] p-5 text-center" role="status" aria-live="polite">
          {explore && status === "loading" ? "Opening the NASA model…" : "The visual reference could not load. You can still use every crew-support feature."}
        </div>
      </div>}
      <span className="absolute left-4 top-4 rounded-full border bg-[hsl(var(--background)/.9)] px-3 py-2 text-xs font-bold">NASA · ISS exterior</span>
    </div>
    <div className="border-t p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {!explore ? <button className="btn btn-primary" onClick={() => changeView(true)} data-testid="station-open-3d"><Box size={19}/> Explore in 3D</button> : <>
          <button className="btn btn-soft" onClick={() => changeView(false)} data-testid="station-view-image"><Image size={18}/> View image</button>
          <button className="btn btn-soft" disabled={status !== "ready"} onClick={() => controls.current?.reset()} data-testid="station-reset"><RotateCcw size={18}/> Reset view</button>
          <button className="btn btn-soft" disabled={status !== "ready"} aria-label="Zoom in" onClick={() => controls.current?.zoom(0.8)}><Plus size={20}/></button>
          <button className="btn btn-soft" disabled={status !== "ready"} aria-label="Zoom out" onClick={() => controls.current?.zoom(1.25)}><Minus size={20}/></button>
          <button className="btn btn-soft" disabled={status !== "ready"} aria-label="Rotate left" onClick={() => controls.current?.rotate(-Math.PI / 8)}><ArrowLeft size={20}/></button>
          <button className="btn btn-soft" disabled={status !== "ready"} aria-label="Rotate right" onClick={() => controls.current?.rotate(Math.PI / 8)}><ArrowRight size={20}/></button>
        </>}
        <button className="btn btn-soft sm:ml-auto" disabled={offline === "saving" || offline === "ready"} onClick={() => void saveOffline()} data-testid="station-save-offline"><Download size={18}/>{offline === "saving" ? "Saving…" : offline === "ready" ? "Saved for offline" : "Save for offline"}</button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {offline === "ready" ? "The image, model and viewer are cached on this device. Browser storage can be cleared by the device."
          : offline === "error" ? (import.meta.env.DEV ? "Offline saving is available in the published/installed app, not this development preview." : "Offline preparation did not finish. Reconnect and try again; do not rely on the 3D view offline yet.")
          : explore && status === "ready" ? "Drag with one finger to rotate. Pinch or use the buttons to zoom. No automatic motion."
          : "Optional reference. Save while online before relying on this view offline."}
      </p>
    </div>
  </section>;
}
