export type RecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };
export type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
export type VoiceState = "idle" | "starting" | "listening" | "stopping";
const errors: Record<string, string> = {
  "not-allowed": "Microphone or speech access was blocked. Check browser permissions, or open this page in a new tab.",
  "service-not-allowed": "The browser blocked its speech service. Try opening this page in a new tab in Chrome or Safari.",
  "audio-capture": "The microphone could not be reached. Check the selected microphone and device permissions.",
  network: "The browser's speech service could not connect. Microphone permission alone does not provide transcription. Check your connection or use keyboard dictation.",
  "no-speech": "No words were recognised. Check your microphone, then try again or use keyboard dictation.",
  "language-not-supported": "English speech recognition is unavailable on this device. Use keyboard dictation or type instead.",
};

/** One browser recognition attempt. No audio recording or automatic retries. */
export function createVoiceSession(
  recognition: Recognition,
  callbacks: {
    state(value: VoiceState): void;
    interim(value: string): void;
    error(value: string): void;
    words(value: string): void;
    ended(): void;
  },
  clock: { set(fn: () => void, ms: number): unknown; clear(id: unknown): void } = {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  },
) {
  let ended = false;
  let stopping = false;
  let failed = false;
  let receivedWords = false;
  let pending = "";
  let timer: unknown;
  const committed = new Set<number>();
  const clearTimer = () => { if (timer !== undefined) clock.clear(timer); timer = undefined; };
  const flushPending = () => {
    if (pending.trim()) { callbacks.words(pending.trim()); receivedWords = true; }
    pending = "";
    callbacks.interim("");
  };
  const detach = () => {
    recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
  };
  const finish = (keepPending = true) => {
    if (ended) return;
    ended = true;
    clearTimer();
    if (keepPending) flushPending();
    else { pending = ""; callbacks.interim(""); }
    detach();
    callbacks.state("idle");
    callbacks.ended();
  };
  const abort = () => { try { recognition.abort(); } catch { /* Already stopped. */ } };
  const wait = (ms: number, message: string) => {
    clearTimer();
    timer = clock.set(() => {
      callbacks.error(message);
      finish();
      abort();
    }, ms);
  };
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => {
    if (ended || stopping) return;
    callbacks.state("listening");
    wait(20000, "The microphone opened, but the speech service returned no words. Try a new tab or your keyboard's microphone.");
  };
  recognition.onresult = (event) => {
    if (ended) return;
    pending = "";
    // Results are cumulative; index tracking prevents duplicate final text.
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript?.trim() || "";
      if (result.isFinal) {
        if (!committed.has(i)) {
          committed.add(i);
          if (text) { receivedWords = true; callbacks.words(text); }
        }
      } else if (text) pending += `${pending ? " " : ""}${text}`;
    }
    callbacks.interim(pending);
    if (!stopping) wait(20000, "Voice paused because no more words arrived. Captured words were kept; check them before continuing.");
  };
  recognition.onerror = ({ error }) => {
    if (ended) return;
    failed = true;
    if (error !== "aborted" || !stopping)
      callbacks.error(errors[error] || "Speech recognition stopped. Check captured words and type anything missing.");
    finish();
    abort();
  };
  recognition.onend = () => {
    if (ended) return;
    if (!failed && !stopping && !receivedWords && !pending.trim())
      callbacks.error("The speech service stopped without capturing words. Try a new tab or use your keyboard's microphone.");
    finish();
  };
  return {
    start() {
      callbacks.state("starting");
      wait(15000, "The speech service did not start after permission. Try a new tab, or use your keyboard's microphone to dictate into the text box.");
      try { recognition.start(); }
      catch {
        callbacks.error("Voice could not start. Check microphone permission or use keyboard dictation.");
        finish();
      }
    },
    stop() {
      if (ended || stopping) return;
      stopping = true;
      callbacks.state("stopping");
      // Give the service time to finalise, then retain its last partial result.
      clearTimer();
      timer = clock.set(() => { finish(); abort(); }, 2000);
      try { recognition.stop(); } catch { finish(); abort(); }
    },
    dispose() { finish(false); abort(); },
  };
}
