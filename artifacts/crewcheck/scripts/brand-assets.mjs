// Generate small app icons from the supplied RGB/RGBA PNG without dependencies.
import fs from "node:fs/promises";
import zlib from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const source = path.resolve(root, process.argv[2] || "attached_assets/Pulse_Beyond_1794658541006.png");
const bytes = await fs.readFile(source);
let width, height, channels;
const compressed = [];
for (let offset = 8; offset < bytes.length;) {
  const length = bytes.readUInt32BE(offset);
  const type = bytes.toString("ascii", offset + 4, offset + 8);
  const data = bytes.subarray(offset + 8, offset + 8 + length);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    channels = data[9] === 2 ? 3 : data[9] === 6 ? 4 : 0;
    if (data[8] !== 8 || !channels || data[12] !== 0) throw new Error("Expected a non-interlaced 8-bit RGB/RGBA PNG.");
  }
  if (type === "IDAT") compressed.push(data);
  offset += length + 12;
}
const inflated = zlib.inflateSync(Buffer.concat(compressed));
const stride = width * channels;
const pixels = Buffer.alloc(height * stride);
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
for (let y = 0; y < height; y++) {
  const start = y * (stride + 1);
  const filter = inflated[start];
  for (let x = 0; x < stride; x++) {
    const a = x >= channels ? pixels[y * stride + x - channels] : 0;
    const b = y ? pixels[(y - 1) * stride + x] : 0;
    const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
    const predictors = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)];
    if (filter > 4) throw new Error("Unsupported PNG filter.");
    pixels[y * stride + x] = (inflated[start + 1 + x] + predictors[filter]) & 255;
  }
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
function resize(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Area averaging keeps fine logo strokes legible at small icon sizes.
      const x0 = Math.floor(x * width / size), x1 = Math.max(x0 + 1, Math.floor((x + 1) * width / size));
      const y0 = Math.floor(y * height / size), y1 = Math.max(y0 + 1, Math.floor((y + 1) * height / size));
      const rgb = [0, 0, 0];
      let count = 0;
      for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
        const i = (sy * width + sx) * channels;
        for (let c = 0; c < 3; c++) rgb[c] += pixels[i + c];
        count++;
      }
      const target = y * (size * 3 + 1) + 1 + x * 3;
      for (let c = 0; c < 3; c++) raw[target + c] = Math.round(rgb[c] / count);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([bytes.subarray(0, 8), chunk("IHDR", header), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
const output = path.resolve(root, "artifacts/crewcheck/public");
for (const [name, size] of [
  ["pulse-beyond-logo.png", 320], ["pulse-beyond-192.png", 192],
  ["pulse-beyond-512.png", 512], ["apple-touch-icon.png", 180], ["favicon.png", 64],
]) {
  const image = resize(size);
  await fs.writeFile(path.join(output, name), image);
  console.log(`${name}: ${size}×${size}, ${image.length} bytes`);
}
