// Shared helpers: resolve Playwright and sharp without touching the project's package.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const versionKey = (v) => {
  return v.split('.').map((n) => {
    return Number.parseInt(n, 10) || 0;
  });
};

const compareVersions = (a, b) => {
  const ka = versionKey(a);
  const kb = versionKey(b);
  for (let i = 0; i < 3; i++) {
    if (ka[i] !== kb[i]) {
      return ka[i] - kb[i];
    }
  }
  return 0;
};

const npxCacheDirs = () => {
  const roots = [
    process.env.npm_config_cache,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'npm-cache'),
    path.join(os.homedir(), '.npm'),
  ].filter(Boolean);
  return roots.map((root) => {
    return path.join(root, '_npx');
  });
};

// Package dirs named `name` inside every npx cache entry.
const findInNpxCache = (name) => {
  const found = [];
  for (const npxDir of npxCacheDirs()) {
    if (!fs.existsSync(npxDir)) {
      continue;
    }
    for (const hash of fs.readdirSync(npxDir)) {
      const dir = path.join(npxDir, hash, 'node_modules', name);
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        found.push(dir);
      }
    }
  }
  return found;
};

const newest = (dirs) => {
  return dirs
    .map((dir) => {
      const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      return { dir, version };
    })
    .sort((a, b) => {
      return compareVersions(b.version, a.version);
    })[0]?.dir;
};

const requireDir = (dir) => {
  return createRequire(path.join(dir, 'package.json'))(dir);
};

// Resolve `name` the way the current project would (cwd and its parents' node_modules).
const tryProject = (name) => {
  try {
    return createRequire(path.join(process.cwd(), 'package.json'))(name);
  }
  catch {
    return null;
  }
};

const globalRoot = () => {
  try {
    return execSync('npm root -g', { encoding: 'utf8' }).trim();
  }
  catch {
    return null;
  }
};

// Order: PLAYWRIGHT_DIR, the current project, the newest copy in the npx cache.
export const loadPlaywright = () => {
  if (process.env.PLAYWRIGHT_DIR) {
    return requireDir(process.env.PLAYWRIGHT_DIR);
  }
  const fromProject = tryProject('playwright');
  if (fromProject) {
    return fromProject;
  }
  const dir = newest(findInNpxCache('playwright'));
  if (!dir) {
    throw new Error('Playwright not found. Run `npx playwright install chromium` once (it caches playwright in the npx cache), or set PLAYWRIGHT_DIR.');
  }
  return requireDir(dir);
};

// Order: SHARP_DIR, the current project (Next.js ships it), the global npm root, the npx cache.
export const loadSharp = () => {
  if (process.env.SHARP_DIR) {
    return requireDir(process.env.SHARP_DIR);
  }
  const fromProject = tryProject('sharp');
  if (fromProject) {
    return fromProject;
  }
  const root = globalRoot();
  if (root && fs.existsSync(path.join(root, 'sharp', 'package.json'))) {
    return requireDir(path.join(root, 'sharp'));
  }
  const dir = newest(findInNpxCache('sharp'));
  if (!dir) {
    throw new Error('sharp not found in the project, globally or in the npx cache. Run `npx -y -p sharp node -e 1` once (it caches sharp in the npx cache), or set SHARP_DIR.');
  }
  return requireDir(dir);
};

export const parseRect = (value) => {
  if (!value) {
    return null;
  }
  const [x, y, w, h] = value.split(',').map(Number);
  return { x, y, w, h };
};

export const parsePoint = (value) => {
  if (!value) {
    return { x: 0, y: 0 };
  }
  const [x, y] = value.split(',').map(Number);
  return { x, y };
};
