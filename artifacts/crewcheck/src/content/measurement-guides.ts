export const MEASUREMENT_GUIDES = {
  "blood-pressure": {
    title: "Blood pressure",
    reason: "A recorded measurement can add context to an observation. This prototype does not interpret readings or provide a clinical threshold.",
    equipment: "Use a mission-approved blood-pressure device and its approved operating instructions.",
    applicability: "Device-specific and mission-specific preparation and positioning instructions are not available in this prototype. Do not substitute Earth positioning instructions in microgravity.",
    units: "mmHg",
    reviewStatus: "Draft shell only; preparation and quality instructions require source and mission review.",
    sourceReferences: [],
  },
  "pulse-ox": {
    title: "Pulse oximeter",
    reason: "A device reading may be included as a measurement with its source and quality. A reading does not clear urgent symptoms.",
    equipment: "Use an approved pulse oximeter and follow its device-specific operating instructions.",
    applicability: "Device-specific and mission-specific instructions are not available in this prototype. Do not use a tablet camera as a validated oxygen or pulse measurement device.",
    units: "%",
    reviewStatus: "Draft shell only; preparation and quality instructions require source and mission review.",
    sourceReferences: [],
  },
} as const;
