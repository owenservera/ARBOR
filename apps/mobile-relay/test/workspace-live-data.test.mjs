import test from 'node:test';
import assert from 'node:assert/strict';
import {projectOpenTasks,projectStudioActivity,workspaceBindingData} from '../generative-ui/workspace-live-data.mjs';
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
