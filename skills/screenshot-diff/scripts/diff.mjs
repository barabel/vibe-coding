// Compare a screenshot with a mockup PNG inside a block area.
//
// node diff.mjs --actual out/about-1440.png --mockup mockups/about-1440.png \
//   --crop 64,64,1312,540 --at 64,64 --search 12 --out out/about-1440
// Before/after of the same thing (no crop = whole image, threshold 0 = exact):
// node diff.mjs --mockup before.png --actual after.png --threshold 0 --out out/cmp
//
// Flags:
//   --actual FILE      screenshot
//   --mockup FILE      mockup (transparent areas are flattened onto --bg)
//   --crop x,y,w,h     block area in mockup coordinates (default: whole mockup)
//   --at x,y           top-left of the same area in the screenshot (default: crop x,y)
//   --search N         try every offset within +-N px around --at, use the best one and report it
//   --threshold T      max per-channel delta still counted as equal (default 40, absorbs antialiasing)
//   --bg #ffffff       page background under the mockup alpha (default white)
//   --cell N           grid cell for the mismatch region list (default 8)
//   --out PREFIX       writes PREFIX-diff.png (red = differs, over dimmed screenshot),
//                      PREFIX-overlay.png (50/50 blend), PREFIX-side.png (mockup | screenshot | diff)
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadSharp, parsePoint, parseRect } from './lib.mjs';

const sharp = loadSharp();

const { values } = parseArgs({
  options: {
    'actual': { type: 'string' },
    'mockup': { type: 'string' },
    'crop': { type: 'string' },
    'at': { type: 'string' },
    'search': { type: 'string', default: '0' },
    'threshold': { type: 'string', default: '40' },
    'bg': { type: 'string', default: '#ffffff' },
    'cell': { type: 'string', default: '8' },
    'out': { type: 'string', default: 'diff' },
  },
});

const threshold = Number(values.threshold);
const search = Number(values.search);
const cell = Number(values.cell);

const mockMeta = await sharp(values.mockup).metadata();
const crop = parseRect(values.crop) ?? { x: 0, y: 0, w: mockMeta.width, h: mockMeta.height };
const at = values.at ? parsePoint(values.at) : { x: crop.x, y: crop.y };
const { w, h } = crop;

const rawRegion = async (file, x, y, width, height) => {
  const img = sharp(file).flatten({ background: values.bg });
  const meta = await sharp(file).metadata();
  // Pad with magenta where the region leaves the image, so missing areas count as diffs.
  const left = Math.max(0, -x);
  const top = Math.max(0, -y);
  const right = Math.max(0, x + width - meta.width);
  const bottom = Math.max(0, y + height - meta.height);
  const padded = await img
    .extend({ left, top, right, bottom, background: '#ff00ff' })
    .toBuffer();
  const { data } = await sharp(padded)
    .extract({ left: x + left, top: y + top, width, height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
};

const mock = await rawRegion(values.mockup, crop.x, crop.y, w, h);

let best = { dx: 0, dy: 0 };
if (search > 0) {
  const big = await rawRegion(values.actual, at.x - search, at.y - search, w + search * 2, h + search * 2);
  const bigW = w + search * 2;
  const gray = (buf, i) => {
    return buf[i] * 0.299 + buf[i + 1] * 0.587 + buf[i + 2] * 0.114;
  };
  const step = 3;
  let bestScore = Infinity;
  for (let dy = -search; dy <= search; dy++) {
    for (let dx = -search; dx <= search; dx++) {
      let score = 0;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const mi = (y * w + x) * 3;
          const ai = ((y + dy + search) * bigW + (x + dx + search)) * 3;
          score += Math.abs(gray(mock, mi) - gray(big, ai));
        }
      }
      if (score < bestScore) {
        bestScore = score;
        best = { dx, dy };
      }
    }
  }
}

const ax = at.x + best.dx;
const ay = at.y + best.dy;
const actual = await rawRegion(values.actual, ax, ay, w, h);

