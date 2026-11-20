# File: studio/src/profiles/sites/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/profiles/sites/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5150 B |
| Lines | 122 |
| Hash | 487cdb72664c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| adaptersDir | const | 18 | yes | export const adaptersDir = path.dirname(fileURLToPath(import.meta.url)); |
| ADAPTER_IDS | const | 21 | yes | export const ADAPTER_IDS = [&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;deepseek&#39;, &#39;zai&#39;, &#39;qwen&#39;, &#39;grok&#39;, &#39;lmarena&#39;, &#39;minimax&#39;, &#39;kimi&#39;, &#39;duck-ai&#39;]; |
| cache | const | 23 | no | const cache = new Map(); // id -&gt; adapter object \| null (static/handwritten seeds only) |
| learnedProvider | variable | 27 | no | let learnedProvider = null; |
| setLearnedAdapterProvider | function | 28 | yes | export function setLearnedAdapterProvider(provider) { |
| getLearnedAdapterProvider | function | 31 | yes | export function getLearnedAdapterProvider() { return learnedProvider; } |
| normalize | function | 33 | no | function normalize(id, mod) { |
| a | const | 34 | no | const a = mod?.default; |
| loadAdapter | function | 41 | yes | export async function loadAdapter(id) { |
| adapter | variable | 43 | no | let adapter = null; |
| mod | const | 45 | no | const mod = await import(`./${id}.mjs`); |
| listAdapters | function | 55 | yes | export async function listAdapters() { |
| loaded | const | 56 | no | const loaded = await Promise.all(ADAPTER_IDS.map((id) =&gt; loadAdapter(id))); |
| listReadAdapters | function | 70 | yes | export async function listReadAdapters() { |
| seeds | const | 71 | no | const seeds = await listAdapters(); |
| learned | variable | 72 | no | let learned = []; |
| getReadAdapter | function | 84 | yes | export async function getReadAdapter(idOrHost) { |
| seed | const | 85 | no | const seed = await getAdapter(idOrHost); |
| bareHost | function | 91 | no | function bareHost(value) { |
| v | variable | 92 | no | let v = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| getAdapter | function | 102 | yes | export async function getAdapter(idOrHost) { |
| raw | const | 103 | no | const raw = String(idOrHost ?? &#39;&#39;).trim().toLowerCase(); |
| direct | const | 107 | no | const direct = await loadAdapter(raw); |
| host | const | 111 | no | const host = bareHost(raw); |
| a | const | 115 | no | const a = await loadAdapter(id); |
| hosts | const | 117 | no | const hosts = [a.id, ...(a.hosts ?? [])].map(bareHost).filter(Boolean); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 15 | external |
| node:url | import | 16 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/drive.mjs](../../../bin/commands/drive.mjs.md) | ../../src/profiles/sites/index.mjs |
| [studio/scripts/ai-chat-report.mjs](../../../scripts/ai-chat-report.mjs.md) | ../src/profiles/sites/index.mjs |
| [studio/scripts/probe-site.mjs](../../../scripts/probe-site.mjs.md) | ../src/profiles/sites/index.mjs |
| [studio/src/capture/campaign.mjs](../../capture/campaign.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/capture/conversation-runtime.mjs](../../capture/conversation-runtime.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/families/core.mjs](../../families/core.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/studio/conversation-api.mjs](../../studio/conversation-api.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/studio/drive-api.mjs](../../studio/drive-api.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/studio/integration-hub.mjs](../../studio/integration-hub.mjs.md) | ../profiles/sites/index.mjs |
| [studio/src/studio/server.mjs](../../studio/server.mjs.md) | ../profiles/sites/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Site adapter registry.
//
// Adapters live next to this file as `./<id>.mjs` and default-export a plain object (see
// src/capture/actions.mjs for the consumer). They are written by other lanes in parallel, so a
// missing or throwing adapter file is normal: it is skipped, never fatal.
//
// Learned adapters (adaptive webapp adapter factory): the SAME registry also exposes a
// READ-ONLY view over versioned, data-only adapter candidates produced by Capture Studio's
// adapter factory (see src/studio/adapter-factory-service.mjs). This is deliberately NOT a
// second registry: one lookup module, two views. The EXECUTION path (getAdapter, used by
// drive/send) only ever sees handwritten seed adapters — a learned adapter can never influence
// typing, sending or driving. The read view (getReadAdapter/listReadAdapters) serves
// observation, transcript and capsule consumers; learned objects are data-only and carry
// send.strategy 'learned-readonly' as defense in depth.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const adaptersDir = path.dirname(fileURLToPath(import.meta.url));

// The sites this build knows how to drive. An adapter file may be absent at any time.
export const ADAPTER_IDS = ['chatgpt', 'claude', 'gemini', 'deepseek', 'zai', 'qwen', 'grok', 'lmarena', 'minimax', 'kimi', 'duck-ai'];

const cache = new Map(); // id -> adapter object | null (static/handwritten seeds only)

// Injectable read-only provider over learned adapter candidates (set by studio startup).
// Shape: { get(idOrHost) -> Promise<adapter|null>, list() -> Promise<adapter[]> } or null.
let learnedProvider = null;
export function setLearnedAdapterProvider(provider) {
  learnedProvider = provider && typeof provider.get === 'function' ? provider : null;
}
export function getLearnedAdapterProvider() { return learnedProvider; }

function normalize(id, mod) {
  const a = mod?.default;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  if (!a.id) a.id = id;
  if (!Array.isArray(a.hosts)) a.hosts = [];
  return a;
}

export async function loadAdapter(id) {
  if (cache.has(id)) return cache.get(id);
  let adapter = null;
  try {
    const mod = await import(`./${id}.mjs`);
    adapter = normalize(id, mod);
  } catch {
    adapter = null; // missing file, syntax error or a throwing module: not our failure
  }
  cache.set(id, adapter);
  return adapter;
}

// Summaries of the adapters that actually loaded, in ADAPTER_IDS order.
export async function listAdapters() {
  const loaded = await Promise.all(ADAPTER_IDS.map((id) => loadAdapter(id)));
  return loaded.filter(Boolean).map((a) => ({
    id: a.id,
    label: a.label ?? a.id,
    hosts: a.hosts ?? [],
    url: a.url ?? null,
    hasComposer: Array.isArray(a.composer?.selectors) && a.composer.selectors.length > 0,
    sendStrategy: a.send?.strategy ?? 'both',
    requiresAuth: a.preflight?.requiresAuth ?? false,
  }));
}

// Read-view listing: handwritten seeds first, then learned data-only adapters. Consumers are
// observation/transcript surfaces; nothing here feeds drive/send.
export async function listReadAdapters() {
  const seeds = await listAdapters();
  let learned = [];
  if (learnedProvider) {
    try { learned = (await learnedProvider.list()).map((a) => ({
      id: a.id, label: a.label ?? a.id, hosts: a.hosts ?? [], url: a.url ?? null,
      hasComposer: false, sendStrategy: a.send?.strategy ?? 'learned-readonly', requiresAuth: false,
      learned: true, readOnly: true, readFeatures: a.factory?.readFeatures ?? [],
    })); } catch { learned = []; }
  }
  return [...seeds, ...learned];
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
