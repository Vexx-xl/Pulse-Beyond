export function hasChestPainReported(reported: unknown): boolean {
  return typeof reported === "string" && reported.toLowerCase().includes("chest pain");
}
