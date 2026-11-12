/**
 * Final Wave H: source-pinned, READ-ONLY lane import preflight and REAL Integration 4 composition.
 * Nothing here writes files, publishes UI, calls Host actions, or signs a release.
 */
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
import { composeIntegration4, type Integration4Input } from '../../integration-4/compose.ts';
import { LANES, type Lane } from '../lane-h/verification.ts';

export interface LaneImportSpec {
  readonly lane:Lane;
  /** Exact repo-relative source path in its authorized lane; no barrel/autodiscovery. */
  readonly path:string;
  readonly exportedFunction:string;
  /** SHA-256 of exact source bytes (not commit SHA). */
  readonly sha256:string;
}
export interface ImportResult {
  readonly lane:Lane;
  readonly status:'imported'|'blocked'|'unrun';
  readonly code:string;
  readonly sha256:string|null;
}
const HEX64=/^[0-9a-f]{64}$/;
const PATH=/^src\/visual-runtime\/final-wave\/lane-([a-h])\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.ts$/;
const EXPORT=/^[A-Za-z_$][A-Za-z_$0-9]*$/;
const ROOT=fileURLToPath(new URL('../../../../', import.meta.url));
/** No imports before path, realpath, exact byte SHA and export pin preflight. */
export async function importPinnedLaneModules(specs:readonly LaneImportSpec[]):Promise<ImportResult[]> {
  const output:ImportResult[]=[];
  const seen=new Set<Lane>();
  for(const spec of specs){
    if(!LANES.includes(spec.lane) || seen.has(spec.lane)) {
      output.push({lane:spec.lane,status:'blocked',code:'DUPLICATE_OR_UNKNOWN_LANE',sha256:null});continue;
    }
    seen.add(spec.lane);
    const m=PATH.exec(spec.path);
    if(!m || m[1]!==spec.lane.toLowerCase() || !HEX64.test(spec.sha256) || !EXPORT.test(spec.exportedFunction)){
      output.push({lane:spec.lane,status:'blocked',code:'UNSAFE_OR_UNPINNED_IMPORT',sha256:null});continue;
    }
    try {
      const full=resolve(ROOT,spec.path);
      const actual=await realpath(full);
      if(!actual.startsWith(resolve(ROOT,'src/visual-runtime/final-wave',`lane-${spec.lane.toLowerCase()}`)+sep)) {
        output.push({lane:spec.lane,status:'blocked',code:'SYMLINK_ESCAPE',sha256:null});continue;
      }
      const source=await readFile(actual);
      const sha=createHash('sha256').update(source).digest('hex');
      if(sha!==spec.sha256){output.push({lane:spec.lane,status:'blocked',code:'SOURCE_HASH_MISMATCH',sha256:sha});continue;}
      const module:Record<string,unknown>=await import(pathToFileURL(actual).href);
      output.push({lane:spec.lane,status:typeof module[spec.exportedFunction]==='function'?'imported':'blocked',
        code:typeof module[spec.exportedFunction]==='function'?'SOURCE_PINNED_EXPORT_PRESENT':'EXPORT_NOT_FUNCTION',sha256:sha});
    } catch(_error){output.push({lane:spec.lane,status:'unrun',code:'MODULE_NOT_ACCESSIBLE_OR_LOAD_FAILED',sha256:null});}
  }
  for(const lane of LANES) if(!seen.has(lane)) output.push({lane,status:'unrun',code:'NO_LANE_SOURCE_MANIFEST',sha256:null});
  return output;
}
/**
 * One uniform observation shape for every outcome, so a caller never has to
 * narrow a union to learn whether an issue exists.
 */
export interface Integration4Observation{
  readonly status:'BLOCKED'|'FIXTURE_ONLY';
  readonly evidenceClass:string;
  /** Lane-level measured issues. Always present; empty only when nothing blocked. */
  readonly issues:readonly string[];
  readonly phase:string|null;
  readonly code:string|null;
  readonly document:Readonly<{documentId:string;revision:number;documentDigest:string;workspaceRef:string}>|null;
  readonly effectInvoked:false;
  readonly automaticRetryAllowed:false;
  readonly deviceAcceptance:'UNRUN';
  readonly hostAcceptance:'UNRUN';
}
/** The existing Integration 4 owns module composition; do not clone or fake its lanes. */
export async function observeRealIntegration4(input:Integration4Input):Promise<Integration4Observation>{
  const measured=await composeIntegration4(input);
  if(!measured.ok) return Object.freeze({status:'BLOCKED' as const,evidenceClass:'real-modules-synthetic-external-fixtures' as const,
    issues:Object.freeze([`${measured.phase}:${measured.code}`]),
    phase:measured.phase,code:measured.code,document:null,
    effectInvoked:false as const,automaticRetryAllowed:false as const,
    deviceAcceptance:'UNRUN' as const,hostAcceptance:'UNRUN' as const});
  const issues=measured.lanes.filter(l=>l.status!=='composed').map(l=>`${l.lane}:${l.code??l.status}`);
  issues.push(...measured.defects.map(d=>`${d.lane}:${d.code}`));
  return Object.freeze({status:issues.length?'BLOCKED' as const:'FIXTURE_ONLY' as const,
    evidenceClass:measured.evidenceClass,issues:Object.freeze(issues),phase:null,code:null,
    document:measured.document,effectInvoked:measured.effectInvoked,automaticRetryAllowed:measured.automaticRetryAllowed,
    deviceAcceptance:'UNRUN' as const,hostAcceptance:'UNRUN' as const});
}