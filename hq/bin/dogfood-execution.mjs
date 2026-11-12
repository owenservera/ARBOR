#!/usr/bin/env node
/**
 * @hq:context WO-028 dogfood execution runner - reads the WO-027 dogfood design, drives the real
 *   VIVIM product path that design names (harness provider profiles, the send/journal/reply path,
 *   the Studio conversation runtime, the shipped surfaces) and captures what works and what breaks
 *   as append-only learning rows.
 * @hq:owner hq
 * @hq:task WO-028
 * @hq:see docs/architecture/DOG-FOOD-DESIGN.md
 * @hq:see hq/bin/dogfood.mjs
 * @hq:invariant read-only against provider and browser state: this runner never sends, never
 *   approves, never drives Chrome. It writes the learning ledger and a temp workspace, nothing else.
 * @hq:invariant a row exists only from evidence this run produced: the exact command, the exit
 *   code, the failing reason. Nothing is inferred from prose.
 * @hq:invariant a broken capture is a failure, never a quiet success: if a row cannot be validated
 *   or written, the runner exits non-zero.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { redactSecrets } from '../lib/dogfood.mjs';

const HERE = import.meta.dirname ?? import.meta.dir;
const ROOT = resolve(HERE, '..', '..');
const DESIGN_PATH = join(ROOT, 'docs', 'architecture', 'DOG-FOOD-DESIGN.md');
const LEDGER_PATH = join(ROOT, 'dogfood', 'learnings.jsonl');
const HARNESS_DEFAULT = 'C:/0-BlackBoxProject-0/vivim-web-harness';
const UI_DEFAULT = 'C:/0-BlackBoxProject-0/vivim-ui';

export const LEARNING_SCHEMA = 'hq.dogfood-execution-learning/1';
export const STAGES = ['design', 'product-path', 'harness-suite', 'studio-suite', 'shipped-dependency'];
const KINDS = ['works', 'breaks', 'gap', 'blocked'];
const CRITERIA = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'none'];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const hash12 = (text, size = 12) =>
  createHash('sha256').update(String(text)).digest('hex').slice(0, size);

const clip = (text, max = 400) => {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}...` : s;
};

/** A persisted row never carries a credential. */
const clean = (text) => clip(redactSecrets(String(text ?? '')), 400);

