import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type RecognitionConstructor = new () => Recognition;
function recognitionConstructor() {
  const browser = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}
const errors: Record<string, string> = {
  "not-allowed": "Microphone or speech permission was denied. You can type instead.",
  "service-not-allowed": "This browser does not allow speech recognition here. You can type instead.",
  "audio-capture": "A microphone could not be reached. Check the device or type instead.",
  network: "The speech service could not connect. Typing still works offline.",
  "no-speech": "No speech was recognized. Try again or type your words.",
  "language-not-supported": "English speech recognition is unavailable on this device. Please type instead.",
};

export function useCrewVoice() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const active = useRef<Recognition | null>(null);
  const stop = useCallback(() => {
    try { active.current?.stop(); }
    catch { setListening(false); }
  }, []);
  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
    const stopOnHide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", stopOnHide);
    return () => {
      document.removeEventListener("visibilitychange", stopOnHide);
      if (active.current) {
        active.current.onend = null;
        active.current.onresult = null;
        active.current.onerror = null;
        active.current.abort();
        active.current = null;
      }
    };
  }, [stop]);
  const start = (onFinal: (text: string) => void) => {
    if (active.current) return;
    setError("");
    setInterim("");
    const Constructor = recognitionConstructor();
    if (!Constructor) { setError("Voice input is unavailable in this browser. Please type instead."); return; }
    if (!navigator.onLine) { setError("Voice input needs an online speech service in this version. You can type offline."); return; }
    const recognition = new Constructor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let pending = "";
      const final: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) final.push(item[0].transcript); else pending += item[0].transcript;
      }
      if (final.length) onFinal(final.join(" "));
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(errors[event.error] || "Voice input stopped. Review any captured words and type anything missing.");
      setListening(false);
      setInterim("");
    };
    recognition.onend = () => {
      if (active.current === recognition) active.current = null;
      setListening(false);
      setInterim("");
    };
    active.current = recognition;
    try { recognition.start(); setListening(true); }
    catch {
      active.current = null;
      setListening(false);
      setError("Voice input could not start. Check microphone permission or type instead.");
    }
  };
  return { supported, listening, interim, error, start, stop };
}
