# File: hq/catalogue-identity/cli.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/cli.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2806 B |
| Lines | 48 |
| Hash | 9dfaaee8d7aa |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| argv | const | 13 | no | const argv=process.argv.slice(2); |
| arg | function | 14 | no | function arg(name) {const i=argv.indexOf(name);return i&lt;0?null:argv[i+1]??null;} |
| mode | const | 15 | no | const mode=arg(&#39;--input&#39;)?&#39;intake&#39;:arg(&#39;--known-dir&#39;)?&#39;known&#39;:arg(&#39;--labs-capabilities&#39;)?&#39;labs&#39;:null; |
| read | function | 23 | no | const read=(path)=&gt;JSON.parse(readFileSync(resolve(path),&#39;utf8&#39;)); |
| output | variable | 24 | no | let output; |
| d | const | 27 | no | const d=resolve(arg(&#39;--known-dir&#39;)); |
| revisions | const | 28 | no | const revisions=read(`${d}/revisions.json`); |
| dest | const | 39 | no | const dest=resolve(arg(&#39;--out&#39;)); |
| tmp | const | 42 | no | const tmp=`${dest}.tmp-${process.pid}`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| ./crosswalk.mjs | import | 9 | [hq/catalogue-identity/crosswalk.mjs](./crosswalk.mjs.md) |
| ./labs-adapter.mjs | import | 10 | [hq/catalogue-identity/labs-adapter.mjs](./labs-adapter.mjs.md) |
| ./source-adapters.mjs | import | 11 | [hq/catalogue-identity/source-adapters.mjs](./source-adapters.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Bounded local JSON-to-HQ crosswalk export; no network or source mutations. |
| 4 | owner | repos-hq | — | repos-hq |
| 5 | task | — | — | VIVIM-WAVE-C4-LANE-B |

## Excerpt

```javascript
#!/usr/bin/env node
// @ts-check
/** @hq:context Bounded local JSON-to-HQ crosswalk export; no network or source mutations.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildCrosswalk } from './crosswalk.mjs';
import { exportLabsSeed } from './labs-adapter.mjs';
import { adaptKnownCatalogues } from './source-adapters.mjs';

const argv=process.argv.slice(2);
function arg(name) {const i=argv.indexOf(name);return i<0?null:argv[i+1]??null;}
const mode=arg('--input')?'intake':arg('--known-dir')?'known':arg('--labs-capabilities')?'labs':null;
if (!mode || !arg('--out') || (mode==='labs' && (!arg('--labs-sha')||!arg('--as-of')))) {
  process.stderr.write('Usage: node hq/catalogue-identity/cli.mjs --input intake.json --out export.json\n'
    +'   or: node hq/catalogue-identity/cli.mjs --labs-capabilities capabilities.json --labs-sha <40hex> --as-of <ISO8601Z> --out export.json\n'
    +'   or: node hq/catalogue-identity/cli.mjs --known-dir <offline-input-dir> --out export.json\n');
  process.exitCode=2;
} else {
  try {
    const read=(path)=>JSON.parse(readFileSync(resolve(path),'utf8'));
    let output;
    if(mode==='intake') output=buildCrosswalk(read(arg('--input')));
    else if(mode==='known') {
      const d=resolve(arg('--known-dir'));
      const revisions=read(`${d}/revisions.json`);
      output=buildCrosswalk(adaptKnownCatalogues({
        asOf:revisions.as_of,labs:read(`${d}/labs-capabilities.json`),labSha:revisions.labs,
        atomic:read(`${d}/harness-atomic.json`),harnessSha:revisions.harness,
        journey:read(`${d}/harness-journey.json`),
        algorithms:read(`${d}/hq-algorithms.json`),
        inventory:read(`${d}/hq-file-inventory.json`),hqSha:revisions.hq,
        previous:arg('--previous')?read(arg('--previous')):null,
      }));
    } else output=exportLabsSeed({capabilities:read(arg('--labs-capabilities')),labsSha:arg('--labs-sha'),asOf:arg('--as-of'),
      previous:arg('--previous')?read(arg('--previous')):null});
    const dest=resolve(arg('--out'));
    // A caller-chosen output is the only write. Atomic replacement protects crash recovery.
    mkdirSync(dirname(dest),{recursive:true});
    const tmp=`${dest}.tmp-${process.pid}`;
    writeFileSync(tmp,JSON.stringify(output,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    renameSync(tmp,dest);
    process.stdout.write(JSON.stringify({snapshot_sha256:output.snapshot_sha256,counts:output.counts,
      changed:output.delta.changed.length,unavailable:output.delta.retained_unobserved.length})+'\n');
  } catch (e) {process.stderr.write(`crosswalk rejected: ${e.message}\n`);process.exitCode=2;}
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
