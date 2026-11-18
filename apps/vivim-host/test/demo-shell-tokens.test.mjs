// C11 acceptance — demo shell consumes vivim-tokens.css design tokens only.
// demo.css header (C10 tokens only): every color, spacing, radius, stroke,
// size and typeface comes from /vivim-tokens.css — no hex colors, no new
// -- token names, no raw font-family literals. demo.html must load the
// token sheet before the demo stylesheet. demo.css is read lazily so a
// missing stylesheet is one loud red test, not a dead module.
import test from 'node:test';
import assert from 'node:assert/strict';

// Raw HTTP over node:http — immune to globalThis.fetch being replaced by
// another test file's fixture stub (the demo suite runs in one bun process).
import { request as httpRequest } from 'node:http';
function httpFetch(base, route, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + route);
    const req = httpRequest({
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method: opts.method || 'GET', headers: opts.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: res.statusCode,
          headers: { get: k => (res.headers[String(k).toLowerCase()] ?? null) },
          text: async () => body,
          json: async () => JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    if (opts.body != null) req.write(opts.body);
    req.end();
  });
}

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This test's directory: bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', '..', '..', 'demo', 'host-legacy');
const publicDir = path.resolve(testDir, '..', 'public');

const tokensCss = readFileSync(path.join(publicDir, 'vivim-tokens.css'), 'utf8');
const demoHtml = readFileSync(path.join(demoDir, 'demo.html'), 'utf8');

// Strip /* */ comments so prose like "no hex colors" never matches itself.
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, ' ');
const hexColor = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/;

function readDemoCss() {
  const p = path.join(demoDir, 'demo.css');
  assert.ok(existsSync(p), 'demo/host-legacy/demo.css is missing — the demo shell stylesheet must exist (C10)');
  return readFileSync(p, 'utf8');
}

test('demo.css defines no hex colors', () => {
  const css = readDemoCss();
  const matches = stripComments(css).match(new RegExp(hexColor, 'g'));
  assert.equal(matches, null, 'hex colors found in demo.css: ' + (matches || []).join(', '));
});

test('demo.css defines no new custom properties (tokens come from vivim-tokens.css)', () => {
  const defined = [...stripComments(readDemoCss()).matchAll(/--([a-z0-9-]+)\s*:/g)].map(m => '--' + m[1]);
  assert.deepEqual(defined, [], 'new -- token names defined in demo.css: ' + defined.join(', '));
});

test('every var() in demo.css resolves to a token defined in vivim-tokens.css', () => {
  const tokenNames = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]));
  assert.ok(tokenNames.size > 0, 'vivim-tokens.css defines no tokens');
  const used = [...stripComments(readDemoCss()).matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]);
  assert.ok(used.length >= 100, 'demo.css barely uses tokens: ' + used.length + ' var() occurrences');
  const missing = [...new Set(used.filter(name => !tokenNames.has(name)))];
  assert.deepEqual(missing, [], 'demo.css uses tokens missing from vivim-tokens.css: ' + missing.join(', '));
});

test('demo.css declares no raw font-family literals — token vars only', () => {
  const lines = stripComments(readDemoCss()).split('\n').filter(l => /font-family\s*:/.test(l));
  assert.ok(lines.length > 0, 'expected at least one font-family declaration');
  for (const line of lines) {
    const value = line.split(/font-family\s*:/)[1].split(';')[0].trim();
    assert.match(value, /^var\(--[a-z0-9-]+\)$/, 'raw font-family literal: ' + value);
  }
});

test('demo.html loads /vivim-tokens.css before /demo/demo.css', () => {
  const tokensAt = demoHtml.indexOf('/vivim-tokens.css');
  const demoAt = demoHtml.indexOf('/demo/demo.css');
  assert.ok(tokensAt !== -1, 'demo.html does not link /vivim-tokens.css');
  assert.ok(demoAt !== -1, 'demo.html does not link /demo/demo.css');
  assert.ok(tokensAt < demoAt, 'token sheet must load before the demo stylesheet');
});

test('server serves /vivim-tokens.css as text/css (the demo dependency is allowlisted)', async () => {
  const { createHostServer } = await import('../server.mjs');
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-demo-tokens-'));
  const server = createHostServer({ dataRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const res = await httpFetch(base, '/vivim-tokens.css');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/css/);
    const css = await res.text();
    assert.match(css, /--paper\s*:/);
    assert.match(css, /--ink\s*:/);
    assert.match(css, /--font-sans\s*:/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
  }
});
