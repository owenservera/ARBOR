// Loopback-only demo server. Static dist/ plus a single writable surface: POST /feedback,
// which appends the posted JSON round to demo/ui-demo/feedback/inbox.json (array of rounds)
// and returns it. Strict CSP. GET/HEAD only elsewhere; every other write is 405. Backend zero.
import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemo } from './build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const feedbackDir = resolve(here, 'feedback');
const inboxPath = join(feedbackDir, 'inbox.json');

const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'"
};

function ensureInbox() {
  mkdirSync(feedbackDir, { recursive: true });
  if (!existsSync(inboxPath)) writeFileSync(inboxPath, '[]', 'utf8');
}
function readInbox() { ensureInbox(); return JSON.parse(readFileSync(inboxPath, 'utf8') || '[]'); }
function appendRound(round) { ensureInbox(); const arr = readInbox(); arr.push(round); writeFileSync(inboxPath, JSON.stringify(arr, null, 2)); return round; }

export function createDemoServer() {
  return createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const { pathname } = url;
    const method = (req.method || 'GET').toUpperCase();

    // Only writable surface: POST /feedback. Returns the stored round.
    if (pathname === '/feedback' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const round = {
            round: payload.round != null ? payload.round : String(Date.now()),
            approveAll: !!payload.approveAll,
            verdicts: Array.isArray(payload.verdicts) ? payload.verdicts : [],
            receivedAt: new Date().toISOString()
          };
          const stored = appendRound(round);
          res.writeHead(200, { ...headers, 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(stored));
        } catch {
          res.writeHead(400, { ...headers, 'content-type': 'text/plain; charset=utf-8' });
          res.end('Invalid feedback JSON');
        }
      });
      return;
    }

    // Everything else that mutates is refused 405.
    if (!['GET', 'HEAD'].includes(method)) {
      res.writeHead(405, { ...headers, 'content-type': 'text/plain; charset=utf-8' });
      res.end('Demo harness is read-only except POST /feedback');
      return;
    }

    // Static GET/HEAD from dist.
    const p = pathname === '/' ? '/index.html' : pathname;
    const filename = resolve(join(root, p.slice(1)));
    if (!filename.startsWith(root + sep)) {
      res.writeHead(403, headers); res.end(); return;
    }
    try {
      const stat = statSync(filename);
      if (!stat.isFile()) throw Error('not a file');
      res.writeHead(200, { ...headers, 'content-type': types[extname(filename)] || 'application/octet-stream', 'content-length': stat.size });
      if (req.method === 'HEAD') res.end();
      else createReadStream(filename).pipe(res);
    } catch {
      res.writeHead(404, headers); res.end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildDemo(resolve(fileURLToPath(new URL('./dist/', import.meta.url))));
  const raw = Number(process.env.VIVIM_UI_DEMO_PORT || 4173);
  if (!Number.isSafeInteger(raw) || raw < 1024 || raw > 65535) throw Error('Invalid demo port');
  createDemoServer().listen(raw, '127.0.0.1', () =>
    process.stdout.write('VIVIM UI DEMO only — http://127.0.0.1:' + raw + '/\n'));
}
