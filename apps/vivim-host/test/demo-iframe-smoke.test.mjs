// C11 acceptance — iframe embedding smoke: the demo shell frames the phone
// PWA read-only, exactly one way. demo.html must embed /mobile/?host-preview=1
// (the production Host preview route, frame-ancestors 'self' on loopback),
// never reach into the frame (C7), ship no inline script or on*/style
// attributes (C4), and controller.js must fetch same-origin /demo/* only.
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

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';


// This test's directory. bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', 'public', 'demo');
const demoHtml = readFileSync(path.join(demoDir, 'demo.html'), 'utf8');
const controllerSrc = readFileSync(path.join(demoDir, 'controller.js'), 'utf8');

test('demo.html embeds exactly one read-only iframe pointed at the phone preview route', () => {
  const iframes = demoHtml.match(/<iframe\b[\s\S]*?<\/iframe>/g) || [];
  assert.equal(iframes.length, 1, 'demo.html must embed exactly one iframe, found ' + iframes.length);
  const iframe = iframes[0];
  assert.match(iframe, /id="demo-live-preview"/);
  assert.match(iframe, /src="\/mobile\/\?host-preview=1"/);
  assert.match(iframe, /referrerpolicy="no-referrer"/);
  assert.match(iframe, /title="[^"]+"/);
  // Read-only framing: no allow attributes that could grant the frame powers.
  assert.doesNotMatch(iframe, /\ballow=|\ballowfullscreen|\bsandbox=/);
});

test('demo.html ships no inline script, on* handlers or style attributes (C4)', () => {
  const inlineScripts = demoHtml.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) || [];
  assert.deepEqual(inlineScripts, [], 'inline <script> found in demo.html');
  const onAttrs = demoHtml.match(/\son[a-z]+\s*=\s*["'`]/gi) || [];
  assert.deepEqual(onAttrs, [], 'on* event handler attributes found: ' + onAttrs.join(', '));
  const styleAttrs = demoHtml.match(/\sstyle\s*=\s*["'`]/gi) || [];
  assert.deepEqual(styleAttrs, [], 'style= attributes found: ' + styleAttrs.join(', '));
});

test('controller.js never reaches into the iframe (C7) and fetches same-origin /demo/* only', () => {
  // Strip comments first: the header documents the rule itself. Line comments
  // go FIRST — a // comment can contain /* (e.g. "/demo/*"), and letting the
  // block stripper run first would eat real code until the next */.
  const code = controllerSrc.replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  assert.doesNotMatch(code, /contentWindow|contentDocument|postMessage/);
  assert.doesNotMatch(controllerSrc, /XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
  assert.doesNotMatch(controllerSrc, /https?:\/\//, 'controller.js references an absolute URL');
  // Every fetch() first argument must be a string literal starting /demo/ or
  // an identifier whose definition is a '/demo/…' literal or is built from
  // FIXTURE_BASE (e.g. `const url = file.startsWith('/') ? file : FIXTURE_BASE + file`).
  for (const m of code.matchAll(/fetch\(\s*([A-Za-z_$][\w$]*|'[^']*'|"[^"]*")/g)) {
    const arg = m[1];
    if (arg.startsWith("'") || arg.startsWith('"')) {
      assert.match(arg, /^['"]\/demo\//, 'fetch target not under /demo/: ' + arg);
    } else {
      const def = code.match(new RegExp('(?:const|let|var)\\s+' + arg + '\\s*=\\s*([^;\\n]+)'));
      assert.ok(def, 'fetch target definition not found: ' + arg);
      const rhs = def[1];
      const literal = rhs.match(/'([^']*)'|"([^"]*)"/);
      const isDemoLiteral = literal && (literal[1] || literal[2] || '').startsWith('/demo/');
      const builtFromBase = /FIXTURE_BASE|FEEDBACK_URL|INDEX_URL/.test(rhs) && /FIXTURE_BASE|FEEDBACK_URL|INDEX_URL/.test(code);
      assert.ok(
        isDemoLiteral || builtFromBase,
        'fetch target not under /demo/: ' + arg + '=' + rhs
      );
    }
  }
});

test('phone preview route is live and framable same-origin (iframe target smoke)', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-demo-iframe-'));
  const server = createHostServer({ dataRoot });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const shell = await httpFetch(base, '/mobile/?host-preview=1');
    assert.equal(shell.status, 200);
    assert.equal(shell.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(shell.headers.get('content-security-policy') || '', /frame-ancestors 'self'/);
    // The shell route itself stays reachable for the same frame contract.
    assert.equal((await httpFetch(base, '/demo')).status, 200);
    assert.equal((await httpFetch(base, '/demo/fixture/index.json')).status, 200);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dataRoot, { recursive: true, force: true });
  }
});
