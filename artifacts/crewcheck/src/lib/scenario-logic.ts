import type { ActionEvent, Incident } from "@/lib/local-store";

export function nextEmergencyStep(step: number): number {
  return Math.min(4, Math.max(0, step + 1));
}

export function conditionObservationChanges(
  field: "responsiveness" | "breathingObservation",
  value: string,
): Partial<Incident> {
  const urgent = (field === "responsiveness" && value === "Does not respond")
    || (field === "breathingObservation" && value === "Change observed");
  if (!urgent) return { [field]: value };
  return {
    [field]: value,
    conditionChanged: true,
    step: 0,
    conditionChangeDetail: value,
  };
}

export function applyIncidentChange(
  incident: Incident,
  changes: Partial<Incident>,
  action?: ActionEvent,
): Incident {
  return {
    ...incident,
    ...changes,
    events: action ? [...incident.events, action] : incident.events,
  };
}
