import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceSession, type Recognition, type VoiceState } from "../lib/voice-session";

type RecognitionConstructor = new () => Recognition;
function recognitionConstructor() {
  const browser = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

export function useCrewVoice() {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const active = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const stop = useCallback(() => active.current?.stop(), []);
  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
    const stopOnHide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", stopOnHide);
    return () => {
      document.removeEventListener("visibilitychange", stopOnHide);
      active.current?.dispose();
      active.current = null;
    };
  }, [stop]);
  const start = (onFinal: (text: string) => void) => {
    if (active.current) return;
    setError("");
    setInterim("");
    const Constructor = recognitionConstructor();
    if (!Constructor) { setError("Voice input is unavailable in this browser. Use keyboard dictation or type instead."); return; }
    if (!navigator.onLine) { setError("Voice input needs an online speech service in this version. You can type offline."); return; }
    try {
      const session = createVoiceSession(new Constructor(), {
        state: setStatus, interim: setInterim, error: setError, words: onFinal,
        ended: () => { active.current = null; },
      });
      active.current = session;
      session.start();
    } catch {
      active.current = null;
      setStatus("idle");
      setError("This browser could not open its speech service. Use keyboard dictation or type instead.");
    }
  };
  return { supported, status, listening: status !== "idle", interim, error, start, stop };
}
