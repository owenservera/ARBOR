# File: apps/vivim-host/corpus/transport/hq-contract.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/transport/hq-contract.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2466 B |
| Lines | 39 |
| Hash | d6f75ba40564 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 11 | no | const here=path.dirname(fileURLToPath(import.meta.url)); |
| hq | const | 12 | no | const hq=process.env.VIVIM_REPOS_HQ_PATH \|\| path.resolve(here,&#39;../../../../../repos-hq&#39;); |
| validatorPath | const | 13 | no | const validatorPath=path.join(hq,&#39;hq/lib/personal-corpus-contract.mjs&#39;); |
| fixturePath | const | 14 | no | const fixturePath=path.join(hq,&#39;contracts/personal-corpus/fixtures.v1.json&#39;); |
| present | const | 15 | no | const present=existsSync(validatorPath) &amp;&amp; existsSync(fixturePath); |
| raw | const | 19 | no | const raw=readFileSync(fixturePath,&#39;utf8&#39;); |
| fixtures | const | 20 | no | const fixtures=JSON.parse(raw); |
| dir | const | 23 | no | const dir=mkdtempSync(path.join(tmpdir(),&#39;vivim-corpus-canonical-&#39;)); |
| p | const | 25 | no | const p=createCorpusTransferProtocol({dataRoot:dir,validateCapture:validateCorpusCapture, canonicalCapture:canonicalCorpusJson, authorizeDevice:()=&gt;({deviceId:&#39;device-canonical&#39;,grantId:&#39;grant-canoni… |
| s | const | 32 | no | const s=await p.issueScope({auth:{},events:fixtures.valid,ttlMs:60000}); |
| v | const | 35 | no | const v=p.inspect({auth:{},scopeId:s.scopeId,eventId:e.eventId}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |
| ./protocol.mjs | import | 10 | [apps/vivim-host/corpus/transport/protocol.mjs](./protocol.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Cross-repo conformance: consumes the EXACT HQ contract implementation and fixtures
// when the canonical sibling checkout is present. This is deliberately SKIPPED in
// an isolated checkout; a fake copy of the HQ validator would be misleading.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCorpusTransferProtocol } from './protocol.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const hq=process.env.VIVIM_REPOS_HQ_PATH || path.resolve(here,'../../../../../repos-hq');
const validatorPath=path.join(hq,'hq/lib/personal-corpus-contract.mjs');
const fixturePath=path.join(hq,'contracts/personal-corpus/fixtures.v1.json');
const present=existsSync(validatorPath) && existsSync(fixturePath);
test('all four exact canonical HQ fixtures are accepted as immutable, unapproved evidence',
  {skip:present?false:'repos-hq sibling checkout or VIVIM_REPOS_HQ_PATH not available'}, async t=>{
  const {validateCorpusCapture,canonicalCorpusJson}=await import(pathToFileURL(validatorPath));
  const raw=readFileSync(fixturePath,'utf8');
  const fixtures=JSON.parse(raw);
  assert.equal(fixtures.schema,'vivim.corpus-fixtures/1');
  assert.equal(fixtures.valid.length,4);
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-corpus-canonical-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const p=createCorpusTransferProtocol({dataRoot:dir,validateCapture:validateCorpusCapture,
    canonicalCapture:canonicalCorpusJson,
    authorizeDevice:()=>({deviceId:'device-canonical',grantId:'grant-canonical',scopes:['corpus:upload']}),
    approveTransfer:async ({deviceId,grantId,expiresAt,events})=>({decision:'approved',approvalId:'approval-canonical',deviceId,grantId,expiresAt,events}),
    persistAccepted:async()=>{throw Error('No synthetic Host acceptance allowed');},
    lookupAccepted:async()=>null});
  for(const e of fixtures.valid)assert.equal(validateCorpusCapture(e).ok,true);
  const s=await p.issueScope({auth:{},events:fixtures.valid,ttlMs:60000});
  assert.equal(s.events.length,4);
  for(const e of fixtures.valid){
    const v=p.inspect({auth:{},scopeId:s.scopeId,eventId:e.eventId});
    assert.equal(v.state,'receiving');
    assert.equal(v.cursor,0);
  }
});
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
