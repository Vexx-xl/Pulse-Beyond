import type { Assessment } from "./local-store.ts";

export type ObservationDraft = {
  id: string;
  report: string;
  person: string;
  observer: "Self" | "Crewmate";
  answers: Record<string, string>;
  stage: "report" | "safety" | "questions" | "review";
  questionIndex: number;
};
export type ReportPrompt = { key: string; label: string; placeholder: string };

/** Keywords choose reporting questions only, never findings, urgency or diagnoses. */
export function getReportPrompts(report: string): ReportPrompt[] {
  let detail = "What else would you like onboard support to know?";
  if (/\b(breath|breathing|breathe|air)\b/i.test(report)) {
    detail = "How would you describe what your breathing feels or looks like?";
  } else if (/\b(pain|hurt|hurts|ache|aching|injur\w*|bleed\w*)\b/i.test(report)) {
    detail = "Where do you feel the discomfort, and how would you describe it?";
  } else if (/\b(dizz\w*|lightheaded|faint\w*|weak|tired|exhausted)\b/i.test(report)) {
    detail = "Describe the feeling and what you were doing when it began.";
  } else if (/\b(worr\w*|anxious|afraid|scared|sad|stress\w*|lonely)\b/i.test(report)) {
    detail = "What feelings or worries would you like to share with onboard support?";
  }
  return [
    { key: "onset", label: "When did this start?", placeholder: "Use your own words, or choose Not sure." },
    { key: "reported-detail", label: detail, placeholder: "Only what you feel, see or have been told." },
    { key: "location", label: "Where are you or the person now?", placeholder: "A module, area or other location. Unknown is okay." },
  ];
}

export function newObservationDraft(): ObservationDraft {
  return { id: crypto.randomUUID(), report: "", person: "", observer: "Self", answers: {}, stage: "report", questionIndex: 0 };
}

export function parseObservationDraft(value: unknown): ObservationDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid draft");
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" || typeof item.report !== "string" || typeof item.person !== "string" ||
    !["Self", "Crewmate"].includes(String(item.observer)) ||
    !["report", "safety", "questions", "review"].includes(String(item.stage)) ||
    typeof item.questionIndex !== "number" || !Number.isInteger(item.questionIndex) || item.questionIndex < 0 || item.questionIndex > 2 ||
    !item.answers || typeof item.answers !== "object" || Array.isArray(item.answers) ||
    !Object.values(item.answers).every((answer) => typeof answer === "string")
  ) throw new Error("Invalid draft");
  return item as ObservationDraft;
}

export function makeObservation(draft: ObservationDraft): Assessment {
  if (!draft.report.trim()) throw new Error("Describe how you feel before saving.");
  const keys = ["onset", "reported-detail", "location"];
  return {
    id: draft.id, person: draft.person || "Not specified", observer: draft.observer,
    at: new Date().toISOString(),
    observations: {
      reported: draft.report,
      ...Object.fromEntries(keys.filter((key) => draft.answers[key]?.trim()).map((key) => [key, draft.answers[key]])),
    },
    notes: "Guided report confirmed by the person entering it. No diagnosis or safety clearance.",
  };
}
