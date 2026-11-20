# File: tests/fixtures/labs/personal-knowledge/tests/chatgpt-normalize.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/personal-knowledge/tests/chatgpt-normalize.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1434 B |
| Lines | 21 |
| Hash | 556df6b3052c |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sample | const | 4 | no | const sample={id:&#39;thread-a&#39;,title:&#39;Research&#39;,create_time:1730000000,current_node:&#39;n2&#39;,mapping:{ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../src/chatgpt-normalize.mjs | import | 3 | [tests/fixtures/labs/personal-knowledge/src/chatgpt-normalize.mjs](../src/chatgpt-normalize.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeChatGptConversations,batchMetadata} from '../src/chatgpt-normalize.mjs';
const sample={id:'thread-a',title:'Research',create_time:1730000000,current_node:'n2',mapping:{
  n1:{parent:null,children:['n2'],message:{id:'m1',author:{role:'user'},content:{content_type:'text',parts:['Hello']},create_time:1730000000}},
  n2:{parent:'n1',children:[],message:{id:'m2',author:{role:'assistant'},content:{content_type:'multimodal_text',parts:['Answer',{asset_pointer:'image'}]}}}
}};
test('preserve branching, metadata, text and omissions',()=>{
  const [c]=normalizeChatGptConversations([sample],{accountId:'qualified-a'});
  assert.equal(c.messages.length,2);
  assert.equal(c.messages[1].parentId,'n1');
  assert.equal(c.messages[1].omittedMedia,true);
  assert.equal(c.omissions,1);
  assert.equal(batchMetadata([c])[0].kind,'conversation');
});
test('reject malformed or unbounded input',()=>{
  assert.throws(()=>normalizeChatGptConversations([sample],{}),{code:'ACCOUNT_REQUIRED'});
  assert.throws(()=>normalizeChatGptConversations([sample],{accountId:'a',limit:0}),{code:'CONVERSATION_LIMIT'});
  assert.throws(()=>normalizeChatGptConversations([{id:'a'}],{accountId:'a'}),{code:'MAPPING_REQUIRED'});
  assert.throws(()=>normalizeChatGptConversations([sample],{accountId:'a',maxTextBytes:1}),{code:'MESSAGE_SIZE_LIMIT'});
});
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
