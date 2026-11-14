import { useEffect, useRef, useState } from "react";
import { newObservationDraft, parseObservationDraft, type ObservationDraft } from "@/lib/report-guide";

const DRAFT_KEY = "pulse-beyond-observation-draft-v1";
function loadDraft(): { draft: ObservationDraft; error: string } {
  try {
    const value = sessionStorage.getItem(DRAFT_KEY);
    return { draft: value ? parseObservationDraft(JSON.parse(value)) : newObservationDraft(), error: "" };
  } catch {
    return {
      draft: newObservationDraft(),
      error: "A draft could not be restored. Its existing backup was not overwritten. Keep this screen open until you save your new report.",
    };
  }
}

export function useObservationDraft() {
  const [initial] = useState(loadDraft);
  const [draft, setDraft] = useState<ObservationDraft>(initial.draft);
  const [storageError, setStorageError] = useState(initial.error);
  const blocked = useRef(Boolean(initial.error));
  useEffect(() => {
    if (blocked.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setStorageError("");
    } catch {
      setStorageError("Draft backup is unavailable in this tab. Keep this screen open until you save. Your words have not been cleared.");
    }
  }, [draft]);
  useEffect(() => {
    if (!storageError || !draft.report.trim()) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [storageError, draft.report]);
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
      blocked.current = false;
      setStorageError("");
    } catch {
      setStorageError("The previous draft backup could not be removed. Saved records remain available.");
    }
    setDraft(newObservationDraft());
  };
  return { draft, setDraft, clearDraft, storageError };
}
