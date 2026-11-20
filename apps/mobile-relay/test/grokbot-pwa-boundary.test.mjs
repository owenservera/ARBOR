// NEXT:D15.relay-boundary — grokbot PWA / Host boundary acceptance.
// Asserts the committed grokbot.html + grokbot.js: portable PWA rendering that
// projects only Grokbot consumer commands through the typed Host relay route
// (never direct Rust), marks queued/claimed jobs as unverified, and stays a
// client (Host owns persistence; nothing is persisted by the PWA).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../grokbot.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../grokbot.js', import.meta.url), 'utf8');

/* ---------- source extraction (same approach as native-pairing-boundary.test.mjs) ---------- */

function declSource(source, name) {
  const re = new RegExp(
    '(?:async[ \\t]+)?function[ \\t]+' + name + '[ \\t]*\\(' +
    '|(?:const|let|var)[ \\t]+' + name + '[ \\t]*=[ \\t]*(?:async[ \\t]*)?\\([^)]*\\)[ \\t]*=>');
  const m = re.exec(source);
  assert.ok(m, name + ' must exist in the committed grokbot.js source');
  const from = source.indexOf('{', m.index + m[0].length - 1);
  assert.notEqual(from, -1, name + ' must have a block body');
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(m.index, i + 1);
  }
  throw new Error('Unbalanced ' + name);
}

function textOf(node) {
  let out = String(node.textContent || '');
  for (const c of node.children || []) out += '|' + textOf(c);
  return out;
}

function makeNode(tag) {
  return {
    tagName: tag, children: [], className: '', textContent: '', value: '', hidden: false,
    style: {}, attrs: {}, scrollHeight: 1000, scrollTop: 0, clientHeight: 100,
    append(...n) { this.children.push(...n); },
    setAttribute(k, v) { this.attrs[k] = v; },
    replaceChildren(...n) { this.children = n; },
    classList: { add() {}, remove() {}, toggle() {} }
  };
}

function makeDom(ids) {
  const reg = {};
  const document = {
    hidden: false,
    body: makeNode('body'),
    createDocumentFragment: () => makeNode('#fragment'),
    getElementById: id => reg[id] || (reg[id] = makeNode('div#' + id)),
    createElement: tag => makeNode(tag)
  };
  return { $: id => reg[id] || (reg[id] = makeNode('div#' + id)), document, reg };
}

/* ---------- 1. same committed source the UI loads ---------- */

test('grokbot.html loads the exact committed grokbot.js the PWA mounts', () => {
  assert.match(html, /<script type="module" src="\/mobile\/grokbot\.js"><\/script>/,
    'grokbot.html must load grokbot.js itself — no second implementation');
});

/* ---------- 2. transport/device lifecycle stays in PWA/Host via typed relay ---------- */

test('grokbot.js talks only through the typed Host relay route, never direct Rust/native', () => {
  assert.match(js, /\/mobile\/api\/relay\?path=/,
    'grokbot must reach the Host through /mobile/api/relay (typed route)');
  assert.match(js, /consumer:'grokbot'/,
    'commands must be addressed to the grokbot consumer');
  assert.match(js, /kind:'command'/, 'commands must use the command kind');
  assert.doesNotMatch(js, /\brust\b|child_process|Worker\(|require\(|new Worker\b/,
    'the PWA client must not hold direct Rust or native execution authority');
});

/* ---------- 3. runtime: render projects only consumer === grokbot jobs ---------- */

function renderEnv(commands) {
  const dom = makeDom(['jobs']);
  const env = { $: dom.$, document: dom.document, commands };
  vm.createContext(env);
  vm.runInContext(declSource(js, 'render') + '\nrender(commands);', env);
  return dom;
}

test('render keeps only consumer === grokbot jobs, capped at 50', () => {
  const commands = [];
  for (let i = 0; i < 120; i++) {
    commands.push({ id: 'c' + i, consumer: 'grokbot', status: 'queued', text: 'G-t' + i, updatedAt: 't' + i });
  }
  const dom = renderEnv(commands);
  const shown = textOf(dom.reg.jobs);
  assert.ok(shown.includes('G-t0'), 'grokbot jobs are projected');
  assert.ok(shown.includes('G-t49'), 'the 50th grokbot job is projected');
  assert.ok(!shown.includes('G-t50'), 'render caps at 50 jobs');
});

test('render excludes non-grokbot consumers entirely', () => {
  const commands = [
    { id: 'c1', consumer: 'grokbot', status: 'queued', text: 'G-ONE', updatedAt: 't1' },
    { id: 'c2', consumer: 'harness', status: 'done', text: 'H-SECRET', updatedAt: 't2' },
    { id: 'c3', consumer: 'bootstrap', status: 'failed', text: 'B-PRIVATE', updatedAt: 't3' }
  ];
  const dom = renderEnv(commands);
  const shown = textOf(dom.reg.jobs);
  assert.ok(shown.includes('G-ONE'), 'grokbot job is projected');
  assert.ok(!shown.includes('H-SECRET'), 'harness consumer is not projected');
  assert.ok(!shown.includes('B-PRIVATE'), 'bootstrap consumer is not projected');
});

test('render marks queued and claimed jobs as unverified (not executed)', () => {
  const dom = renderEnv([
    { id: 'c1', consumer: 'grokbot', status: 'queued', text: 'Q-TASK', updatedAt: 't1' },
    { id: 'c2', consumer: 'grokbot', status: 'claimed', text: 'C-TASK', updatedAt: 't2' },
    { id: 'c3', consumer: 'grokbot', status: 'done', text: 'D-TASK', updatedAt: 't3' }
  ]);
  const shown = textOf(dom.reg.jobs);
  assert.match(shown, /Waiting for the Linux Grokbot consumer\. Queued does not mean executed\./,
    'queued jobs are labeled unverified');
  assert.match(shown, /Claimed; execution\/reply has not been verified\./,
    'claimed jobs are labeled unverified');
});

test('render with no grokbot jobs reports no tasks and shows nothing private', () => {
  const dom = renderEnv([
    { id: 'x1', consumer: 'harness', status: 'done', text: 'SECRET-HARNESS', updatedAt: 't' }
  ]);
  const shown = textOf(dom.reg.jobs);
  assert.equal(shown, 'No Grokbot tasks on this host.',
    'the PWA displays nothing when there are no grokbot commands');
});
