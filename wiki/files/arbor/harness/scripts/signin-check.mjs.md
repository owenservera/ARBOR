# File: harness/scripts/signin-check.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/scripts/signin-check.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1355 B |
| Lines | 24 |
| Hash | 8814b5516e17 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| port | const | 7 | no | const port = Number(process.argv[2] \|\| 9333); |
| only | const | 8 | no | const only = process.argv.slice(3); |
| browser | const | 9 | no | const browser = await connect({ port }); |
| ids | const | 10 | no | const ids = (await listProviders()).map((p) =&gt; p.id).filter((id) =&gt; !only.length \|\| only.includes(id)); |
| out | const | 11 | no | const out = []; |
| provider | const | 13 | no | const provider = await getProvider(id); |
| page | variable | 14 | no | let page; |
| finalUrl | const | 17 | no | const finalUrl = new URL(await page.url()); |
| snap | const | 18 | no | const snap = await page.evaluate(snapshotExpression(provider)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../src/core/cdp.mjs | import | 3 | [harness/src/core/cdp.mjs](../src/core/cdp.mjs.md) |
| ../src/core/send.mjs | import | 4 | [harness/src/core/send.mjs](../src/core/send.mjs.md) |
| ../src/providers/index.mjs | import | 5 | [harness/src/providers/index.mjs](../src/providers/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only: opens each provider's landing page in a harness-owned tab, runs the profile's
// auth-wall/composer probe, then closes that tab. Never types, clicks, or reads page text/cookies.
import { connect } from '../src/core/cdp.mjs';
import { snapshotExpression } from '../src/core/send.mjs';
import { listProviders, getProvider } from '../src/providers/index.mjs';

const port = Number(process.argv[2] || 9333);
const only = process.argv.slice(3);
const browser = await connect({ port });
const ids = (await listProviders()).map((p) => p.id).filter((id) => !only.length || only.includes(id));
const out = [];
for (const id of ids) {
  const provider = await getProvider(id);
  let page;
  try {
    page = await browser.openPage(provider.url);
    const finalUrl = new URL(await page.url());
    const snap = await page.evaluate(snapshotExpression(provider));
    out.push({ provider: id, landed: finalUrl.hostname + finalUrl.pathname, hostOk: provider.hosts.includes(finalUrl.hostname), authWall: !!snap.authWall, composer: !!snap.composer, signedIn: !snap.authWall && !!snap.composer && provider.hosts.includes(finalUrl.hostname) });
  } catch (e) {
    out.push({ provider: id, error: e.code || e.message });
  } finally { try { await page?.close(); } catch { /* ignore */ } }
}
console.log(JSON.stringify(out, null, 2));
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
