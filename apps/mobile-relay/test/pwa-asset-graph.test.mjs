// One pre-local import-closure test for the only mobile PWA.
// This scans the real source, including the Build surface's revision guard.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const engine=/^vec-engines\/([a-z-]+)\.mjs$/;
const tier=/^tierflow-runtime\/(.+\.ts)$/;
function physical(p){
  const e=engine.exec(p),t=tier.exec(p);
  if(e)return path.join(root,'../../packages/vec-ui-engines/src',e[1]+'.mjs');
  if(t)return path.join(root,'../../packages/tierflow/src/visual-runtime',t[1]);
  return path.join(root,p);
}
const source=p=>readFileSync(physical(p),'utf8');
const host=readFileSync(new URL('../../vivim-host/direct-phone.mjs',import.meta.url),'utf8');
const sw=source('sw.js');
const shell=/var SHELL_PATHS = \[([\s\S]*?)\];/.exec(sw)?.[1];
const files=[...(shell||'').matchAll(/'([^']*)'/g)].map(m=>m[1]);
const count=new Set(files);
const srcRef=/^\s*import(?:\s+[\s\S]*?\s+from\s*)?\s*['"]([^'"]+)['"];?/gm;
const dynRef=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const nlcl=/^nlcl\/[a-z]+\.mjs$/;
function directServes(p){
  const e=engine.exec(p),t=tier.exec(p);
  if(e)return host.includes('`vec-engines/${n}.mjs`')&&host.includes("'"+e[1]+"'");
  if(t)return host.includes("'"+p+"':")&&host.includes("'../../packages/tierflow/src/visual-runtime/"+t[1]+"'");
  if(nlcl.test(p))
    return host.includes(''+String.fromCharCode(96)+'nlcl/${n}.mjs'+String.fromCharCode(96))
      && host.includes("'"+p.slice(5,-4)+"'");
  return host.includes("'"+p+"':");
}
function dependencies(p){
  const text=source(p);
  const paths=[...text.matchAll(srcRef),...text.matchAll(dynRef)]
    .map(x=>x[1]).filter(s=>s.startsWith('.'));
  return paths.map(ref=>path.posix.normalize(path.posix.join(path.posix.dirname(p),ref)));
}
test('all PWA module imports exist, are served by Direct Host and cache offline',()=>{
  const scripts=files.filter(f=>/\.(?:mjs|js|ts)$/.test(f));
  assert.ok(scripts.length>=40,'main PWA scripts must be included');
  for(const module of scripts){
    assert.equal(existsSync(physical(module)),true,'missing shell source '+module);
    assert.equal(directServes(module),true,'not served by Direct Host: '+module);
    for(const dep of dependencies(module)){
      assert.equal(dep.startsWith('../')||dep.startsWith('/'),false,
        module+' imports a path outside the phone PWA: '+dep);
      assert.equal(existsSync(physical(dep)),true,module+' has missing import '+dep);
      assert.equal(count.has(dep),true,module+' imports an uncached script '+dep);
      assert.equal(directServes(dep),true,module+' imports an unserved script '+dep);
    }
  }
  // Computed browser dynamic import roots cannot be discovered from literal import syntax.
  for(const filename of ['generative-ui/host-revision-guard.mjs','ux/readiness.mjs',
    'ux/launcher-ui.mjs','ux/local-notes-ui.mjs','ux/shell-presentation.mjs',
    'generative-ui/workspace-live-data.mjs','vec-engines/compiler.mjs','vec-engines/registry.mjs',
    'tierflow-runtime/document/import-legacy.ts','tierflow-runtime/render/dom.ts',
    'tierflow-runtime/final-wave/lane-c/templates.ts']){
    assert.ok(count.has(filename),'critical module missing from offline shell: '+filename);
    assert.ok(directServes(filename),'critical module not served: '+filename);
    assert.ok(existsSync(physical(filename)),'critical module has no source: '+filename);
  }
});
test('HTML PWA entry scripts all load through the same source graph',()=>{
  const html=source('index.html');
  const scripts=[...html.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(scripts.includes('app.js'));
  for(const name of scripts){
    assert.ok(count.has(name),'not precached: '+name);
    assert.ok(directServes(name),'not served: '+name);
    assert.ok(existsSync(path.join(root,name)));
  }
});
