# File: apps/mobile-relay/test/workspace-live-data.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/workspace-live-data.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3845 B |
| Lines | 40 |
| Hash | 035958b97787 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| page | const | 4 | no | const page=&#39;task-&#39;+&#39;a&#39;.repeat(32),task={kind:&#39;task&#39;,page,section:&#39;Task&#39;,entryId:&#39;00000000-0000-0000-0000-000000000001&#39;,createdRevision:1,status:&#39;Open&#39;}; |
| wiki | const | 5 | no | const wiki={revision:2,pages:{[page]:{sections:{Task:&#39;A real task&#39;,Status:&#39;Open&#39;}}},personalCaptures:{ |
| done | const | 9 | no | const done=structuredClone(wiki);done.pages[page].sections.Status=&#39;Done&#39;;done.personalCaptures.items[0].status=&#39;Done&#39;; |
| fake | const | 11 | no | const fake=structuredClone(wiki);fake.personalCaptures.items[0].status=&#39;Done&#39;;assert.equal(projectOpenTasks(fake).state,&#39;unavailable&#39;); |
| event | const | 15 | no | const event={id:&#39;msg-1&#39;,provider:&#39;chatgpt&#39;,state:&#39;reply_observed&#39;,sequence:3,sourceRevision:2,source:&#39;studio&#39;,observedAt:&#39;2026-11-18T12:00:00Z&#39;,evidenceDigest:&#39;a&#39;.repeat(64),eventDigest:&#39;b&#39;.repeat(64… |
| v | const | 16 | no | const v={schema:&#39;vivim.studio-outcomes/1&#39;,authority:&#39;read-only-historical&#39;,state:&#39;source-backed&#39;,revision:3,total:1,items:[event]}; |
| notePage | const | 24 | no | const notePage=&#39;note-&#39;+&#39;b&#39;.repeat(32),note={kind:&#39;note&#39;,page:notePage,section:&#39;Note&#39;,entryId:&#39;00000000-0000-0000-0000-000000000002&#39;,createdRevision:2}; |
| view | const | 25 | no | const view=structuredClone(wiki);view.pages[notePage]={sections:{Note:&#39;A committed note&#39;}};view.personalCaptures.items.unshift(note); |
| done | const | 34 | no | const done=structuredClone(wiki);done.pages[page].sections.Status=&#39;Done&#39;;done.personalCaptures.items[0].status=&#39;Done&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/workspace-live-data.mjs | import | 3 | [apps/mobile-relay/generative-ui/workspace-live-data.mjs](../generative-ui/workspace-live-data.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {projectOpenTasks,projectStudioActivity,projectRecentNotes,projectCompletedTasks,readPersonalCaptures,workspaceBindingData} from '../generative-ui/workspace-live-data.mjs';
const page='task-'+'a'.repeat(32),task={kind:'task',page,section:'Task',entryId:'00000000-0000-0000-0000-000000000001',createdRevision:1,status:'Open'};
const wiki={revision:2,pages:{[page]:{sections:{Task:'A real task',Status:'Open'}}},personalCaptures:{
 schema:'vivim.personal-captures/1',authority:'committed-wiki-read-only',wikiRevision:2,items:[task]}};
test('only authorized revision-matched captured tasks enter the live source projection',()=>{
 assert.equal(projectOpenTasks(wiki).items[0].label,'A real task');assert.equal(projectOpenTasks({...wiki,revision:3}).state,'unavailable');
 const done=structuredClone(wiki);done.pages[page].sections.Status='Done';done.personalCaptures.items[0].status='Done';
 assert.equal(projectOpenTasks(done).items.length,0);
 const fake=structuredClone(wiki);fake.personalCaptures.items[0].status='Done';assert.equal(projectOpenTasks(fake).state,'unavailable');
 assert.equal(projectOpenTasks({revision:2,pages:wiki.pages}).state,'unavailable');
});
test('Studio source metadata never claims a reply is a delivered message',()=>{
 const event={id:'msg-1',provider:'chatgpt',state:'reply_observed',sequence:3,sourceRevision:2,source:'studio',observedAt:'2026-11-18T12:00:00Z',evidenceDigest:'a'.repeat(64),eventDigest:'b'.repeat(64),authority:'historical-source-verified-event'};
 const v={schema:'vivim.studio-outcomes/1',authority:'read-only-historical',state:'source-backed',revision:3,total:1,items:[event]};
 assert.match(projectStudioActivity(v).items[0].label,/Reply observed/);
 assert.equal(projectStudioActivity({...v,items:[{...event,state:'delivered'}]}).state,'unavailable');
 assert.equal(projectStudioActivity({...v,state:'needs-review'}).state,'unavailable');
 assert.equal(workspaceBindingData()['studio.recent-outcomes'].state,'unavailable');
});

test('recent notes read only real capture records in the current authorized Wiki',()=>{
 const notePage='note-'+'b'.repeat(32),note={kind:'note',page:notePage,section:'Note',entryId:'00000000-0000-0000-0000-000000000002',createdRevision:2};
 const view=structuredClone(wiki);view.pages[notePage]={sections:{Note:'A committed note'}};view.personalCaptures.items.unshift(note);
 assert.equal(projectRecentNotes(view).items[0].label,'A committed note');
 assert.equal(projectRecentNotes(view).total,1);assert.equal(projectOpenTasks(view).total,1);
 assert.equal(workspaceBindingData({wiki:view})['personal.recent-notes'].state,'source-backed');
 assert.equal(workspaceBindingData()['personal.recent-notes'].state,'unavailable');
 view.personalCaptures.items[0].section='Task';assert.equal(projectRecentNotes(view).state,'unavailable');
});

test('bounded capture counts stay explicit, completed tasks use current status, inconsistent totals refuse',()=>{
 const done=structuredClone(wiki);done.pages[page].sections.Status='Done';done.personalCaptures.items[0].status='Done';
 done.personalCaptures.total=300;done.personalCaptures.omitted=299;done.personalCaptures.counts={notes:100,openTasks:99,doneTasks:101,unknownTasks:0};
 assert.equal(projectOpenTasks(done).total,99);assert.deepEqual(projectOpenTasks(done).items,[]);assert.equal(projectCompletedTasks(done).total,101);
 assert.equal(projectCompletedTasks(done).items[0].label,'A real task');assert.equal(projectRecentNotes(done).total,100);
 assert.equal(workspaceBindingData({wiki:done})['personal.completed-tasks'].state,'source-backed');
 done.personalCaptures.counts.doneTasks=0;assert.equal(readPersonalCaptures(done),null);assert.equal(projectOpenTasks(done).state,'unavailable');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
