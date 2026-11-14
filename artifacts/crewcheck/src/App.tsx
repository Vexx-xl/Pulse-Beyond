import { type ReactNode, useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Emergency from '@/pages/Emergency';
import Habitat from '@/pages/Habitat';
import Station from '@/pages/Station';
import Handoff from '@/pages/Handoff';
import Assessment from '@/pages/Assessment';
import Measurements from '@/pages/Measurements';
import Mission from '@/pages/Mission';
import AssessmentReview from '@/pages/AssessmentReview';
import AppShell from '@/components/AppShell';
import { RecordsProvider } from '@/lib/records-context';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

function Router() {
  return (
    <RecordsProvider>
      <AppShell>
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/emergency" component={Emergency} />
            <Route path="/habitat" component={Habitat} />
            <Route path="/station" component={Station} />
            <Route path="/handoff" component={Handoff} />
            <Route path="/assessment" component={Assessment} />
            <Route path="/review" component={AssessmentReview} />
            <Route path="/measurements" component={Measurements} />
            <Route path="/mission" component={Mission} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </AppShell>
    </RecordsProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        .then((registration) => registration.update())
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          const urls = performance.getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => url.startsWith(window.location.origin))
            .map((url) => new URL(url).pathname + new URL(url).search);
          const channel = new MessageChannel();
          const timeout = window.setTimeout(() => window.dispatchEvent(new CustomEvent("crewcheck-offline-cache", { detail: "Offline preparation incomplete" })), 5000);
          channel.port1.onmessage = (event: MessageEvent<{ status?: string }>) => {
            window.clearTimeout(timeout);
            window.dispatchEvent(new CustomEvent("crewcheck-offline-cache", {
              detail: event.data?.status === "ready" ? "This screen is ready for offline use" : "Offline setup did not finish; retry while online",
            }));
          };
          registration.active?.postMessage({ type: "PRECACHE_VISITED", urls }, [channel.port2]);
        })
        .catch(() => window.dispatchEvent(new CustomEvent("crewcheck-offline-cache", { detail: "Offline setup did not finish; retry while online" })));
    } else {
      window.dispatchEvent(new CustomEvent("crewcheck-offline-cache", { detail: "Offline setup is available in the installed app" }));
    }
  }, []);
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
