// Stable screenshot of a page, an element, or a popup opened by clicks.
//
// node shot.mjs --base http://localhost:3000 --path / --width 360,768,1440 --scroll "#about" --shot "#about" --out out/about-{w}.png
// node shot.mjs --base http://localhost:3000 --width 360 --height 640 --scroll "#about" \
//   --click "#about >> role=button[name='Contact us']" --wait "[role=dialog]" \
//   --shot "[role=dialog]" --out out/popup-{w}.png --out-viewport out/popup-{w}-viewport.png
//
// Flags:
//   --base URL | --port N    site root; --port N means http://localhost:N; file:// URLs work
//   --path P                 page path relative to --base (default "/"); in Git Bash write it without a leading slash
//   --width 360,768,1440     one or more viewport widths; {w} in --out is replaced
//   --height 900             viewport height (grown automatically if the --shot element is taller and there are no clicks)
//   --scale 1                deviceScaleFactor; use 2 for @2x mockups
//   --ready JS               JS expression polled until truthy after load (preloader gone, data loaded, ...)
//   --scroll CSS             element brought to the viewport top before shooting (deterministic parallax)
//   --scroll-offset N        leave N px above the --scroll element (default 0)
//   --click SEL              Playwright selector to click (repeatable, in order); text=..., role=button[name="..."] work
//   --click-wait MS          pause after each click (default 900, covers JS modal fades)
//   --wait SEL               wait until visible before shooting
//   --shot viewport|full|CSS what to capture (default viewport). CSS = clip of the element's box
//   --pad N                  extra px around the CSS element clip
//   --settle MS              pause after the final scroll (default 1500)
//   --no-reveal              skip the scroll-through that fires scroll-triggered reveals
//   --keep-transitions       do not inject the CSS that disables transitions/animations/caret
//   --hide CSS               selector to hide with visibility:hidden (repeatable): fixed header, cookie bar, dev overlay
//   --storage KEY=VALUE      localStorage item set before page scripts run (repeatable)
//   --out FILE               output png (default shot-{w}.png)
//   --out-viewport FILE      also save the whole viewport (useful with --shot <popup selector>)
import path from 'node:path';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { loadPlaywright } from './lib.mjs';

const { values } = parseArgs({
  options: {
    'base': { type: 'string' },
    'port': { type: 'string' },
    'path': { type: 'string', default: '/' },
    'width': { type: 'string', default: '1440' },
    'height': { type: 'string', default: '900' },
    'scale': { type: 'string', default: '1' },
    'ready': { type: 'string' },
    'scroll': { type: 'string' },
    'scroll-offset': { type: 'string', default: '0' },
    'click': { type: 'string', multiple: true, default: [] },
    'click-wait': { type: 'string', default: '900' },
    'wait': { type: 'string' },
    'shot': { type: 'string', default: 'viewport' },
    'pad': { type: 'string', default: '0' },
    'settle': { type: 'string', default: '1500' },
    'no-reveal': { type: 'boolean', default: false },
    'keep-transitions': { type: 'boolean', default: false },
    'out': { type: 'string', default: 'shot-{w}.png' },
    'out-viewport': { type: 'string' },
    'hide': { type: 'string', multiple: true, default: [] },
    'storage': { type: 'string', multiple: true, default: [] },
  },
});

if (!values.base && !values.port) {
  throw new Error('Pass --base URL or --port N.');
}
const base = values.base ?? `http://localhost:${values.port}`;
const url = new URL(values.path, base.endsWith('/') ? base : `${base}/`).toString();
const widths = values.width.split(',').map(Number);
const baseHeight = Number(values.height);
const pad = Number(values.pad);
const scrollOffset = Number(values['scroll-offset']);

