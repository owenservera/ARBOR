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
