// VIVIM UI demo build — baseline walkthrough harness.
// Copies the real PWA entry files into dist/, injects the mocked-transport fixture
// and the walkthrough controller script tag. Backend zero: product files are static;
// every product-API read comes from the fixture layer and every product-API write is 405'd.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const mobileRelay = path.join(repo, 'apps', 'mobile-relay');
const hostPublic = path.join(repo, 'apps', 'vivim-host', 'public');
const defaultOutput = path.join(here, 'dist');

export function buildDemo(outputDir = defaultOutput) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  // 1. Real PWA entry files (as specified by the harness brief).
  cpSync(path.join(mobileRelay, 'index.html'), path.join(outputDir, 'index.html'));
  cpSync(path.join(mobileRelay, 'app.js'), path.join(outputDir, 'app.js'));
  cpSync(path.join(mobileRelay, 'ux'), path.join(outputDir, 'ux'), { recursive: true });
  cpSync(path.join(mobileRelay, 'generative-ui'), path.join(outputDir, 'generative-ui'), { recursive: true });
  cpSync(path.join(hostPublic, 'vivim-tokens.css'), path.join(outputDir, 'vivim-tokens.css'));

  // 2. Fixture module (mocked transport) + walkthrough controller.
  cpSync(path.join(here, 'fixture', 'mocked-transport.mjs'), path.join(outputDir, 'mocked-transport.mjs'));
  cpSync(path.join(here, 'controller.js'), path.join(outputDir, 'controller.js'));

  // 3. Inject into the copied entry: design tokens + fixture + controller script tags.
  const indexPath = path.join(outputDir, 'index.html');
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('Copied PWA entry has changed; review the demo builder');
  }
  html = html.replace('</head>', '<link rel="stylesheet" href="/vivim-tokens.css">\n</head>');
  html = html.replace('</body>', '<script type="module" src="/mocked-transport.mjs"></script>\n<script type="module" src="/controller.js"></script>\n</body>');
  writeFileSync(indexPath, html);
  return {
    outputDir,
    files: ['index.html', 'app.js', 'ux/', 'generative-ui/', 'vivim-tokens.css', 'mocked-transport.mjs', 'controller.js']
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(buildDemo()) + '\n');
}
