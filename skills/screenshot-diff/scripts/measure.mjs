// Ink bounding boxes per sub-region, mockup vs screenshot (block coordinates).
//
// node measure.mjs --actual out/about-1440.png --mockup mockups/about-1440.png --crop 64,64,1312,540 \
//   --regions "title:0,30,880,125;photo:870,0,1312,415"
//
// Flags:
//   --actual FILE       screenshot
//   --mockup FILE       mockup (transparent areas are flattened onto --bg)
//   --crop x,y,w,h      block area in mockup coordinates (default: whole mockup)
//   --at x,y            top-left of the same area in the screenshot (default: crop x,y)
//   --regions SPEC      "name:x0,y0,x1,y1;..." sub-regions in block coordinates
//   --ink N             per-channel delta from the region's dominant color that counts as ink (default 30)
//   --bg #ffffff        page background under the mockup alpha (default white)
import { parseArgs } from 'node:util';
import { loadSharp, parsePoint, parseRect } from './lib.mjs';

const sharp = loadSharp();

const { values } = parseArgs({
  options: {
    actual: { type: 'string' },
    mockup: { type: 'string' },
    crop: { type: 'string' },
    at: { type: 'string' },
    regions: { type: 'string' },
    ink: { type: 'string', default: '30' },
    bg: { type: 'string', default: '#ffffff' },
  },
});

const mockMeta = await sharp(values.mockup).metadata();
const crop = parseRect(values.crop) ?? { x: 0, y: 0, w: mockMeta.width, h: mockMeta.height };
const at = values.at ? parsePoint(values.at) : { x: crop.x, y: crop.y };
const ink = Number(values.ink);

const load = async (file, x, y) => {
  const { data } = await sharp(file)
    .flatten({ background: values.bg })
    .extract({ left: x, top: y, width: crop.w, height: crop.h })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
};

const mock = await load(values.mockup, crop.x, crop.y);
const actual = await load(values.actual, at.x, at.y);

// Background = the most common color in the region; ink = pixels far enough from it.
const bbox = (buf, [x0, y0, x1, y1]) => {
  const counts = new Map();
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * crop.w + x) * 3;
      const key = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const bgKey = [...counts.entries()].sort((p, q) => {
    return q[1] - p[1];
  })[0][0];
  const bg = [bgKey >> 16, (bgKey >> 8) & 255, bgKey & 255];
  const r = { x0: Infinity, y0: Infinity, x1: -1, y1: -1 };
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * crop.w + x) * 3;
      const d = Math.max(
        Math.abs(buf[i] - bg[0]),
        Math.abs(buf[i + 1] - bg[1]),
        Math.abs(buf[i + 2] - bg[2]),
      );
      if (d > ink) {
        r.x0 = Math.min(r.x0, x);
        r.y0 = Math.min(r.y0, y);
        r.x1 = Math.max(r.x1, x);
        r.y1 = Math.max(r.y1, y);
      }
    }
  }
  return r.x1 < 0 ? null : r;
};

const fmt = (r) => {
  if (!r) {
    return '-';
  }
  return `x ${r.x0}..${r.x1} (w${r.x1 - r.x0 + 1}) y ${r.y0}..${r.y1} (h${r.y1 - r.y0 + 1})`;
};

for (const part of values.regions.split(';')) {
  const [name, rect] = part.split(':');
  const box = rect.split(',').map(Number);
  const rm = bbox(mock, box);
  const ra = bbox(actual, box);
  const delta = rm && ra
    ? `dx0=${ra.x0 - rm.x0} dx1=${ra.x1 - rm.x1} dy0=${ra.y0 - rm.y0} dy1=${ra.y1 - rm.y1}`
    : '';
  console.log(`${name.padEnd(12)} mockup ${fmt(rm)}`);
  console.log(`${''.padEnd(12)} actual ${fmt(ra)}   ${delta}`);
}
