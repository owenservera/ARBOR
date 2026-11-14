#!/usr/bin/env node
// A00 independent Wiki evidence: source/API checks, never simulated browser acceptance.
// Live mode can mutate ONLY an explicitly flagged isolated loopback Host data root.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WIKI_ACTIONS = ['wiki.page.create', 'wiki.section.edit', 'wiki.page.move', 'wiki.pages.link', 'wiki.section.read', 'wiki.pages.list', 'wiki.page.delete'];
const BASELINE_CAPS = ['send-message', 'read-state', 'execute-intent', 'read-journal', 'get-capabilities'];
const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseJournalResponse(body) {
  const entries = JSON.parse(body);
  if (!Array.isArray(entries) || entries.some(entry => !object(entry)))
    throw new Error('/api/journal must be a JSON array of entry objects');
  return entries;
}

export function parseRawJournal(body) {
  if (body === '') return [];
  const lines = body.endsWith('\n') ? body.slice(0, -1).split('\n') : body.split('\n');
  return lines.map((line, index) => {
    if (!line.trim()) throw new Error('Empty or torn journal line ' + (index + 1));
    let value;
    try { value = JSON.parse(line); }
    catch { throw new Error('Corrupt journal line ' + (index + 1)); }
    if (!object(value)) throw new Error('Invalid journal entry at line ' + (index + 1));
    return value;
  });
}

export function assertIsolatedLive(baseUrl, isolated) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('Explicit isolated loopback base URL required'); }
  if (!isolated || url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('--live requires ARBOR_WIKI_EVIDENCE_ISOLATED=1 and an explicit isolated http://127.0.0.1:<port> Host');
  }
}

