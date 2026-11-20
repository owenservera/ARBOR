# File: apps/vivim-host/test/phone-sessions.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/phone-sessions.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9132 B |
| Lines | 149 |
| Hash | b8ec9850c3e9 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 14 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| hostRoot | const | 15 | no | const hostRoot = path.resolve(here, &#39;..&#39;); |
| appsRoot | const | 16 | no | const appsRoot = path.resolve(hostRoot, &#39;..&#39;); |
| conversation | const | 17 | no | const conversation = &#39;c-&#39; + &#39;a&#39;.repeat(16); |
| codeLines | function | 20 | no | const codeLines = (source) =&gt; source.split(/\\r?\\n/) |
| files | const | 24 | no | const files = []; |
| walk | function | 25 | no | const walk = (dir) =&gt; { |
| full | const | 28 | no | const full = path.join(dir, entry.name); |
| source | const | 36 | no | const source = readFileSync(file, &#39;utf8&#39;); |
| code | const | 37 | no | const code = codeLines(source).join(&#39;\\n&#39;); |
| relative | const | 38 | no | const relative = path.relative(appsRoot, file).replace(/\\\\/g, &#39;/&#39;); |
| source | const | 46 | no | const source = readFileSync(path.join(hostRoot, relative), &#39;utf8&#39;); |
| code | const | 47 | no | const code = codeLines(source).join(&#39;\\n&#39;); |
| source | const | 52 | no | const source = readFileSync(path.join(hostRoot, &#39;phone-sessions.mjs&#39;), &#39;utf8&#39;); |
| harness | function | 56 | no | function harness(dataRoot) { |
| bridge | const | 57 | no | const bridge = createBridgeStore({ root: dataRoot }); |
| live | const | 58 | no | const live = createSourceVerifiedLiveProjection({ dataRoot, worldId: &#39;world-local&#39; }); |
| store | const | 60 | no | const store = { |
| chat | const | 62 | no | const chat = { ...Object.fromEntries( [&#39;mode&#39;, &#39;conversationId&#39;, &#39;newChat&#39;, &#39;target&#39;, &#39;attachments&#39;, &#39;action&#39;, &#39;preset&#39;, &#39;messageId&#39;] .filter(key =&gt; record[key] !== undefined).map(key =&gt; [key, record… |
| root | const | 76 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;phone-sessions-&#39;)); |
| sessions | const | 84 | no | const sessions = await route({ method: &#39;GET&#39;, relayPath: &#39;sessions&#39; }); |
| legacy | const | 90 | no | const legacy = await route({ method: &#39;GET&#39;, relayPath: &#39;opencode/sessions&#39; }); |
| before | const | 93 | no | const before = await route({ method: &#39;GET&#39;, relayPath: `sessions/${conversation}/messages` }); |
| after | const | 101 | no | const after = await route({ method: &#39;GET&#39;, relayPath: `sessions/${conversation}/messages` }); |
| root | const | 109 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;phone-sessions-&#39;)); |
| messageId | const | 116 | no | const messageId = &#39;msg_&#39; + &#39;d&#39;.repeat(32); |
| accepted | const | 117 | no | const accepted = await route({ method: &#39;POST&#39;, relayPath: `sessions/${conversation}/prompt`, body: { id: messageId, text: &#39;second question&#39; } }); |
| queued | const | 119 | no | const queued = bridge.list({ limit: 20 }).items.filter(item =&gt; item.mode === &#39;relay-chat&#39;); |
| admitted | const | 121 | no | const admitted = queued.find(item =&gt; item.messageId === messageId); |
| transcript | const | 128 | no | const transcript = await route({ method: &#39;GET&#39;, relayPath: `sessions/${conversation}/messages` }); |
| root | const | 139 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;phone-sessions-&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |
| ../../../studio/src/studio/bridge-commands.mjs | import | 10 | [studio/src/studio/bridge-commands.mjs](../../../studio/src/studio/bridge-commands.mjs.md) |
| ../conversations/live-projection.mjs | import | 11 | [apps/vivim-host/conversations/live-projection.mjs](../conversations/live-projection.mjs.md) |
| ../phone-sessions.mjs | import | 12 | [apps/vivim-host/phone-sessions.mjs](../phone-sessions.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// WO-034 — the shipped Host phone route is VIVIM-owned.
// Pins the absence of the OpenCode CLI dependency and proves the VIVIM-owned
// session route works from local VIVIM state alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';
import { createSourceVerifiedLiveProjection } from '../conversations/live-projection.mjs';
import { createPhoneSessions } from '../phone-sessions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const hostRoot = path.resolve(here, '..');
const appsRoot = path.resolve(hostRoot, '..');
const conversation = 'c-' + 'a'.repeat(16);

// Prose in a comment may name the removed dependency; executable code may not.
const codeLines = (source) => source.split(/\r?\n/)
  .filter(line => !/^\s*(\/\/|\/\*|\*)/.test(line));

test('no shipped app depends on the OpenCode CLI', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'test' || entry.name === 'fixtures') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (/\.(mjs|js|cjs)$/.test(entry.name)) files.push(full);
    }
  };
  walk(appsRoot);
  assert.ok(files.length > 10, 'the shipped apps must be scanned');
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const code = codeLines(source).join('\n');
    const relative = path.relative(appsRoot, file).replace(/\\/g, '/');
    assert.equal(/@opencode[\\/]cli/.test(code), false, `${relative} must not reference the OpenCode CLI package`);
    assert.equal(/opencode\.exe/i.test(code), false, `${relative} must not reference the OpenCode native executable`);
  }
});

test('the phone session route starts no child process and needs no OpenCode install', () => {
  for (const relative of ['phone-sessions.mjs', 'direct-phone.mjs']) {
    const source = readFileSync(path.join(hostRoot, relative), 'utf8');
    const code = codeLines(source).join('\n');
    assert.equal(/child_process/.test(code), false, `${relative} must not import a child process`);
    assert.equal(/\b(execFile|execSync|spawn|spawnSync|fork)\s*\(/.test(code), false, `${relative} must not spawn a process`);
    assert.equal(/APPDATA/.test(code), false, `${relative} must not resolve an OpenCode CLI install`);
  }
  const source = readFileSync(path.join(hostRoot, 'phone-sessions.mjs'), 'utf8');
  assert.equal(/createOpenCodePhone/.test(source), false, 'the OpenCode CLI bridge factory is gone');
});

function harness(dataRoot) {
  const bridge = createBridgeStore({ root: dataRoot });
  const live = createSourceVerifiedLiveProjection({ dataRoot, worldId: 'world-local' });
  // The same durable acceptance the Host performs for a relay-chat command.
  const store = {
    async putCommand(record) {
      const chat = { ...Object.fromEntries(
        ['mode', 'conversationId', 'newChat', 'target', 'attachments', 'action', 'preset', 'messageId']
          .filter(key => record[key] !== undefined).map(key => [key, record[key]])), transport: 'direct' };
      bridge.create({ id: record.id, origin: 'relay', text: record.text, kind: record.kind,
        consumer: record.consumer, stage: record.stage, chat });
      if (record.mode === 'relay-chat' && record.conversationId) {
        try { await live.recordAcceptedRelay(record.id); } catch { /* projection is recoverable */ }
      }
    },
  };
  return { bridge, live, store, route: createPhoneSessions({ dataRoot, worldId: 'world-local', bridge, live, store }) };
}

test('the phone session route serves VIVIM conversations and their transcript', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'phone-sessions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { bridge, route } = harness(root);
  // A VIVIM relay-chat command: the canonical ledger is the only source.
  const record = bridge.create({
```

_First 80 of 150 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
