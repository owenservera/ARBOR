# File: apps/vivim-host/test/device-ui-wiring.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/device-ui-wiring.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2115 B |
| Lines | 39 |
| Hash | 365317c822bb |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | function | 4 | no | const source = path =&gt; readFileSync(new URL(path, import.meta.url), &#39;utf8&#39;); |
| server | const | 7 | no | const server = source(&#39;../server.mjs&#39;); |
| panel | const | 8 | no | const panel = source(&#39;../public/control-panel.js&#39;); |
| html | const | 9 | no | const html = source(&#39;../public/index.html&#39;); |
| direct | const | 26 | no | const direct = source(&#39;../direct-phone.mjs&#39;); |
| app | const | 27 | no | const app = source(&#39;../../mobile-relay/app.js&#39;); |
| transport | const | 28 | no | const transport = source(&#39;../../mobile-relay/transport.mjs&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('desktop device management uses authenticated control session and owner confirmation', () => {
  const server = source('../server.mjs');
  const panel = source('../public/control-panel.js');
  const html = source('../public/index.html');
  assert.match(server, /devices\/approve/);
  assert.match(server, /devices\/revoke/);
  assert.match(server, /uiSessions\.authorized\(req, \{ mutate: isMutation \}\)/);
  assert.match(server, /CONTROL_ACTION_PLAN_REQUIRED/);
  assert.doesNotMatch(server, /enrollment\.approveGrant\(\{ grantId: body\.grantId/);
  assert.match(panel,/plan\(\{actionId:'devices\.approve',args:\{/);
  assert.doesNotMatch(panel,/api\('devices\/approve'/);
  // GUI revocation is routed through the typed owner-approval journal.
  assert.match(panel,/plan\(\{actionId:'devices\.revoke',args:\{grant_id:g\.grantId\}\}\)/);
  assert.doesNotMatch(panel,/api\('devices\/revoke'/);
  assert.match(panel,/Approve & apply on PC/);
  assert.match(html, /id="device-list"/);
  assert.match(html, /id="device-status"/);
});

test('phone QR and Direct transport do not unlock until device grant approval', () => {
  const direct = source('../direct-phone.mjs');
  const app = source('../../mobile-relay/app.js');
  const transport = source('../../mobile-relay/transport.mjs');
  assert.match(direct, /pairing\.consume\(token\)/);
  assert.doesNotMatch(direct, /pairing\.activate\(token/);
  assert.match(direct, /authorizeDevice\(req, req\.method/);
  // The phone must redeem the challenge and enroll before any device unlock. The
  // call takes an explicit signer now, so match on the challenge argument rather
  // than requiring it to be the only one.
  assert.match(app, /enrollWithChallenge\(challenge\b/);
  assert.match(app, /resumeDeviceSession\(transport\)/);
  assert.match(transport, /x-vivim-device-session/);
  assert.match(transport, /setDeviceSession/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
