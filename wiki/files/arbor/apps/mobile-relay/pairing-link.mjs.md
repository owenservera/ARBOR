# File: apps/mobile-relay/pairing-link.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/pairing-link.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1489 B |
| Lines | 25 |
| Hash | d0e0a260a386 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| parsePairFragment | function | 2 | yes | export function parsePairFragment(fragment) { |
| raw | const | 3 | no | const raw = String(fragment \|\| &#39;&#39;).replace(/^#/, &#39;&#39;); |
| value | variable | 5 | no | let value; |
| redeemDevicePairToken | function | 11 | yes | export async function redeemDevicePairToken(token, {direct,fetchImpl}) { |
| response | const | 14 | no | const response = await fetchImpl(&#39;/mobile/api/pair&#39;, { method:&#39;POST&#39;,credentials:&#39;same-origin&#39;,cache:&#39;no-store&#39;, headers:{&#39;content-type&#39;:&#39;application/json&#39;},body:JSON.stringify({token}) }); |
| body | const | 18 | no | const body = await response.json().catch(() =&gt; null); |
| reason | const | 20 | no | const reason = body?.error \|\| &#39;Pairing was not confirmed&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/app.js](./app.js.md) | ./pairing-link.mjs |
| [apps/mobile-relay/test/a08-paired-pwa-acceptance.test.mjs](./test/a08-paired-pwa-acceptance.test.mjs.md) | ../pairing-link.mjs |
| [apps/mobile-relay/test/pairing-link.test.mjs](./test/pairing-link.test.mjs.md) | ../pairing-link.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Single-use Direct device enrollment. Explicitly separate it from legacy relay-secret pairing.
export function parsePairFragment(fragment) {
  const raw = String(fragment || '').replace(/^#/, '');
  if (!raw || raw.startsWith('ask=')) return {type:'none'};
  let value;
  try { value = decodeURIComponent(raw); } catch { return {type:'invalid'}; }
  if (/^[a-f0-9]{64}$/.test(value)) return {type:'device',token:value};
  if (/^[A-Za-z0-9._~-]{8,256}$/.test(value)) return {type:'legacy',value};
  return {type:'invalid'};
}
export async function redeemDevicePairToken(token, {direct,fetchImpl}) {
  if (!direct) throw new Error('Open this link through your private VIVIM connection.');
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) throw new Error('Invalid pairing code.');
  const response = await fetchImpl('/mobile/api/pair', {
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'content-type':'application/json'},body:JSON.stringify({token})
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.enrollmentRequired || typeof body.challengeId !== 'string') {
    const reason = body?.error || 'Pairing was not confirmed';
    throw new Error(response.status === 410 ? 'This code expired. Create a new code on the PC.' :
      response.status === 409 ? 'This device is already paired or this code was used.' : reason);
  }
  return { ...body, paired: false, status: 'enrollment_required' };
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