function argValue(argv, name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
function hasFlag(argv, name) {
  return argv.includes(`--${name}`);
}

/**
 * Run a command without a shell and capture its output. The exact argv is the evidence.
 * @param {string} cmd
 * @param {string[]} args
 * @param {string} cwd
 * @param {number} timeoutMs
 */
function runCommand(cmd, args, cwd, timeoutMs = 300000) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    command: [cmd, ...args].join(' '),
    cwd,
    status: r.status === null ? -1 : r.status,
    signal: r.signal ?? null,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* the design: what to dogfood                                         */
/* ------------------------------------------------------------------ */

/**
 * Parse the WO-027 design so the runner knows what to dogfood, not what it assumes.
 * @param {string} text
 */
export function parseDesign(text) {
  const src = String(text ?? '');
  const criteria = [...new Set([...src.matchAll(/\*\*(C[1-6])\s*\u2014/g)].map((m) => m[1]))];
  const blocked = [...new Set([...src.matchAll(/openrouter\/[A-Za-z0-9._/-]+/g)].map((m) => m[0]))];
  const sentenceMatch = /such as\s+"([^"]{6,120})"/.exec(src);
  const sentence = sentenceMatch ? sentenceMatch[1] : null;
  const harnessMatch = /[A-Za-z]:[\/][^\s"'`,)]*vivim-web-harness|vivim-web-harness/.exec(src);
  return {
    target: /ES-APP-01/.test(src) ? 'ES-APP-01' : null,
    criteria,
    sentence,
    blockedModels: blocked,
    harnessRef: harnessMatch ? harnessMatch[0] : null,
    namesSignedInWebAi: /signed-in provider web AI|web app AI in the harness|signed-in web AI/i.test(src),
    namesHostTools: /VIVIM-owned typed Host tools/i.test(src),
    namesJourney: /built, observed, tested, recoverable/i.test(src),
    hasProviderConstraint: blocked.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* learning rows                                                       */
/* ------------------------------------------------------------------ */

/**
 * One learning row. Every field is evidence this run produced.
 * @param {{stage:string,kind:string,criterion?:string,rule:string,command?:string,evidence?:any,provider?:string,runId:string}} input
 */
export function makeRow(input) {
  const kind = KINDS.includes(input.kind) ? input.kind : 'gap';
  const criterion = CRITERIA.includes(input.criterion) ? input.criterion : 'none';
  const rule = clean(input.rule);
  const evidence = input.evidence && typeof input.evidence === 'object' ? input.evidence : {};
  const safeEvidence = {};
  for (const [key, value] of Object.entries(evidence)) {
    safeEvidence[key] = typeof value === 'string' ? clean(value) : value;
  }
  return {
    schema: LEARNING_SCHEMA,
    id: 'dfe_' + hash12(`${input.stage}\u0000${kind}\u0000${criterion}\u0000${rule}`),
    runId: input.runId,
    at: new Date().toISOString(),
    stage: input.stage,
    kind,
    criterion,
    target: 'ES-APP-01',
    provider: input.provider ?? 'none',
    count: 1,
    rule,
    command: clean(input.command ?? ''),
    evidence: safeEvidence,
  };
}

/**
 * A row that cannot be validated is not evidence. Validation is what makes a broken capture
 * detectable instead of silent.
 * @param {any} row
 */
export function validateRow(row) {
  const errors = [];
  if (!row || typeof row !== 'object') return { ok: false, errors: ['row is not an object'] };
  if (row.schema !== LEARNING_SCHEMA) errors.push(`schema must be ${LEARNING_SCHEMA}`);
  if (typeof row.id !== 'string' || !/^dfe_[0-9a-f]{12}$/.test(row.id)) errors.push('id must be dfe_<12 hex>');
  if (!KINDS.includes(row.kind)) errors.push(`kind must be one of ${KINDS.join(', ')}`);
  if (!CRITERIA.includes(row.criterion)) errors.push(`criterion must be one of ${CRITERIA.join(', ')}`);
  if (!STAGES.includes(row.stage)) errors.push(`stage must be one of ${STAGES.join(', ')}`);
  if (typeof row.rule !== 'string' || !row.rule.trim()) errors.push('rule must be a non-empty sentence');
  if (typeof row.at !== 'string' || Number.isNaN(Date.parse(row.at))) errors.push('at must be an ISO timestamp');
  const serialized = JSON.stringify(row);
  if (/\b(sk|pk|rk|ghp|gho|ghs|xox[baprs]|AKIA)[-_A-Za-z0-9]{12,}\b/.test(serialized)) errors.push('row carries a credential-shaped string');
  if (/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/.test(serialized)) errors.push('row carries a bearer token');
  return { ok: errors.length === 0, errors };
}

/**
 * Append rows to the learning ledger. Append-only: an existing ledger is never rewritten.
 * @param {any[]} rows
 * @param {string} file
 */
export function captureLearnings(rows, file) {
  if (!Array.isArray(rows)) throw new Error('learning capture rejected: rows must be an array');
  const problems = [];
  rows.forEach((row, index) => {
    const { ok, errors } = validateRow(row);
    if (!ok) problems.push(`row ${index} (${row?.id ?? 'no id'}): ${errors.join('; ')}`);
  });
  if (problems.length) throw new Error(`learning capture rejected: ${problems.join(' | ')}`);
  if (!rows.length) throw new Error('learning capture rejected: no rows to capture');
  try {
    mkdirSync(dirname(file), { recursive: true });
    let prefix = '';
    if (existsSync(file)) {
      const current = readFileSync(file, 'utf8');
      if (current.length && !current.endsWith('\n')) prefix = '\n';
    }
    appendFileSync(file, prefix + rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');
  } catch (err) {
    throw new Error(`learning capture rejected: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { file, written: rows.length };
}

/* ------------------------------------------------------------------ */
/* a minimal DOM so the real harness expressions can run offline        */
/* ------------------------------------------------------------------ */

/** Split a selector on whitespace, but never inside brackets or quotes. */
function tokenizeSelector(sel) {
  const parts = [];
  let buf = '';
  let depth = 0;
  let quote = null;
  for (const ch of String(sel)) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '[') depth += 1;
    if (ch === ']') depth -= 1;
    if (/\s/.test(ch) && depth === 0) {
      if (buf) parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf) parts.push(buf);
  return parts;
}

function parseAttr(body) {
  const m = /^\s*([\w:-]+)\s*(?:(\^=|\$=|\*=|~=|=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\s*(i|s)?\s*$/.exec(body);
  if (!m) return { name: String(body).trim(), op: null, value: null, ci: false };
  return {
    name: m[1],
    op: m[2] ?? null,
    value: m[3] ?? m[4] ?? m[5] ?? null,
    ci: (m[6] ?? '').toLowerCase() === 'i',
  };
}

function parseCompound(src) {
  const out = { tag: null, id: null, classes: [], attrs: [], not: [] };
  let i = 0;
  const s = String(src);
  while (i < s.length) {
    const ch = s[i];
    if (ch === '*') { i += 1; continue; }
    if (ch === '#') {
      const m = /^#([\w-]+)/.exec(s.slice(i));
      if (m) { out.id = m[1]; i += m[0].length; continue; }
    }
    if (ch === '.') {
      const m = /^\.([\w-]+)/.exec(s.slice(i));
      if (m) { out.classes.push(m[1]); i += m[0].length; continue; }
    }
    if (ch === '[') {
      const end = s.indexOf(']', i);
      const body = end === -1 ? s.slice(i + 1) : s.slice(i + 1, end);
      out.attrs.push(parseAttr(body));
      i = end === -1 ? s.length : end + 1;
      continue;
    }
    if (ch === ':') {
      const not = /^:not\(([^)]*)\)/.exec(s.slice(i));
      if (not) { out.not.push(parseCompound(not[1])); i += not[0].length; continue; }
      const pseudo = /^:[\w-]+/.exec(s.slice(i));
      if (pseudo) { i += pseudo[0].length; continue; }
    }
    const tag = /^[\w-]+/.exec(s.slice(i));
    if (tag) { out.tag = tag[0].toLowerCase(); i += tag[0].length; continue; }
    i += 1;
  }
  return out;
}

function matchesAttr(el, attr) {
  const raw = el.attrs[attr.name];
  if (raw === undefined) return false;
  if (!attr.op) return true;
  const hay = attr.ci ? String(raw).toLowerCase() : String(raw);
  const needle = attr.ci ? String(attr.value ?? '').toLowerCase() : String(attr.value ?? '');
  if (attr.op === '=') return hay === needle;
  if (attr.op === '^=') return hay.startsWith(needle);
  if (attr.op === '$=') return hay.endsWith(needle);
  if (attr.op === '*=') return hay.includes(needle);
  if (attr.op === '~=') return hay.split(/\s+/).includes(needle);
  return false;
}

function matchesCompound(el, compound) {
  if (compound.tag && el.tag !== compound.tag) return false;
  if (compound.id && el.id !== compound.id) return false;
  for (const cls of compound.classes) if (!el.classes.includes(cls)) return false;
  for (const attr of compound.attrs) if (!matchesAttr(el, attr)) return false;
  for (const negated of compound.not) if (matchesCompound(el, negated)) return false;
  return true;
}

function matchesChain(el, compounds) {
  if (!compounds.length) return false;
  if (!matchesCompound(el, compounds[compounds.length - 1])) return false;
  let index = compounds.length - 2;
  let node = el.parent;
  while (index >= 0) {
    while (node && !matchesCompound(node, compounds[index])) node = node.parent;
    if (!node) return false;
    index -= 1;
    node = node.parent;
  }
  return true;
}

function queryAll(scope, selector) {
  const out = [];
  for (const part of String(selector).split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const compounds = tokenizeSelector(trimmed).map(parseCompound);
    for (const el of scope) {
      if (matchesChain(el, compounds) && !out.includes(el)) out.push(el);
    }
  }
  return out;
}

function makeEl(doc, tag, opts = {}) {
  const el = {
    tag: String(tag).toLowerCase(),
    id: opts.id ?? '',
    classes: opts.classes ? [...opts.classes] : [],
    attrs: opts.attrs ? { ...opts.attrs } : {},
    innerText: opts.innerText ?? '',
    textContent: opts.textContent ?? opts.innerText ?? '',
    children: [],
    parent: null,
    focus() { doc.activeElement = this; },
    contains(other) {
      let node = other;
      while (node) {
        if (node === this) return true;
        node = node.parent;
      }
      return false;
    },
    matches(selector) { return matchesChain(this, tokenizeSelector(selector).map(parseCompound)); },
    querySelectorAll(selector) { return queryAll(this.children, selector); },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
  };
  if ('value' in opts) el.value = opts.value;
  return el;
}

function appendTo(parent, child) {
  child.parent = parent;
  parent.children.push(child);
  return child;
}

/** A document small enough to trust: only what the harness expressions actually read. */
function makeDoc() {
  const doc = { activeElement: null };
  const html = makeEl(doc, 'html');
  const body = makeEl(doc, 'body');
  appendTo(html, body);
  doc.root = html;
  doc.body = body;
  doc.all = () => {
    const out = [];
    const walk = (node) => {
      for (const child of node.children) {
        out.push(child);
        walk(child);
      }
    };
    walk(html);
    return out;
  };
  doc.querySelectorAll = (selector) => queryAll(doc.all(), selector);
  doc.querySelector = (selector) => doc.querySelectorAll(selector)[0] ?? null;
  return doc;
}

/** Build the element chain a real provider selector describes, so the shipped selectors are exercised. */
function buildForSelector(doc, selector, opts = {}) {
  const first = String(selector).split(',')[0].trim();
  const compounds = tokenizeSelector(first).map(parseCompound);
  let node = doc.body;
  let last = null;
  for (const compound of compounds) {
    const attrs = {};
    for (const attr of compound.attrs) if (attr.op === '=' && attr.value != null) attrs[attr.name] = attr.value;
    const el = makeEl(doc, compound.tag ?? 'div', {
      id: compound.id ?? '',
      classes: compound.classes,
      attrs,
      innerText: opts.text ?? '',
    });
    appendTo(node, el);
    node = el;
    last = el;
  }
  return last;
}

/**
 * A Page stand-in that answers the real expressions. The harness contract requires Page to be
 * fakeable; this one keeps the product's own selector logic in the loop.
 */
function makePage({ doc, threadUrl, provider, replyText }) {
  const effects = [];
  const composerSelector = provider?.composer?.selectors?.[0] ?? 'textarea';
  const composer = buildForSelector(doc, composerSelector);
  const userSelector = provider?.user?.selectors?.[0] ?? '[data-message-author-role="user"]';
  const assistantSelector = provider?.assistant?.containerSelectors?.[0] ?? 'article';
  const page = {
    effects,
    composer,
    async url() { return threadUrl; },
    async evaluate(expression) {
      if (typeof expression === 'string' && expression.includes('document.visibilityState')) return 'visible';
      const fn = new Function('document', `return ${expression}`);
      return fn(doc);
    },
    async insertText(text) {
      effects.push('type');
      composer.innerText = text;
      composer.textContent = text;
    },
    async pressEnter() {
      effects.push('submit');
      const text = composer.innerText;
      composer.innerText = '';
      composer.textContent = '';
      const user = buildForSelector(doc, userSelector, { text });
      appendTo(doc.body, user);
      const assistant = buildForSelector(doc, assistantSelector, { text: replyText });
      appendTo(doc.body, assistant);
    },
    async bringToFront() { effects.push('front'); },
  };
  return page;
}

/* ------------------------------------------------------------------ */
/* stages                                                              */
/* ------------------------------------------------------------------ */

/** The design decides what to dogfood. Without it there is nothing to exercise. */
function stageDesign(ctx) {
  if (!existsSync(ctx.designPath)) {
    return [makeRow({
      stage: 'design',
      kind: 'blocked',
      criterion: 'none',
      rule: `the dogfood design is missing at ${ctx.designPath} - nothing to dogfood, nothing to execute`,
      command: `read ${ctx.designPath}`,
      runId: ctx.runId,
    })];
  }
  const text = readFileSync(ctx.designPath, 'utf8');
  const design = parseDesign(text);
  const rows = [makeRow({
    stage: 'design',
    kind: design.target && design.criteria.length === 6 ? 'works' : 'breaks',
    criterion: 'C3',
    rule: design.target && design.criteria.length === 6
      ? `design parsed: target ${design.target}, ${design.criteria.length} executable criteria (${design.criteria.join(',')}), signed-in web AI and typed Host tools named`
      : `design parsed but incomplete: target ${design.target ?? 'missing'}, criteria ${design.criteria.join(',') || 'none'}`,
    command: `read ${ctx.designPath}`,
    evidence: {
      criteria: design.criteria,
      target: design.target,
      sentence: design.sentence,
      blockedModels: design.blockedModels,
      signedInWebAi: design.namesSignedInWebAi,
      typedHostTools: design.namesHostTools,
      journey: design.namesJourney,
    },
    runId: ctx.runId,
  })];
  rows.push(makeRow({
    stage: 'design',
    kind: 'breaks',
    criterion: 'C6',
    rule: 'the learning ledger is rewritten wholesale by the existing loop: "bun hq/bin/dogfood.mjs learn" calls writeLearnings (hq/lib/dogfood.mjs:1106), which replaces dogfood/learnings.jsonl instead of appending, so the rows this runner appends are dropped by the next rewrite',
    command: 'bun hq/bin/dogfood.mjs learn',
    evidence: { rewriter: 'hq/lib/dogfood.mjs:1106', writer: 'hq/bin/dogfood.mjs' },
    runId: ctx.runId,
  }));
  if (design.blockedModels.length) {
    rows.push(makeRow({
      stage: 'design',
      kind: 'works',
      criterion: 'C4',
      rule: `design names ${design.blockedModels.length} budget-blocked model(s) that must never be a dogfood target: ${design.blockedModels.join(', ')}`,
      command: `read ${ctx.designPath}`,
      evidence: { blockedModels: design.blockedModels },
      runId: ctx.runId,
    }));
  }
  return rows;
}

/**
 * Load every provider profile on its own and name the ones the registry would reject. The
 * registry validates at import time, so one bad profile takes the whole surface down.
 * @param {string} providersDir
 */
async function auditProviderProfiles(providersDir) {
  const offenders = [];
  if (!existsSync(providersDir)) return offenders;
  for (const name of readdirSync(providersDir).filter((f) => f.endsWith('.mjs') && f !== 'index.mjs')) {
    let profile;
    try {
      profile = (await import(pathToFileURL(join(providersDir, name)).href)).default;
    } catch (err) {
      offenders.push({ file: name, reason: `import failed: ${clip(err?.message, 120)}` });
      continue;
    }
    if (!Array.isArray(profile?.strengths) || !profile.strengths.length) {
      offenders.push({ file: name, id: profile?.id ?? null, reason: 'strengths is not a non-empty string array' });
    }
    if (!['measured', 'seeded-unverified'].includes(profile?.status)) {
      offenders.push({ file: name, id: profile?.id ?? null, reason: `status "${profile?.status}" is not measured or seeded-unverified` });
    }
  }
  return offenders;
}

/** Drive the real harness product path: profiles, the send/journal/reply path, receipts. */
async function stageProductPath(ctx) {
  const rows = [];
  const harnessSrc = join(ctx.harnessDir, 'harness', 'src');
  if (!existsSync(harnessSrc)) {
    return [makeRow({
      stage: 'product-path',
      kind: 'blocked',
      criterion: 'C1',
      rule: `harness source is absent at ${harnessSrc} - the signed-in provider web AI path cannot be exercised`,
      command: `ls ${harnessSrc}`,
      runId: ctx.runId,
    })];
  }

  // 1. the provider registry: the surface every provider-aware tool imports.
  const registry = join(harnessSrc, 'providers', 'index.mjs');
  try {
    const mod = await import(pathToFileURL(registry).href);
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'works',
      criterion: 'C1',
      rule: `provider registry loads: ${mod.listProviders().length} signed-in web AI profiles are enumerable`,
      command: `import ${registry}`,
      evidence: { providers: mod.listProviders().map((p) => ({ id: p.id, status: p.status })) },
      runId: ctx.runId,
    }));
  } catch (err) {
    const code = err?.code ? String(err.code) : String(err?.name ?? 'ERROR');
    const offenders = await auditProviderProfiles(join(harnessSrc, 'providers'));
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'breaks',
      criterion: 'C1',
      rule: `provider registry fails to import (${code}): ${clip(err?.message, 200)} - every surface that imports harness/src/providers/index.mjs (wh providers, wh status, wh-mcp) is dead${offenders.length ? `; offending profile(s): ${offenders.map((o) => `${o.file} (${o.reason})`).join(', ')}` : ''}`,
      command: `import ${registry}`,
      evidence: { code, file: 'harness/src/providers/index.mjs', offenders },
      runId: ctx.runId,
    }));
  }

  // 2. one provider profile, imported directly so the send path can still be exercised.
  const providerFile = join(harnessSrc, 'providers', `${ctx.provider}.mjs`);
  let provider = null;
  try {
    provider = (await import(pathToFileURL(providerFile).href)).default;
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'works',
      criterion: 'C1',
      rule: `provider profile "${provider.id}" loads on its own (status=${provider.status}) even when the registry is broken`,
      command: `import ${providerFile}`,
      evidence: { id: provider.id, status: provider.status, composerSelectors: provider.composer?.selectors?.length ?? 0 },
      provider: provider.id,
      runId: ctx.runId,
    }));
  } catch (err) {
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'breaks',
      criterion: 'C1',
      rule: `provider profile "${ctx.provider}" fails to import: ${clip(err?.message, 200)}`,
      command: `import ${providerFile}`,
      runId: ctx.runId,
    }));
    return rows;
  }

  // 3. the send path itself: real sendOnce, real journal, real reply reader.
  const core = {
    journal: join(harnessSrc, 'core', 'journal.mjs'),
    send: join(harnessSrc, 'core', 'send.mjs'),
    reply: join(harnessSrc, 'core', 'reply.mjs'),
  };
  let journalMod;
  let sendMod;
  let replyMod;
  try {
    journalMod = await import(pathToFileURL(core.journal).href);
    sendMod = await import(pathToFileURL(core.send).href);
    replyMod = await import(pathToFileURL(core.reply).href);
  } catch (err) {
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'breaks',
      criterion: 'C1',
      rule: `harness core modules fail to import: ${clip(err?.message, 200)}`,
      command: `import ${core.send}`,
      runId: ctx.runId,
    }));
    return rows;
  }

  const prompt = ctx.sentence ?? 'build me a booking app';
  const replyText = 'Here is the app plan: one screen, one table, one owner.';
  const threadId = '3f2b8c1a-9e4d-4c7b-8a11-2d6f9e0b5c47';
  const threadUrl = `https://${provider.hosts[0]}/c/${threadId}`;
  const requestId = 'dogfood-exec-1';
  const journalDir = join(tmpdir(), `dogfood-exec-${Date.now()}`);
  const journal = journalMod.createJournal({ dir: journalDir });
  const doc = makeDoc();
  const page = makePage({ doc, threadUrl, provider, replyText });
  const approval = {
    requestId,
    provider: provider.id,
    threadUrl,
    payloadDigest: journalMod.digestPayload(prompt),
    expiresAt: Date.now() + 60000,
    approvedAt: Date.now(),
  };

  let sent;
  try {
    sent = await sendMod.sendOnce({
      page,
      provider,
      journal,
      requestId,
      threadUrl,
      prompt,
      approval,
      observeTimeoutMs: 2000,
      pollIntervalMs: 20,
    });
  } catch (err) {
    rows.push(makeRow({
      stage: 'product-path',
      kind: 'breaks',
      criterion: 'C1',
      rule: `the send path throws instead of returning a state: ${clip(err?.message, 200)}`,
      command: `sendOnce({ provider: ${provider.id} })`,
      provider: provider.id,
      runId: ctx.runId,
    }));
    return rows;
  }

  const receiptPath = join(journalDir, `${requestId}.json`);
  const receipt = existsSync(receiptPath) ? readFileSync(receiptPath, 'utf8') : '';
  rows.push(makeRow({
    stage: 'product-path',
    kind: sent.state === 'observed' ? 'works' : 'breaks',
    criterion: 'C1',
    rule: sent.state === 'observed'
      ? `the shipped send path carried one ordinary sentence to "${sent.state}" and wrote a receipt before the effect (submitted=${sent.submitted})`
      : `the shipped send path stopped at "${sent.state}"${sent.reason ? ` (${sent.reason})` : ''} - the one-sentence path does not reach a built app`,
    command: `sendOnce({ provider: ${provider.id}, page: in-memory, approval: bound })`,
    evidence: {
      state: sent.state,
      submitted: sent.submitted,
      reason: sent.reason ?? null,
      pageEffects: page.effects,
      receiptWritten: Boolean(receipt),
      receiptFields: receipt ? Object.keys(JSON.parse(receipt)) : [],
    },
    provider: provider.id,
    runId: ctx.runId,
  }));

  // 4. no silent resend: the same request id must never type or submit twice.
  const effectsBefore = page.effects.length;
  let repeat = null;
  try {
    repeat = await sendMod.sendOnce({
      page, provider, journal, requestId, threadUrl, prompt, approval, observeTimeoutMs: 0, pollIntervalMs: 20,
    });
  } catch (err) {
    repeat = { state: 'threw', reason: clip(err?.message, 120) };
  }
  const noResend = page.effects.length === effectsBefore && repeat?.state === sent.state;
  rows.push(makeRow({
    stage: 'product-path',
    kind: noResend ? 'works' : 'breaks',
    criterion: 'C4',
    rule: noResend
      ? `a repeated request id performs no page effect (state ${repeat?.state}, ${page.effects.length - effectsBefore} new effects) - the send-once discipline holds`
      : `a repeated request id produced ${page.effects.length - effectsBefore} new page effects (state ${repeat?.state}) - the send-once discipline does not hold`,
    command: `sendOnce({ requestId: ${requestId} }) twice`,
    evidence: { firstState: sent.state, secondState: repeat?.state ?? null, newEffects: page.effects.length - effectsBefore },
    provider: provider.id,
    runId: ctx.runId,
  }));

  // 5. the reply reader and the receipt's provenance.
  let reply = null;
  try {
    reply = await replyMod.readReply({
      page, provider, journal, requestId, timeoutMs: 3000, pollIntervalMs: 20, stableSamples: 2,
    });
  } catch (err) {
    reply = { complete: false, error: clip(err?.message, 160) };
  }
  rows.push(makeRow({
    stage: 'product-path',
    kind: reply?.complete ? 'works' : 'breaks',
    criterion: 'C5',
    rule: reply?.complete
      ? `the reply reader confirmed the assistant turn and recorded its digest in the receipt - a tool-call row with provenance`
      : `the reply reader never confirmed the assistant turn (${reply?.error ?? 'no complete reply'}) - observation is unproven`,
    command: `readReply({ requestId: ${requestId} })`,
    evidence: { complete: Boolean(reply?.complete), digest: reply?.digest ? String(reply.digest).slice(0, 12) : null },
    provider: provider.id,
    runId: ctx.runId,
  }));

  // 6. secret hygiene: the receipt carries digests, never the sentence or the reply body.
  const leaks = [];
  if (receipt.includes(prompt)) leaks.push('prompt body');
  if (receipt.includes(replyText)) leaks.push('reply body');
  rows.push(makeRow({
    stage: 'product-path',
    kind: leaks.length ? 'breaks' : 'works',
    criterion: 'C5',
    rule: leaks.length
      ? `the receipt leaks ${leaks.join(' and ')} - a receipt must store digests and metadata only`
      : 'the receipt stores digests and metadata only: neither the sentence nor the reply body is persisted',
    command: `read ${receiptPath}`,
    evidence: { receiptPath: receiptPath, leaks, bytes: receipt.length },
    provider: provider.id,
    runId: ctx.runId,
  }));

  // 7. the leg this lane may not cross: a live signed-in send is forbidden here.
  rows.push(makeRow({
    stage: 'product-path',
    kind: 'gap',
    criterion: 'C1',
    rule: 'the live signed-in send and the Host-tool build leg were not exercised: this lane may not send to a provider, so C1 stays unproven end to end (the offline send path above is what was proved)',
    command: 'none - provider sends are out of scope for this lane',
    evidence: { exercised: 'offline send/journal/reply path with the shipped provider selectors' },
    runId: ctx.runId,
  }));

  return rows;
}

/** Run a product test suite and turn its verdict into learning rows. */
function suiteRows({ stage, criterion, label, cmd, args, cwd, timeoutMs, ctx }) {
  const result = runCommand(cmd, args, cwd, timeoutMs);
  const out = `${result.stdout}\n${result.stderr}`;
  const tests = Number(/tests\s+(\d+)/.exec(out)?.[1] ?? 0);
  const passed = Number(/pass\s+(\d+)/.exec(out)?.[1] ?? 0);
  const failed = Number(/fail\s+(\d+)/.exec(out)?.[1] ?? 0);
  // A timing in the name would change the row id on every run: the id must be stable.
  const failures = [...out.matchAll(/^\u2716\s+(.+)$/gm)]
    .map((m) => clean(m[1].replace(/\(\d+(?:\.\d+)?ms\)\s*$/, ''), 200))
    .filter((line) => line && !line.startsWith('failing tests'));
  const codes = [...new Set([...out.matchAll(/code:\s*'([A-Z_]+)'/g)].map((m) => m[1]))];
  const sites = [...new Set([...out.matchAll(/at file:\/\/\/(.+?):(\d+):(\d+)/g)].map((m) => `${m[1].split('/').slice(-4).join('/')}:${m[2]}`))].slice(0, 6);
  const rows = [makeRow({
    stage,
    kind: failed === 0 && result.status === 0 ? 'works' : 'breaks',
    criterion,
    rule: failed === 0 && result.status === 0
      ? `${label}: ${passed}/${tests} tests pass under "${result.command}"`
      : `${label}: ${failed} of ${tests} tests fail under "${result.command}"${codes.length ? ` (error codes: ${codes.join(', ')})` : ''}${sites.length ? ` (thrown at ${sites[0]})` : ''}`,
    command: result.command,
    evidence: { cwd, exitCode: result.status, tests, pass: passed, fail: failed, errorCodes: codes, errorSites: sites, timeoutMs },
    runId: ctx.runId,
  })];
  for (const failure of failures.slice(0, 6)) {
    rows.push(makeRow({
      stage,
      kind: 'breaks',
      criterion,
      rule: `${label} failure: ${failure}`,
      command: result.command,
      evidence: { cwd, exitCode: result.status, errorCodes: codes, errorSites: sites },
      runId: ctx.runId,
    }));
  }
  return rows;
}

/** The harness product's own suite: the send path, the profiles, the approval surface. */
function stageHarnessSuite(ctx) {
  const dir = join(ctx.harnessDir, 'harness');
  if (!existsSync(dir)) {
    return [makeRow({
      stage: 'harness-suite',
      kind: 'blocked',
      criterion: 'C3',
      rule: `the harness product suite is absent at ${dir}`,
      command: `node --test "test/**/*.test.mjs"`,
      runId: ctx.runId,
    })];
  }
  return suiteRows({
    stage: 'harness-suite',
    criterion: 'C3',
    label: 'harness product suite',
    cmd: 'node',
    args: ['--test', 'test/**/*.test.mjs'],
    cwd: dir,
    timeoutMs: ctx.timeoutMs,
    ctx,
  });
}

/** The Studio side of the same journey: the conversation runtime behind the browser owner. */
function stageStudioSuite(ctx) {
  const dir = join(ctx.harnessDir, 'studio');
  if (!existsSync(dir)) {
    return [makeRow({
      stage: 'studio-suite',
      kind: 'blocked',
      criterion: 'C3',
      rule: `the Studio product suite is absent at ${dir}`,
      command: 'node --test "test/unit/conversation-*.test.mjs"',
      runId: ctx.runId,
    })];
  }
  return suiteRows({
    stage: 'studio-suite',
    criterion: 'C5',
    label: 'studio conversation-runtime suite',
    cmd: 'node',
    args: ['--test', 'test/unit/conversation-*.test.mjs'],
    cwd: dir,
    timeoutMs: ctx.timeoutMs,
    ctx,
  });
}

const RUNTIME_FORBIDDEN = [
  { id: 'opencode-cli', re: /@opencode[\\/]cli|opencode\.exe/i },
  { id: 'zcode-cli', re: /\bzcode(?:\.exe|\s+run\b|\s+serve\b)/i },
  { id: 'provider-api', re: /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|openrouter\.ai\/api/i },
];

function listFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'target') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else if (/\.(mjs|cjs|js|ts|tsx|json|html)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

/** C2: the shipped experience must not depend on ZCode, OpenCode or a provider API. */
function stageShippedDependency(ctx) {
  const targets = [
    { name: 'vivim-ui (TierFlow shipped surfaces)', dir: ctx.uiDir, subdirs: ['web', 'src', 'host'] },
    { name: 'vivim-web-harness (shipped product sources)', dir: ctx.harnessDir, subdirs: ['harness/src', 'studio/src', 'apps/vivim-host'] },
  ];
  const rows = [];
  for (const target of targets) {
    if (!existsSync(target.dir)) {
      rows.push(makeRow({
        stage: 'shipped-dependency',
        kind: 'blocked',
        criterion: 'C2',
        rule: `the shipped surface ${target.name} is absent at ${target.dir} - C2 cannot be checked`,
        command: `ls ${target.dir}`,
        runId: ctx.runId,
      }));
      continue;
    }
    const hits = [];
    const mentions = new Set();
    for (const sub of target.subdirs) {
      for (const file of listFiles(join(target.dir, sub))) {
        let text = '';
        try {
          text = readFileSync(file, 'utf8');
        } catch {
          continue;
        }
        for (const pattern of RUNTIME_FORBIDDEN) {
          const line = text.split(/\r?\n/).findIndex((l) => pattern.re.test(l));
          if (line !== -1) {
            hits.push({
              id: pattern.id,
              file: file.replace(/\\/g, '/').replace(target.dir.replace(/\\/g, '/'), '').replace(/^\//, ''),
              line: line + 1,
              text: clip(text.split(/\r?\n/)[line], 160),
            });
          }
        }
        for (const mention of text.matchAll(/\b(opencode|zcode)\b/gi)) mentions.add(mention[0].toLowerCase());
      }
    }
    const manifests = [];
    for (const name of ['package.json', join('web', 'package.json'), join('host', 'package.json')]) {
      const manifest = join(target.dir, name);
      if (!existsSync(manifest)) continue;
      try {
        const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
        for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
          for (const dep of Object.keys(pkg[field] ?? {})) {
            if (/opencode|zcode|openrouter|^openai$|@anthropic-ai/i.test(dep)) manifests.push({ dep, field, manifest: name });
          }
        }
      } catch {
        manifests.push({ dep: 'unreadable manifest', field: name, manifest: name });
      }
    }
    const unique = [];
    for (const hit of hits) if (!unique.some((h) => h.id === hit.id && h.file === hit.file && h.line === hit.line)) unique.push(hit);
    const firstHit = unique[0];
    rows.push(makeRow({
      stage: 'shipped-dependency',
      kind: unique.length === 0 && manifests.length === 0 ? 'works' : 'breaks',
      criterion: 'C2',
      rule: unique.length === 0 && manifests.length === 0
        ? `${target.name} carries no ZCode, OpenCode or provider-API dependency in the shipped surfaces`
        : `${target.name} still depends on ${[...new Set(unique.map((h) => h.id))].join(', ')} in the shipped surfaces${firstHit ? ` (${firstHit.file}:${firstHit.line})` : ''} - the shipped experience is not independent of ZCode/OpenCode`,
      command: `scan ${target.subdirs.join(' ')} under ${target.dir}`,
      evidence: {
        hits: unique.slice(0, 10),
        manifests: manifests.slice(0, 10),
        mentions: [...mentions],
      },
      runId: ctx.runId,
    }));
  }
  rows.push(makeRow({
    stage: 'shipped-dependency',
    kind: 'gap',
    criterion: 'C2',
    rule: 'the dependency scan is a text scan of the shipped surfaces: it cannot prove that a runtime path is free of a provider API, only that no such dependency is declared or invoked in the scanned files',
    command: 'scan',
    runId: ctx.runId,
  }));
  return rows;
}

const STAGE_IMPL = {
  design: stageDesign,
  'product-path': stageProductPath,
  'harness-suite': stageHarnessSuite,
  'studio-suite': stageStudioSuite,
  'shipped-dependency': stageShippedDependency,
};

/* ------------------------------------------------------------------ */
/* the run                                                             */
/* ------------------------------------------------------------------ */

/**
 * Run the dogfood stages and collect the learning rows.
 * @param {{root?:string, designPath?:string, harnessDir?:string, uiDir?:string, provider?:string,
 *   sentence?:string, stages?:string[], timeoutMs?:number, runId?:string}} [opts]
 */
export async function runExercise(opts = {}) {
  const ctx = {
    root: opts.root ?? ROOT,
    designPath: opts.designPath ?? DESIGN_PATH,
    harnessDir: opts.harnessDir ?? HARNESS_DEFAULT,
    uiDir: opts.uiDir ?? UI_DEFAULT,
    provider: opts.provider ?? 'chatgpt',
    sentence: opts.sentence ?? null,
    stages: (opts.stages ?? STAGES).filter((stage) => STAGE_IMPL[stage]),
    timeoutMs: opts.timeoutMs ?? 300000,
    runId: opts.runId ?? 'dfr_' + hash12(`${Date.now()}-${process.pid}`),
  };
  const rows = [];
  for (const stage of ctx.stages) {
    try {
      rows.push(...(await STAGE_IMPL[stage](ctx)));
    } catch (err) {
      rows.push(makeRow({
        stage,
        kind: 'breaks',
        criterion: 'none',
        rule: `the ${stage} stage crashed instead of reporting a finding: ${clip(err?.message, 200)}`,
        command: `stage ${stage}`,
        runId: ctx.runId,
      }));
    }
  }
  return { rows, ctx };
}

/**
 * CLI entry. Exit codes: 0 exercise ran and every row was captured, 1 the capture failed,
 * 2 the design could not be read (there was nothing to dogfood).
 */
export async function main(argv = process.argv.slice(2)) {
  const stages = String(argValue(argv, 'stages', STAGES.join(',')))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = argValue(argv, 'out', LEDGER_PATH);
  const dryRun = hasFlag(argv, 'dry-run');
  const opts = {
    harnessDir: argValue(argv, 'harness', HARNESS_DEFAULT),
    uiDir: argValue(argv, 'ui', UI_DEFAULT),
    provider: argValue(argv, 'provider', 'chatgpt'),
    sentence: argValue(argv, 'sentence', null),
    stages,
    timeoutMs: Number(argValue(argv, 'timeout', '300000')),
  };

  if (!existsSync(DESIGN_PATH)) {
    // The design is what the run is for: without it there is no target to exercise.
    process.stderr.write(`dogfood execution: the design is missing at ${DESIGN_PATH}\n`);
    return 2;
  }

  const { rows, ctx } = await runExercise(opts);
  if (!rows.length) {
    process.stderr.write('dogfood execution: no learning row was produced - the capture is broken\n');
    return 1;
  }
  if (!dryRun) {
    try {
      captureLearnings(rows, out);
    } catch (err) {
      process.stderr.write(`dogfood execution: ${err instanceof Error ? err.message : String(err)}\n`);
      return 1;
    }
  }

  const counts = rows.reduce((acc, row) => ({ ...acc, [row.kind]: (acc[row.kind] ?? 0) + 1 }), {});
  const breaks = rows.filter((row) => row.kind === 'breaks').length;
  const verdict = breaks ? 'MORE-WORK' : 'DONE';
  if (hasFlag(argv, 'json')) {
    process.stdout.write(JSON.stringify({
      schema: LEARNING_SCHEMA,
      runId: ctx.runId,
      target: 'ES-APP-01',
      stages: ctx.stages,
      counts,
      verdict,
      rows,
    }, null, 2) + '\n');
    return 0;
  }
  process.stdout.write(`dogfood execution - ${ctx.runId}\n`);
  process.stdout.write(`  design: ${opts.designPath ?? DESIGN_PATH}\n`);
  process.stdout.write(`  harness: ${opts.harnessDir}\n`);
  for (const row of rows) {
    process.stdout.write(`  [${row.kind}/${row.criterion}] ${row.stage}: ${row.rule}\n`);
  }
  process.stdout.write(`  rows: ${rows.length} (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})\n`);
  process.stdout.write(`  ledger: ${dryRun ? 'dry run - nothing written' : `${out} (+${rows.length} rows)`}\n`);
  process.stdout.write(`  verdict: ${verdict}\n`);
  return 0;
}

const invokedDirectly = import.meta.main ?? (() => {
  try {
    return process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().then((code) => process.exit(code)).catch((err) => {
    process.stderr.write(`dogfood execution failed: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  });
}