export function rendererSourceContract(html, js, css) {
  return /src=["']\/wiki\.js["']/.test(html) &&
    /href=["']\/wiki\.css["']/.test(html) &&
    /function\s+renderRoadmap\s*\(/.test(js) &&
    /function\s+renderFileSurface\s*\(/.test(js) &&
    /\/api\/roadmap/.test(js) &&
    /\/api\/wiki/.test(js) &&
    /\/api\/journal/.test(js) &&
    css.trim().length > 0;
}

function makeTransport(baseUrl, fetchImpl) {
  async function request(route, options) {
    const response = await fetchImpl(baseUrl + route, { ...options, signal: AbortSignal.timeout(5000) });
    return { status: response.status, type: response.headers.get('content-type') || '', body: await response.text() };
  }
  return {
    get: route => request(route),
    post: (route, body, headers = {}) => request(route, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  };
}

export async function runWikiEvidence({
  root = ROOT, live = false, isolated = false, baseUrl = '',
  transport = null, ownerToken = null, fetchImpl = globalThis.fetch
} = {}) {
  if (live) assertIsolatedLive(baseUrl, isolated);
  // A live editor requires an actual Host owner grant. Mock transport tests
  // inject their own trust fixture and never touch a real server.
  if (live && !transport && (typeof ownerToken !== 'string' || !/^[a-f0-9]{64}$/.test(ownerToken)))
    throw new Error('Isolated live edit requires an ephemeral Host owner capability');
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  const safe = async (name, fn) => {
    try { const value = await fn(); check(name, true, 'validated'); return value; }
    catch (error) { check(name, false, String(error?.message || error)); return null; }
  };
  const read = file => readFileSync(resolve(root, file), 'utf8');
  let seedBytes = null;
  await safe('catalog-actions-and-caps', () => {
    const catalog = JSON.parse(read('apps/vivim-host/control/action-catalog.v1.json'));
    const ids = (catalog.actions || catalog).map(a => a.id || a.actionId);
    const missing = [...WIKI_ACTIONS, ...BASELINE_CAPS].filter(id => !ids.includes(id));
    if (missing.length) throw new Error('Missing actions: ' + missing.join(','));
    return ids;
  });
  await safe('file-surface-registry', () => {
    const name = 'apps/vivim-host/data/demo-baseline/file-surface.v1.json';
    if (!existsSync(resolve(root, name))) throw new Error('Missing file-surface registry');
    return JSON.parse(read(name));
  });
  await safe('wiki-seed-valid', () => {
    seedBytes = read('apps/vivim-host/data/demo-baseline/wiki.json');
    const seed = JSON.parse(seedBytes);
    if (!Number.isSafeInteger(seed.revision) || !object(seed.pages?.Main?.sections) ||
        typeof seed.pages.Main.sections.HowTo !== 'string') throw new Error('Invalid Wiki edit seed');
    return seed;
  });

  if (live) {
    const io = transport || makeTransport(baseUrl, fetchImpl);
    const response = async (route, type) => {
      const out = await io.get(route);
      if (out.status !== 200 || !type.test(out.type || ''))
        throw new Error(route + ' status=' + out.status + ' type=' + out.type);
      return out.body;
    };
    const json = async route => JSON.parse(await response(route, /application\/json/i));
    const roadmap = await safe('roadmap-api', async () => {
      const value = await json('/api/roadmap');
      if (!Array.isArray(value?.buildQueue) && !Array.isArray(value?.layers?.L2))
        throw new Error('Roadmap queue missing');
      return value;
    });
    const wikiBefore = await safe('wiki-api-before', async () => {
      const value = await json('/api/wiki');
      if (!Number.isSafeInteger(value?.revision) || !object(value?.pages?.Main?.sections) ||
          typeof value.pages.Main.sections.HowTo !== 'string') throw new Error('Invalid Wiki projection');
      return value;
    });
    const journalBefore = await safe('journal-json-array-before', async () =>
      parseJournalResponse(await response('/api/journal', /application\/json/i)));
    const rawBefore = await safe('journal-jsonl-integrity-before', async () =>
      parseRawJournal(await response('/demo/journal.jsonl', /application\/jsonl/i)));
    check('journal-read-consistency-before', journalBefore !== null && rawBefore !== null &&
      JSON.stringify(journalBefore) === JSON.stringify(rawBefore), 'API array must match every raw JSONL entry; empty is valid');
    const html = await safe('wiki-html-shell', () => response('/wiki', /text\/html/i));
    const js = await safe('wiki-external-js', () => response('/wiki.js', /javascript/i));
    const css = await safe('wiki-external-css', () => response('/wiki.css', /text\/css/i));
    check('wiki-source-renderer-contract', html !== null && js !== null && css !== null &&
      rendererSourceContract(html, js, css) && roadmap !== null,
      'external assets and API references only; browser DOM and rendered content UNRUN');

    // Fail closed: do not write to a damaged or misconfigured isolated host.
    if (checks.every(c => c.pass)) {
      const edit = { kind: 'wiki-edit', actor: 'owner-browser', schemaVersion: 1,
        expectedRevision: wikiBefore.revision, edit: { action: 'set-section', page: 'Main',
          section: 'HowTo', content: 'A00 isolated check rev ' + wikiBefore.revision + ' ' +
          hash(seedBytes).slice(0, 12) } };
      const trusted = { origin: baseUrl, 'x-vivim-control': '1',
        ...(ownerToken ? { authorization: 'Bearer ' + ownerToken } : {}) };
      const negatives = [
        ['forged-origin-refused', edit, { ...trusted, origin: 'https://forged.invalid' }, 403],
        ['missing-explicit-control-refused', edit, { origin: baseUrl }, 403],
        ['forged-actor-refused', { ...edit, actor: 'forged-session' }, trusted, 400],
        ['missing-revision-refused', { ...edit, expectedRevision: undefined }, trusted, 428],
        ['stale-revision-refused', { ...edit, expectedRevision: wikiBefore.revision - 1 }, trusted, 409]
      ];
      for (const [name, payload, headers, expected] of negatives) {
        await safe(name, async () => {
          const out = await io.post('/api/mutate', payload, headers);
          if (out.status !== expected) throw new Error('expected HTTP ' + expected + ', got ' + out.status);
        });
      }
      const journalAfterRefusals = await safe('journal-after-refusals', async () =>
        parseJournalResponse(await response('/api/journal', /application\/json/i)));
      const wikiAfterRefusals = await safe('wiki-after-refusals', () => json('/api/wiki'));
      check('refusals-are-nonmutating', journalAfterRefusals !== null && wikiAfterRefusals !== null &&
        JSON.stringify(journalAfterRefusals) === JSON.stringify(journalBefore) &&
        JSON.stringify(wikiAfterRefusals) === JSON.stringify(wikiBefore),
        'rejected edits must not append or change projection');
      if (checks.every(c => c.pass)) {
        const saved = await safe('wiki-edit-acknowledged', async () => {
          const out = await io.post('/api/mutate', edit, trusted);
          if (out.status !== 200 || !/application\/json/i.test(out.type || ''))
            throw new Error('approved edit status=' + out.status);
          const value = JSON.parse(out.body);
          if (value.kind !== 'wiki-edit' || value.actor !== edit.actor ||
              value.wikiRevision !== wikiBefore.revision + 1 ||
              !value.receivedAt) throw new Error('Invalid edit acknowledgment');
          return value;
        });
        const journalAfter = await safe('journal-json-array-after', async () =>
          parseJournalResponse(await response('/api/journal', /application\/json/i)));
        const rawAfter = await safe('journal-jsonl-integrity-after', async () =>
          parseRawJournal(await response('/demo/journal.jsonl', /application\/jsonl/i)));
        const wikiAfter = await safe('wiki-api-after', () => json('/api/wiki'));
        const stateAfter = await safe('state-api-after', () => json('/api/state'));
        const appended = journalAfter?.[journalBefore.length];
        check('one-authorized-journal-append', Boolean(saved) && journalAfter?.length === journalBefore.length + 1 &&
          JSON.stringify(journalAfter) === JSON.stringify(rawAfter) &&
          appended?.kind === 'wiki-edit' && appended?.actor === edit.actor &&
          appended?.expectedRevision === edit.expectedRevision &&
          appended?.edit?.content === edit.edit.content,
          'exactly one nested acknowledged edit, API array and raw JSONL agree');
        check('wiki-and-state-revision-projection', wikiAfter?.revision === wikiBefore.revision + 1 &&
          wikiAfter?.pages?.Main?.sections?.HowTo === edit.edit.content &&
          stateAfter?.wikiRevision === wikiAfter?.revision,
          'Host state and Wiki API agree; restart durability not tested here');
      }
    } else {
      check('live-mutation-preflight', false, 'not attempted: failed source/API/journal preflight');
    }
  }
  if (seedBytes !== null) {
    await safe('committed-seed-unchanged', () => {
      if (read('apps/vivim-host/data/demo-baseline/wiki.json') !== seedBytes)
        throw new Error('Committed Wiki seed changed during isolated probe');
    });
  }
  const ok = checks.every(c => c.pass);
  return {
    schema: 'arbor.wiki-evidence/2', ok, item: 'WIKI-BASELINE',
    scope: live ? 'SOURCE_AND_API_ONLY' : 'SOURCE_ONLY',
    browserDom: 'UNRUN', physicalDevice: 'UNRUN',
    sessionBoundAuthorization: live && ok && ownerToken
      ? 'ISOLATED_OWNER_BEARER_VERIFIED_BROWSER_SESSION_UNRUN' : 'UNVERIFIED',
    durableWikiProjection: live && ok ? 'API_JOURNAL_PROJECTION_ONLY_RESTART_UNRUN' : 'UNRUN',
    independentKeeperAcceptance: 'UNRUN',
    checks, digest: hash(JSON.stringify(checks))
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node scripts/batch-evidence/WIKI-BASELINE.mjs [--live]\n');
    return;
  }
  if (args.some(x => x !== '--live') || args.filter(x => x === '--live').length > 1) {
    process.stderr.write('Unknown or duplicate argument\n'); process.exitCode = 2; return;
  }
  try {
    const live = args.includes('--live');
    const result = await runWikiEvidence({ live,
      isolated: process.env.ARBOR_WIKI_EVIDENCE_ISOLATED === '1',
      baseUrl: process.env.ARBOR_WIKI_EVIDENCE_BASE_URL || '',
      ownerToken: process.env.ARBOR_WIKI_EVIDENCE_OWNER_TOKEN || null });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('Wiki evidence unavailable: ' + String(error?.message || error) + '\n');
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
