# File: apps/vivim-host/test/hvi-source-grant.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/hvi-source-grant.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7258 B |
| Lines | 133 |
| Hash | f52596b74a11 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clock | function | 12 | no | const clock=(start=&#39;2026-11-13T00:00:00.000Z&#39;)=&gt;{let t=Date.parse(start); |
| openStore | function | 14 | no | const openStore=c=&gt;createHviSourceGrantStore({ledger:openLedger({file:&#39;:memory:&#39;}),now:c.now}); |
| REPO | const | 15 | no | const REPO=&#39;synthetic/grant-repo&#39;; |
| c | const | 18 | no | const c=clock();const store=openStore(c); |
| denied | const | 21 | no | const denied=store.verify({repoIdentity:&#39;synthetic/other-repo&#39;}); |
| store | const | 27 | no | const store=openStore(clock()); |
| out | const | 28 | no | const out=store.verify({repoIdentity:REPO}); |
| c | const | 34 | no | const c=clock();const store=openStore(c); |
| out | const | 38 | no | const out=store.verify({repoIdentity:REPO}); |
| fresh | const | 42 | no | const fresh=openStore(clock()); |
| c | const | 48 | no | const c=clock();const store=openStore(c); |
| out | const | 52 | no | const out=store.verify({repoIdentity:REPO}); |
| c | const | 58 | no | const c=clock();const store=openStore(c); |
| ledger | const | 61 | no | const ledger=store.status(); |
| raw | const | 63 | no | const raw=openLedger({file:&#39;:memory:&#39;}); |
| legacy | const | 66 | no | const legacy=createHviSourceGrantStore({ledger:raw,now:c.now}); |
| unreadable | const | 70 | no | const unreadable=createHviSourceGrantStore({ledger:raw,now:c.now}); |
| store | const | 75 | no | const store=openStore(clock()); |
| c | const | 87 | no | const c=clock();const store=openStore(c); |
| verify | const | 88 | no | const verify=createHviSourceGrantVerifier(store); |
| c | const | 97 | no | const c=clock();const store=openStore(c); |
| fixture | const | 98 | no | const fixture=syntheticSource(); |
| request | const | 99 | no | const request={schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2, |
| port | function | 101 | no | const port=overrides=&gt;createHviHostReadPort({actorId:&#39;synthetic-owner&#39;,sessionId:&#39;synthetic-local&#39;, approvedRepositories:[&#39;synthetic/g2-fixture&#39;],verifySession:()=&gt;true, verifyGrant:createHviSourceGr… |
| out | const | 109 | no | const out=await port().invoke(request,{adapter:fixture.adapter}); |
| store | const | 117 | no | const store=openStore(clock()); |
| fixture | const | 119 | no | const fixture=syntheticSource(); |
| request | const | 120 | no | const request={schema:HVI_HOST_REQUEST_SCHEMA,targetIndex:2, |
| seen | const | 122 | no | const seen=[]; |
| port | const | 123 | no | const port=createHviHostReadPort({actorId:&#39;synthetic-owner&#39;,sessionId:&#39;synthetic-local&#39;, approvedRepositories:[&#39;synthetic/g2-fixture&#39;],verifySession:()=&gt;true, verifyGrant:createHviSourceGrantVerifier… |
| out | const | 127 | no | const out=await port.invoke(request,{adapter:fixture.adapter}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| ../bootstrap/ledger.mjs | import | 5 | [apps/vivim-host/bootstrap/ledger.mjs](../bootstrap/ledger.mjs.md) |
| ../control/hvi-source-grant.mjs | import | 6 | [apps/vivim-host/control/hvi-source-grant.mjs](../control/hvi-source-grant.mjs.md) |
| ../control/hvi-capability.mjs | import | 9 | [apps/vivim-host/control/hvi-capability.mjs](../control/hvi-capability.mjs.md) |
| ../../../hq/version-intelligence/sources/fixtures.mjs | import | 10 | [hq/version-intelligence/sources/fixtures.mjs](../../../hq/version-intelligence/sources/fixtures.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Synthetic-only tests for the HVI development-source grant and its Host binding.
// No real repository, no network, no provider, no browser and no personal data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createHviSourceGrantStore, createHviSourceGrantVerifier,
  HVI_SOURCE_GRANT_REASONS, HVI_SOURCE_GRANT_MAX_REPOS,
  HVI_SOURCE_GRANT_KEY } from '../control/hvi-source-grant.mjs';
import { createHviHostReadPort, HVI_HOST_REQUEST_SCHEMA } from '../control/hvi-capability.mjs';
import { syntheticSource } from '../../../hq/version-intelligence/sources/fixtures.mjs';

const clock=(start='2026-11-13T00:00:00.000Z')=>{let t=Date.parse(start);
  return { now:()=>new Date(t).toISOString(), advanceMs:(ms)=>{t+=ms;} };};
const openStore=c=>createHviSourceGrantStore({ledger:openLedger({file:':memory:'}),now:c.now});
const REPO='synthetic/grant-repo';

test('a granted repository is authorized and an ungranted one is refused',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  const denied=store.verify({repoIdentity:'synthetic/other-repo'});
  assert.equal(denied.ok,false);
  assert.equal(denied.code,HVI_SOURCE_GRANT_REASONS.scope);
});

test('no grant at all fails closed',()=>{
  const store=openStore(clock());
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.notGranted);
});

test('revocation is immediate and keeps a tombstone distinct from never granted',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  store.revoke({actorId:'owner'});
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.revoked);
  // Revoked is NOT the same refusal as never granted.
  const fresh=openStore(clock());
  assert.equal(fresh.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.notGranted);
  assert.notEqual(out.code,fresh.verify({repoIdentity:REPO}).code);
});

test('an expired grant fails closed at the moment of expiry',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO],expiresInMs:60_000});
  assert.equal(store.verify({repoIdentity:REPO}).ok,true);
  c.advanceMs(60_000);
  const out=store.verify({repoIdentity:REPO});
  assert.equal(out.ok,false);
  assert.equal(out.code,HVI_SOURCE_GRANT_REASONS.expired);
});

test('an absent or unreadable expiry fails closed',()=>{
  const c=clock();const store=openStore(c);
  store.issue({actorId:'owner',repoIdentities:[REPO]});
  // A grant record without a readable absolute expiry is not evidence of live authority.
  const ledger=store.status();
  assert.equal(ledger.granted,true);
  const raw=openLedger({file:':memory:'});
  raw.meta.set(HVI_SOURCE_GRANT_KEY,JSON.stringify({id:'hsg-legacy',repoIdentities:[REPO],
    at:'2026-11-13T00:00:00.000Z'}));
  const legacy=createHviSourceGrantStore({ledger:raw,now:c.now});
  assert.equal(legacy.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.expired);
  raw.meta.set(HVI_SOURCE_GRANT_KEY,JSON.stringify({id:'hsg-bad',repoIdentities:[REPO],
    at:'2026-11-13T00:00:00.000Z',expiresAt:'not-a-date'}));
  const unreadable=createHviSourceGrantStore({ledger:raw,now:c.now});
  assert.equal(unreadable.verify({repoIdentity:REPO}).code,HVI_SOURCE_GRANT_REASONS.expired);
});

test('issue bounds are enforced',()=>{
  const store=openStore(clock());
  assert.throws(()=>store.issue({actorId:'owner',repoIdentities:[]}),/HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'owner',
    repoIdentities:Array.from({length:HVI_SOURCE_GRANT_MAX_REPOS+1},(_,i)=>'synthetic/repo'+i)}),
    /HVI_SOURCE_GRANT_INVALID/);
  assert.throws(()=>store.issue({actorId:'owner',repoIdentities:[REPO],expiresInMs:25*3600000}),
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