const diffImg = Buffer.alloc(w * h * 3);
const overlay = Buffer.alloc(w * h * 3);
const mask = new Uint8Array(w * h);
let count = 0;
let minX = w;
let minY = h;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    const d = Math.max(
      Math.abs(mock[i] - actual[i]),
      Math.abs(mock[i + 1] - actual[i + 1]),
      Math.abs(mock[i + 2] - actual[i + 2]),
    );
    for (let c = 0; c < 3; c++) {
      overlay[i + c] = (mock[i + c] + actual[i + c]) >> 1;
    }
    if (d > threshold) {
      mask[y * w + x] = 1;
      count++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      diffImg[i] = 255;
      diffImg[i + 1] = 0;
      diffImg[i + 2] = 0;
    }
    else {
      const g = (actual[i] + actual[i + 1] + actual[i + 2]) / 3;
      const v = 200 + g / 255 * 55;
      diffImg[i] = v;
      diffImg[i + 1] = v;
      diffImg[i + 2] = v;
    }
  }
}

// Group differing cells into connected regions (block coordinates).
const gw = Math.ceil(w / cell);
const gh = Math.ceil(h / cell);
const grid = new Uint32Array(gw * gh);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (mask[y * w + x]) {
      grid[Math.floor(y / cell) * gw + Math.floor(x / cell)]++;
    }
  }
}
const seen = new Uint8Array(gw * gh);
const regions = [];
const MIN_CELL = 3;
for (let start = 0; start < gw * gh; start++) {
  if (seen[start] || grid[start] < MIN_CELL) {
    continue;
  }
  const stack = [start];
  seen[start] = 1;
  const r = { x0: gw, y0: gh, x1: 0, y1: 0, px: 0 };
  while (stack.length) {
    const k = stack.pop();
    const cx = k % gw;
    const cy = Math.floor(k / gw);
    r.x0 = Math.min(r.x0, cx);
    r.y0 = Math.min(r.y0, cy);
    r.x1 = Math.max(r.x1, cx);
    r.y1 = Math.max(r.y1, cy);
    r.px += grid[k];
    for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) {
        continue;
      }
      const nk = ny * gw + nx;
      if (!seen[nk] && grid[nk] >= MIN_CELL) {
        seen[nk] = 1;
        stack.push(nk);
      }
    }
  }
  regions.push({
    x: r.x0 * cell,
    y: r.y0 * cell,
    w: Math.min(w, (r.x1 + 1) * cell) - r.x0 * cell,
    h: Math.min(h, (r.y1 + 1) * cell) - r.y0 * cell,
    px: r.px,
  });
}
regions.sort((a, b) => {
  return b.px - a.px;
});

const outPrefix = path.resolve(values.out);
fs.mkdirSync(path.dirname(outPrefix), { recursive: true });
const rawOpts = { raw: { width: w, height: h, channels: 3 } };
await sharp(diffImg, rawOpts).png().toFile(`${outPrefix}-diff.png`);
await sharp(overlay, rawOpts).png().toFile(`${outPrefix}-overlay.png`);
const GAP = 8;
await sharp({
  create: { width: w * 3 + GAP * 2, height: h, channels: 3, background: '#ff00ff' },
})
  .composite([
    { input: await sharp(mock, rawOpts).png().toBuffer(), left: 0, top: 0 },
    { input: await sharp(actual, rawOpts).png().toBuffer(), left: w + GAP, top: 0 },
    { input: await sharp(diffImg, rawOpts).png().toBuffer(), left: (w + GAP) * 2, top: 0 },
  ])
  .png()
  .toFile(`${outPrefix}-side.png`);

const total = w * h;
console.log(`mockup crop    ${crop.x},${crop.y} ${w}x${h}`);
console.log(`screenshot at  ${ax},${ay}${search ? `  (best offset dx=${best.dx} dy=${best.dy} from ${at.x},${at.y})` : ''}`);
console.log(`differing px   ${count} / ${total} = ${(count / total * 100).toFixed(2)}%  (threshold ${threshold})`);
if (count) {
  console.log(`diff bbox      x ${minX}..${maxX}, y ${minY}..${maxY} (block coords)`);
}
console.log(`regions (block coords, biggest first, cell ${cell}px):`);
for (const r of regions.slice(0, 15)) {
  console.log(`  x=${r.x} y=${r.y} ${r.w}x${r.h}  ${r.px}px`);
}
console.log(`images         ${outPrefix}-diff.png | -overlay.png | -side.png`);
