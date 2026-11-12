/**
 * VIVIM Rust Live Graph — Wave 1 / Lane A
 * Only data-only code observations. No KB/graph journal/Host writer or reset.
 * See hq/live-graph/wave1/lane-a/HANDOFF.md for local execution and blockers.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, realpathSync, statSync, lstatSync} from 'node:fs';
import {resolve, relative, isAbsolute, sep, win32} from 'node:path';

export const INTENT_SCHEMA = 'vivim.index-intent/0.1';
export const OUTPUT_SCHEMA = 'vivim.wave1.code-observations/1';
const idRe = /^[a-z][a-z0-9._-]{2,79}$/;
const shaRe = /^[a-f0-9]{40}$/i;
const secretRe = /(^|\/)(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)(\/|$)/i;
const hash = value => createHash('sha256').update(value).digest('hex');
export const stableId = (...parts) => 'hqg1:' + hash(JSON.stringify(parts));
const enclosed = (parent, child) => {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
};
export function validateIntent(input) {
  if (!input || input.schema !== INTENT_SCHEMA) throw Error('INTENT_SCHEMA_UNSUPPORTED');
  if (!idRe.test(input.projectId || '') || !Number.isSafeInteger(input.revision) || input.revision < 1) throw Error('INTENT_ID_OR_REVISION_INVALID');
  if (typeof input.purpose !== 'string' || !input.purpose.trim() || !Array.isArray(input.questions) || !input.questions.length || input.questions.some(q => typeof q !== 'string' || !q.trim())) throw Error('INTENT_QUESTIONS_REQUIRED');
  if (input.mode !== 'dev-observation-only' || input.effectsAllowed !== false) throw Error('INTENT_EFFECTS_FORBIDDEN');
  if (!Array.isArray(input.roots) || !input.roots.length) throw Error('INTENT_ROOTS_REQUIRED');
  const seen = new Set();
  for (const root of input.roots) {
    if (!idRe.test(root.id || '') || seen.has(root.id)) throw Error('INTENT_ROOT_ID_DUPLICATE_OR_INVALID');
    seen.add(root.id);
    if (typeof root.path !== 'string' || !(isAbsolute(root.path) || win32.isAbsolute(root.path)) || secretRe.test(root.path.replaceAll('\\','/'))) throw Error('INTENT_ROOT_PATH_INVALID');
    if (!shaRe.test(root.headSha || '')) throw Error('INTENT_ROOT_SHA_UNPINNED');
    if (typeof root.role !== 'string' || !root.role.trim()) throw Error('INTENT_ROOT_ROLE_REQUIRED');
    if (root.ignores !== undefined && (!Array.isArray(root.ignores) || root.ignores.some(i => typeof i !== 'string' || !i || i.includes('..')))) throw Error('INTENT_IGNORES_INVALID');
  }
  return structuredClone(input);
}
export function verifyRoots(intent, { git = execFileSync } = {}) {
  const roots = [];
  for (const root of intent.roots) {
    if (!existsSync(root.path) || !statSync(root.path).isDirectory()) throw Error('ROOT_NOT_DIRECTORY:' + root.id);
    const path = realpathSync(root.path);
    if (roots.some(r => enclosed(r.path, path) || enclosed(path, r.path))) throw Error('ROOT_SCOPE_OVERLAP:' + root.id);
    let top, head, dirty;
    try {
      const opts = {cwd:path, encoding:'utf8', timeout:20000, windowsHide:true};
      top = git('git',['rev-parse','--show-toplevel'],opts).trim();
      head = git('git',['rev-parse','HEAD'],opts).trim();
      dirty = git('git',['status','--porcelain=v1','--untracked-files=all'],opts).trim();
    } catch { throw Error('ROOT_GIT_UNVERIFIED:' + root.id); }
    if (resolve(top) !== resolve(path)) throw Error('ROOT_NOT_GIT_TOP:' + root.id);
    if (head.toLowerCase() !== root.headSha.toLowerCase()) throw Error('ROOT_HEAD_STALE:' + root.id);
    if (dirty) throw Error('ROOT_DIRTY_UNVERIFIED:' + root.id);
    roots.push({id:root.id,path,headSha:head,role:root.role,ignores:root.ignores || []});
  }
  return roots;
}
export function checkOutputDirectory(repoRoot, outputDir) {
  const base = resolve(repoRoot,'.hq','wave1-index-runs');
  const target = resolve(outputDir);
  if (target === base || !enclosed(base,target)) throw Error('OUTPUT_NOT_ISOLATED_DEV_RUN');
  let path = target;
  while (enclosed(resolve(repoRoot),path)) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw Error('OUTPUT_SYMLINK_FORBIDDEN');
    if (path === resolve(repoRoot)) break;
    const next = resolve(path,'..');
    if (next === path) break;
    path = next;
  }
  return target;
}
/**
 * Export stable source evidence from the existing per-repository HQ index.
 * Only annotations are claims, static imports are NOT runtime communication.
 */
