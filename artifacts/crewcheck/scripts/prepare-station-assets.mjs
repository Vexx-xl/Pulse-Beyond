// Reproduce the locally hosted NASA reference and decoder assets.
// Run from any directory: node artifacts/crewcheck/scripts/prepare-station-assets.mjs
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const output = new URL("public/nasa/", root);
await mkdir(new URL("draco/", output), { recursive: true });
const nasaPath = "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/international-space-station-(iss)-(a)/International%20Space%20Station%20(ISS)%20(A)";
async function download(url, path, check) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  check?.(data);
  await writeFile(new URL(path, output), data);
}
await download(`${nasaPath}.glb`, "iss-a.glb", (bytes) => {
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== "70d0619a69312a45cbf740ba9a491fad854e10226dc5936c213fb1f93f063678") {
    throw new Error("NASA model changed; review its provenance before updating the checked-in asset.");
  }
});
await download(`${nasaPath.replace("/content/dam/", "/dynamicimage/assets/")}.png?w=960&h=540&fit=clip`, "iss-a-preview.png", (bytes) => {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("NASA preview is not a PNG");
});
for (const file of ["draco_wasm_wrapper.js", "draco_decoder.wasm"]) {
  await copyFile(new URL(`node_modules/three/examples/jsm/libs/draco/gltf/${file}`, root), new URL(`draco/${file}`, output));
}
await copyFile(new URL("node_modules/three/LICENSE", root), new URL("draco/THREE-LICENSE.txt", output));
await download("https://raw.githubusercontent.com/google/draco/main/LICENSE", "draco/LICENSE.txt");
console.info("NASA model, preview, local Draco decoder and licenses prepared.");
