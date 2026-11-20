# File: studio/bin/commands/drive.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/drive.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9476 B |
| Lines | 139 |
| Hash | 9ecf1ac82eea |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_PROMPT | const | 13 | no | const DEFAULT_PROMPT = &#39;Reply with exactly these 12 words separated by single spaces and nothing else: alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima&#39;; |
| adapterFromUrl | function | 16 | no | function adapterFromUrl(raw) { |
| s | const | 17 | no | const s = String(raw).trim(); |
| withScheme | const | 18 | no | const withScheme = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(s) ? s : /^[^\\s/]+\\.[a-z]{2,}(?:[/:?#]\|$)/i.test(s) ? `https://${s}` : null; |
| u | variable | 20 | no | let u; |
| ref | const | 47 | no | const ref = ctx.args[0]; |
| fromUrl | const | 53 | no | const fromUrl = adapterFromUrl(ref); |
| adapter | variable | 54 | no | let adapter = await getAdapter(ref); |
| known | const | 58 | no | const known = await listAdapters(); |
| prompt | const | 65 | no | const prompt = String(flags.prompt ?? DEFAULT_PROMPT); |
| timeoutMs | const | 66 | no | const timeoutMs = Math.max(5, Number(flags.timeout ?? 120)) * 1000; |
| site | const | 68 | no | const site = adapter.label ? `${adapter.id} (${adapter.label})` : adapter.id; |
| targetUrl | const | 71 | no | const targetUrl = adapter.url ?? (adapter.hosts?.[0] ? `https://${adapter.hosts[0]}/` : null); |
| thread | const | 72 | no | const thread = targetUrl ? parseThread(adapter.id, targetUrl)?.ref ?? null : null; |
| dry | const | 73 | no | const dry = { |
| dataDir | const | 96 | no | const dataDir = ctx.paths.home ?? path.dirname(ctx.paths.sessions); |
| result | const | 97 | no | const result = await driveSite({ adapter, prompt, port: ctx.port, dataDir, record, timeoutMs, freshTab: !flags[&#39;reuse-tab&#39;], humanPace: !flags.fast, attachmentPath: flags.attach ?? null, onEvent: (ev… |
| first | const | 116 | no | const first = result.errors?.[0] ?? result.reason ?? &#39;unknown&#39;; |
| reply | const | 121 | no | const reply = oneLine(result.reply); |
| expect | const | 125 | no | const expect = expectedAnswer(prompt); |
| check | const | 126 | no | const check = expect ? replyMatchesExpectation(result.reply, expect) : null; |
| verified | const | 127 | no | const verified = check ? check.ok : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| ../../src/config.mjs | import | 3 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/profiles/sites/index.mjs | import | 4 | [studio/src/profiles/sites/index.mjs](../../src/profiles/sites/index.mjs.md) |
| ../../src/capture/actions.mjs | import | 5 | [studio/src/capture/actions.mjs](../../src/capture/actions.mjs.md) |
| ../../src/capture/conversation-thread.mjs | import | 6 | [studio/src/capture/conversation-thread.mjs](../../src/capture/conversation-thread.mjs.md) |
| ../../src/chrome/launch.mjs | import | 7 | [studio/src/chrome/launch.mjs](../../src/chrome/launch.mjs.md) |
| ../../src/capture/campaign.mjs | import | 8 | [studio/src/capture/campaign.mjs](../../src/capture/campaign.mjs.md) |
| ../lib/registry.mjs | import | 9 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 10 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/drive.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// drive: type a prompt into a live AI web app through CDP, record the exchange, read the reply.
import path from 'node:path';
import { EXIT } from '../../src/config.mjs';
import { ADAPTER_IDS, getAdapter, listAdapters } from '../../src/profiles/sites/index.mjs';
import { driveSite } from '../../src/capture/actions.mjs';
import { parseThread } from '../../src/capture/conversation-thread.mjs';
import { launchChrome } from '../../src/chrome/launch.mjs';
import { expectedAnswer, replyMatchesExpectation } from '../../src/capture/campaign.mjs';
import { define } from '../lib/registry.mjs';
import { notFound, envError, usageError, oneLine, truncate, fmtMs } from '../lib/ui.mjs';

// Deterministic, so a captured transcript can be checked word for word.
const DEFAULT_PROMPT = 'Reply with exactly these 12 words separated by single spaces and nothing else: alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima';

// `studio drive <site|url>`: a plain URL is driven with the generic heuristics only.
function adapterFromUrl(raw) {
  const s = String(raw).trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : /^[^\s/]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(s) ? `https://${s}` : null;
  if (!withScheme) return null;
  let u;
  try { u = new URL(withScheme); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  return { id: u.hostname.toLowerCase(), label: u.hostname, hosts: [u.hostname], url: u.toString() };
}

define({
  name: 'drive', section: 'Knowledge', usage: '<site|url> [--prompt TEXT] [--timeout S] [--no-record] [--reuse-tab] [--json] [--dry-run]',
  summary: 'Send a prompt to a live AI site, record it and read the reply back',
  description: 'Opens its own tab on that site (or, with --reuse-tab, takes the one already open), refuses to type into a login wall, records the exchange unless --no-record, then waits until the reply stops changing and prints it. A ChatGPT /c/<uuid> URL continues that exact thread: the drive refuses to type unless the tab is on that thread with its history rendered, and fails if the tab leaves the thread mid-turn. Works without a site adapter: the generic heuristics in src/capture/actions.mjs find the composer, the send control and the reply.',
  flags: {
    prompt: { type: 'string', valueName: 'TEXT', desc: 'Prompt to send (default: a fixed 12-word fidelity check)' },
    timeout: { type: 'number', valueName: 'SECONDS', default: 120, desc: 'Give up waiting for the reply after this long' },
    record: { type: 'boolean', desc: 'Capture the exchange as a session (use --no-record to skip)' },
    'dry-run': { type: 'boolean', desc: 'Print the resolved adapter and target, then stop without typing' },
    'reuse-tab': { type: 'boolean', desc: 'Drive the tab already open on that site (brought to front) instead of opening a fresh one; keeps an in-progress guest thread' },
    attach: { type: 'string', valueName: 'PATH', desc: 'Attach one file to the turn before typing the prompt (file input set over CDP)' },
    fast: { type: 'boolean', desc: 'Type at machine speed instead of human pace (owner request: human pacing is too slow)' },
  },
  examples: [
    'studio drive chatgpt',
    'studio drive claude --prompt "Summarize this page in one sentence" --timeout 90',
    'studio drive https://example.ai/ --dry-run',
    'studio drive https://chatgpt.com/c/<uuid> --prompt "Add 3 to that number."',
  ],
  async run(ctx) {
    const { out, flags } = ctx;
    const ref = ctx.args[0];
    if (!ref) throw usageError('Usage: studio drive <site|url> [--prompt TEXT]', 'Example: studio drive chatgpt --dry-run');

    // A full URL on a known site keeps that site's measured selectors AND its own address: a
    // https://chatgpt.com/c/<uuid> ref must open that thread, not the site's home page. The adapter
    // object is shared (cached), so the address is overlaid on a copy, never written into it.
    const fromUrl = adapterFromUrl(ref);
    let adapter = await getAdapter(ref);
    if (adapter && fromUrl && new URL(fromUrl.url).pathname !== '/') adapter = { ...adapter, url: fromUrl.url };
    if (!adapter) adapter = fromUrl;
    if (!adapter) {
      const known = await listAdapters();
      throw notFound(
        `No site adapter or URL for "${ref}".`,
        known.length ? `Known sites: ${known.map((a) => a.id).join(', ')}. A full URL also works.` : `No adapters are installed yet (expected: ${ADAPTER_IDS.join(', ')}); pass a full https:// URL instead.`,
      );
    }

    const prompt = String(flags.prompt ?? DEFAULT_PROMPT);
    const timeoutMs = Math.max(5, Number(flags.timeout ?? 120)) * 1000;
    const record = flags.record !== false;
    const site = adapter.label ? `${adapter.id} (${adapter.label})` : adapter.id;

    if (flags['dry-run']) {
      const targetUrl = adapter.url ?? (adapter.hosts?.[0] ? `https://${adapter.hosts[0]}/` : null);
      const thread = targetUrl ? parseThread(adapter.id, targetUrl)?.ref ?? null : null;
      const dry = {
        site: adapter.id, label: adapter.label ?? adapter.id, hosts: adapter.hosts ?? [], targetUrl, thread,
        composer: adapter.composer ?? null, send: adapter.send ?? null, assistant: adapter.assistant ?? null,
        preflight: adapter.preflight ?? null, streamHints: adapter.streamHints ?? null,
        prompt, timeoutMs, record,
      };
      out.emit(dry, (o) => {
        o.result(`${site}`);
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