export function projectIndex(db, intent, roots, {readSource, parseV2} = {}) {
  const all = sql => db.prepare(sql).all();
  const files=[], symbols=[], imports=[], annotations=[], diagnostics=[];
  const source = new Map();
  const ids = new Map();
  const byRoot = new Map(roots.map(r=>[r.id,r]));
  for (const f of all('SELECT f.id, p.name AS root_id, f.path, f.abs_path, f.lang, f.hash, f.size FROM files f JOIN projects p ON p.id = f.project_id ORDER BY p.name, f.path')) {
    const root=byRoot.get(f.root_id);
    if (!root || !f.hash || !enclosed(root.path,resolve(f.abs_path)) || secretRe.test(f.path)) {
      diagnostics.push({code:'FILE_UNTRUSTED_SCOPE_OR_HASH',rootId:f.root_id,path:f.path});
      continue;
    }
    const fileId=stableId(intent.projectId,root.id,'file',f.path);
    files.push({id:fileId,projectId:intent.projectId,rootId:root.id,path:f.path,lang:f.lang,sourceHash:f.hash,headSha:root.headSha,size:f.size,evidence:'indexed-source'});
    ids.set(f.id,fileId);source.set(f.id,{...f,root});
  }
  for (const s of all('SELECT s.file_id, s.name, s.kind, s.line, s.end_line FROM symbols s ORDER BY s.file_id, s.line, s.name')) {
    const f=source.get(s.file_id);if(!f)continue;
    symbols.push({id:stableId(intent.projectId,f.root.id,'symbol',f.path,s.name,s.line),fileId:ids.get(s.file_id),name:s.name,kind:s.kind,line:s.line,endLine:s.end_line,evidence:'static-extractor'});
  }
  for (const i of all('SELECT i.file_id, i.specifier, i.kind, i.line, i.resolved_file_id, i.resolved_project_id FROM imports i ORDER BY i.file_id, i.line, i.specifier')) {
    const f=source.get(i.file_id);if(!f)continue;
    imports.push({id:stableId(intent.projectId,f.root.id,'import',f.path,i.line,i.specifier),from:ids.get(i.file_id),to:ids.get(i.resolved_file_id)||null,specifier:i.specifier,kind:i.kind,line:i.line,relation:'static-import',observation:'source-only',resolution:ids.has(i.resolved_file_id)?'file':i.resolved_project_id?'project-unlinked':'unknown'});
  }
  for (const a of all('SELECT a.file_id, a.line, a.kind, a.text FROM annotations a ORDER BY a.file_id, a.line, a.kind')) {
    const f=source.get(a.file_id);if(!f)continue;
    annotations.push({id:stableId(intent.projectId,f.root.id,'v1',f.path,a.line,a.kind),fileId:ids.get(a.file_id),grammar:'hq-v1',kind:a.kind,line:a.line,valueDigest:hash(String(a.text||'')),claimStatus:'unverified'});
  }
  if(readSource&&parseV2)for(const [numericId,f] of source) {
    if(!/^(js|jsx|ts|tsx|mjs|cjs|javascript|typescript)$/.test(f.lang))continue;
    try {
      const bytes=readSource(f.abs_path,'utf8');
      if(hash(bytes)!==f.hash){diagnostics.push({code:'SOURCE_CHANGED_SINCE_INDEX',rootId:f.root.id,path:f.path});continue;}
      const p=parseV2(bytes,{projectId:intent.projectId,path:f.root.id+'/'+f.path,contentHash:f.hash});
      for(const a of p.records) annotations.push({id:stableId(intent.projectId,f.root.id,'v2',f.path,a.line,a.kind,a.value),fileId:ids.get(numericId),grammar:'hq-v2',kind:a.kind,value:a.value,line:a.line,claimStatus:'declared-unverified'});
      for(const d of p.diagnostics) diagnostics.push({code:'V2_'+d.code,rootId:f.root.id,path:f.path,line:d.line,kind:d.kind});
      if(bytes.includes('@hq:wiki'))diagnostics.push({code:'WIKI_GRAMMAR_CANDIDATE_REQUIRES_RUST_COMPILER',rootId:f.root.id,path:f.path,status:'lexical-only'});
    }catch{diagnostics.push({code:'SOURCE_READ_FAILED',rootId:f.root.id,path:f.path});}
  }
  const output={schema:OUTPUT_SCHEMA,project:{id:intent.projectId,intentRevision:intent.revision,purpose:intent.purpose,questions:intent.questions,mode:intent.mode},roots:roots.map(r=>({id:r.id,role:r.role,headSha:r.headSha,status:'head-verified'})),counts:{roots:roots.length,files:files.length,symbols:symbols.length,imports:imports.length,annotations:annotations.length,diagnostics:diagnostics.length},files,symbols,imports,annotations,diagnostics};
  output.digest=hash(JSON.stringify(output));
  return output;
}
