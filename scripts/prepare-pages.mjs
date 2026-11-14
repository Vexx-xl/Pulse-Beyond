import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const output = new URL('../artifacts/crewcheck/dist/public/', import.meta.url);
const index = new URL('index.html', output);
const routes = [
  'assessment', 'demo', 'emergency', 'habitat', 'handoff',
  'measurements', 'mission', 'review', 'station',
];

// Pages serves directory indexes when visitors open or refresh a route directly.
await Promise.all(routes.map(async (route) => {
  const directory = new URL(`${route}/`, output);
  await mkdir(directory, { recursive: true });
  await copyFile(index, new URL('index.html', directory));
}));

// Scope the installed app and its icons to this project's Pages path.
const manifestFile = new URL('manifest.webmanifest', output);
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
for (const field of ['id', 'start_url', 'scope']) {
  manifest[field] = './';
}
for (const icon of manifest.icons) {
  icon.src = `.${icon.src}`;
}
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

await copyFile(new URL('../Pulse-Beyond%20Presentation.pdf', import.meta.url), new URL('presentation.pdf', output));
