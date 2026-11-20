# File: studio/bin/commands/wrap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/wrap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5388 B |
| Lines | 122 |
| Hash | 720989fbf225 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| emitJson | function | 15 | no | function emitJson(out, data) { |
| runSystem | function | 19 | no | async function runSystem(ctx, sub, flags) { |
| m | const | 23 | no | const m = manifestSummary(); |
| only | const | 45 | no | const only = typeof flags.only === &#39;string&#39; &amp;&amp; flags.only.length ? flags.only.split(&#39;,&#39;).map((s) =&gt; s.trim()).filter(Boolean) : null; |
| result | const | 46 | no | const result = await verifySystem({ only }); |
| surface | const | 63 | no | const surface = await listSurfaces(); |
| m | const | 77 | no | const m = manifestSummary(); |
| result | const | 78 | no | const result = await verifySystem(); |
| data | const | 79 | no | const data = { schema: &#39;vivim.system-status/1&#39;, manifest: m, verify: result }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../lib/registry.mjs | import | 11 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 12 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/studio/system-wrap.mjs | import | 13 | [studio/src/studio/system-wrap.mjs](../../src/studio/system-wrap.mjs.md) |
| ../../src/studio/system-surfaces.mjs | dynamic | 62 | [studio/src/studio/system-surfaces.mjs](../../src/studio/system-surfaces.mjs.md) |
| node:fs | dynamic | 65 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/wrap.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | `studio system` — the wrapper command: manifest, substrates, verification. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-30 |
| 5 | see | — | studio/src/studio/system-wrap.mjs | studio/src/studio/system-wrap.mjs |
| 6 | invariant | — | — | verify exits non-zero when a check fails, so it can gate. |

## Excerpt

```javascript
/**
 * @hq:context `studio system` — the wrapper command: manifest, substrates, verification.
 * @hq:owner atlas
 * @hq:task VC-30
 * @hq:see studio/src/studio/system-wrap.mjs
 * @hq:invariant verify exits non-zero when a check fails, so it can gate.
 */
// One command surface for the whole node. `bin/commands/system.mjs` already owns help/version/
// doctor/config, so the wrapper lives here under the command name `system`.

import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import { manifestSummary, verifySystem, SUBSTRATES, CHECKS } from '../../src/studio/system-wrap.mjs';

function emitJson(out, data) {
  return out.emit(data, (o) => o.line(JSON.stringify(data, null, 2)));
}

async function runSystem(ctx, sub, flags) {
  const { out } = ctx;

  if (sub === 'manifest') {
    const m = manifestSummary();
    if (flags.json) return emitJson(out, m);
    return out.emit(m, (o) => {
      o.result(`manifest v${m.version}  ${m.substrates.length} substrate(s)  ${m.invariantCount} invariant(s)`);
      for (const s of m.substrates) o.line(`  ${s.id.padEnd(13)} ${s.owner.padEnd(16)} ${s.entry}`);
    });
  }

  if (sub === 'substrates') {
    if (flags.json) return emitJson(out, { schema: 'vivim.system-substrates/1', substrates: SUBSTRATES });
    return out.emit(SUBSTRATES, (o) => {
      o.result(`${SUBSTRATES.length} substrate(s)`);
      for (const s of SUBSTRATES) {
        o.line(`  ${s.id.padEnd(13)} ${s.label}`);
        o.line(`  ${' '.repeat(13)} owner=${s.owner}  entry=${s.entry}`);
        o.line(`  ${' '.repeat(13)} provides: ${s.provides}`);
        if (s.cli.length) o.line(`  ${' '.repeat(13)} cli: ${s.cli.join(' · ')}`);
      }
    });
  }

  if (sub === 'verify') {
    const only = typeof flags.only === 'string' && flags.only.length ? flags.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
    const result = await verifySystem({ only });
    if (flags.json) {
      emitJson(out, result);
    } else {
      out.emit(result, (o) => {
        o.result(`verify  ${result.passed}/${result.total} passed  ${result.ok ? 'OK' : 'FAILED'}`);
        for (const c of result.checks) {
          o.line(`  ${c.ok ? 'pass' : 'FAIL'}  ${c.id.padEnd(26)} ${c.detail}`);
        }
      });
    }
    if (!result.ok) process.exitCode = 1;
    return undefined;
  }

  if (sub === 'surfaces') {
    const { listSurfaces, summariseSurface } = await import('../../src/studio/system-surfaces.mjs');
    const surface = await listSurfaces();
    if (typeof flags.out === 'string' && flags.out.length) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(flags.out, JSON.stringify(surface, null, 2) + '\n');
      if (!flags.json) out.info(`wrote ${flags.out}`);
    }
    if (flags.json) return emitJson(out, surface);
    return out.emit(surface, (o) => {
      for (const line of summariseSurface(surface)) o.result(line);
      for (const c of surface.commands) o.line(`  ${c.name.padEnd(28)} ${(c.gated ? "gated" : c.mutating ? "mutating" : "read").padEnd(9)} ${c.section}`);
    });
  }

  if (sub === 'status') {
    const m = manifestSummary();
    const result = await verifySystem();
    const data = { schema: 'vivim.system-status/1', manifest: m, verify: result };
    if (flags.json) {
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