const NO_MOTION_CSS = `
  *, *::before, *::after {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

// Smooth-scroll libraries (Lenis) ignore window.scrollTo; jump both.
const scrollToY = async (page, y) => {
  await page.evaluate((top) => {
    if (window.lenis?.scrollTo) {
      window.lenis.scrollTo(top, { immediate: true, force: true });
    }
    window.scrollTo({ top, behavior: 'instant' });
  }, y);
};

// Walk the page so every scroll-triggered reveal (GSAP ScrollTrigger, IntersectionObserver) fires once.
const revealAll = async (page) => {
  const { total, vh } = await page.evaluate(() => {
    return { total: document.documentElement.scrollHeight, vh: window.innerHeight };
  });
  for (let y = 0; y < total; y += Math.floor(vh * 0.7)) {
    await scrollToY(page, y);
    await page.waitForTimeout(120);
  }
  await scrollToY(page, total);
  await page.waitForTimeout(300);
};

const elementTop = async (page, selector) => {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) {
      throw new Error(`not found: ${sel}`);
    }
    return el.getBoundingClientRect().top + window.scrollY;
  }, selector);
};

const shootOne = async (browser, width) => {
  const context = await browser.newContext({
    viewport: { width, height: baseHeight },
    deviceScaleFactor: Number(values.scale),
    reducedMotion: 'no-preference',
  });
  if (values.storage.length) {
    const pairs = values.storage.map((item) => {
      const eq = item.indexOf('=');
      return [item.slice(0, eq), item.slice(eq + 1)];
    });
    await context.addInitScript((entries) => {
      for (const [key, value] of entries) {
        window.localStorage.setItem(key, value);
      }
    }, pairs);
  }
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.evaluate(() => {
    return document.fonts.ready;
  });
  if (values.ready) {
    await page.waitForFunction(values.ready, null, { timeout: 30000, polling: 200 });
  }
  if (!values['keep-transitions']) {
    await page.addStyleTag({ content: NO_MOTION_CSS });
  }
  if (values.hide.length) {
    await page.addStyleTag({ content: `${values.hide.join(', ')} { visibility: hidden !important; }` });
  }

  const shotSelector = ['viewport', 'full'].includes(values.shot) ? null : values.shot;

  // Grow the viewport so the element fits without fullPage (fullPage resizes and re-triggers scroll animations).
  if (shotSelector && !values.click.length) {
    const h = await page.evaluate((sel) => {
      return document.querySelector(sel)?.getBoundingClientRect().height ?? 0;
    }, shotSelector);
    const need = Math.ceil(h + pad * 2 + scrollOffset);
    if (need > baseHeight) {
      await page.setViewportSize({ width, height: need });
      await page.waitForTimeout(500);
    }
  }

  if (!values['no-reveal']) {
    await revealAll(page);
  }

  if (values.scroll) {
    const top = await elementTop(page, values.scroll);
    await scrollToY(page, Math.max(0, top - scrollOffset - (shotSelector ? pad : 0)));
  }
  else {
    await scrollToY(page, 0);
  }
  await page.waitForTimeout(Number(values.settle));

  for (const selector of values.click) {
    await page.locator(selector).first().click();
    await page.waitForTimeout(Number(values['click-wait']));
  }
  if (values.click.length) {
    // Park the cursor so the popup has no hover state under the last click point.
    await page.mouse.move(0, 0);
    // Drop focus so the last clicked control shows no focus ring.
    await page.evaluate(() => {
      document.activeElement?.blur();
    });
  }
  if (values.wait) {
    await page.locator(values.wait).first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);
  }

  const out = path.resolve(values.out.replaceAll('{w}', String(width)));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  if (values['out-viewport']) {
    const outViewport = path.resolve(values['out-viewport'].replaceAll('{w}', String(width)));
    fs.mkdirSync(path.dirname(outViewport), { recursive: true });
    await page.screenshot({ path: outViewport });
    console.log(`${outViewport}  ${width}px  viewport`);
  }

  if (shotSelector) {
    const box = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) {
        throw new Error(`not found: ${sel}`);
      }
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }, shotSelector);
    const vp = page.viewportSize();
    if (box.y + box.height + pad > vp.height) {
      console.warn(`warning: element is cut at the viewport bottom (${vp.height}px); raise --height`);
    }
    const x =Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    const clip = {
      x,
      y,
      width: Math.min(vp.width, Math.ceil(box.x + box.width + pad)) - x,
      height: Math.min(vp.height, Math.ceil(box.y + box.height + pad)) - y,
    };
    await page.screenshot({ path: out, clip });
    console.log(`${out}  ${width}px  element ${JSON.stringify(box)}  clip ${JSON.stringify(clip)}`);
  }
  else {
    await page.screenshot({ path: out, fullPage: values.shot === 'full' });
    console.log(`${out}  ${width}px  ${values.shot}`);
  }
  await context.close();
};

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
try {
  for (const width of widths) {
    await shootOne(browser, width);
  }
}
finally {
  await browser.close();
}
