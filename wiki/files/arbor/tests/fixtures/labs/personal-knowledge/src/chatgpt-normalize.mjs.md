# File: tests/fixtures/labs/personal-knowledge/src/chatgpt-normalize.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | tests/fixtures/labs/personal-knowledge/src/chatgpt-normalize.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4742 B |
| Lines | 71 |
| Hash | 30349a5ea14c |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hash | function | 4 | no | const hash=v=&gt;createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| error | function | 5 | no | const error=(code)=&gt;Object.assign(new Error(code),{code}); |
| str | function | 6 | no | const str=(value,max)=&gt;typeof value===&#39;string&#39;?value.slice(0,max):&#39;&#39;; |
| timestamp | function | 7 | no | const timestamp=v=&gt;typeof v===&#39;number&#39;&amp;&amp;Number.isFinite(v)?new Date(v*1000).toISOString():null; |
| CONTENT_REVISION_SCHEMA | const | 8 | yes | export const CONTENT_REVISION_SCHEMA=&#39;vivim.personal-content-revision/2&#39;; |
| descriptor | function | 9 | no | const descriptor=value=&gt;{ |
| textParts | function | 14 | no | function textParts(content){ |
| parts | const | 16 | no | const parts=Array.isArray(content.parts)?content.parts:[]; |
| omitted | variable | 17 | no | let omitted=false;const values=[],descriptors=[],orderedParts=[]; |
| normalizeChatGptConversations | function | 29 | yes | export function normalizeChatGptConversations(input,{accountId,limit=1000,maxTextBytes=1_000_000}={}){ |
| conversations | const | 32 | no | const conversations=[]; |
| mapping | const | 35 | no | const mapping=conversation.mapping; |
| messages | const | 37 | no | const messages=[]; |
| message | const | 41 | no | const message=node.message; |
| id | const | 42 | no | const id=typeof message.id===&#39;string&#39;&amp;&amp;message.id?message.id:nodeId; |
| role | const | 46 | no | const role=str(message.author?.role,32)\|\|&#39;unknown&#39;; |
| title | const | 56 | no | const title=str(conversation.title,1024),createdAt=timestamp(conversation.create_time),updatedAt=timestamp(conversation.update_time); |
| currentNode | const | 57 | no | const currentNode=typeof conversation.current_node===&#39;string&#39;?conversation.current_node:null; |
| contentDigest | const | 58 | no | const contentDigest=hash(JSON.stringify([CONTENT_REVISION_SCHEMA,title,currentNode,createdAt,updatedAt, messages.map(m=&gt;[m.nativeId,m.nodeId,m.parentId,m.children,m.role,m.createdAt,m.updatedAt,m.con… |
| batchMetadata | function | 69 | yes | export function batchMetadata(conversations){ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [tests/fixtures/labs/personal-knowledge/tests/chatgpt-normalize.test.mjs](../tests/chatgpt-normalize.test.mjs.md) | ../src/chatgpt-normalize.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure parser for USER-SELECTED official ChatGPT conversations.json content.
// Not a ZIP extractor, browser scraper, provider client or private store.
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(v).digest('hex');
const error=(code)=>Object.assign(new Error(code),{code});
const str=(value,max)=>typeof value==='string'?value.slice(0,max):'';
const timestamp=v=>typeof v==='number'&&Number.isFinite(v)?new Date(v*1000).toISOString():null;
export const CONTENT_REVISION_SCHEMA='vivim.personal-content-revision/2';
const descriptor=value=>{
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(descriptor);
  return Object.fromEntries(Object.keys(value).filter(k=>!['data','payload','base64','bytes'].includes(k)).sort().map(k=>[k,descriptor(value[k])]));
};
function textParts(content){
  if(!content||typeof content!=='object')return {text:'',omitted:true,parts:[],descriptors:[]};
  const parts=Array.isArray(content.parts)?content.parts:[];
  let omitted=false;const values=[],descriptors=[],orderedParts=[];
  for(const part of parts){
    if(typeof part==='string'){values.push(part);orderedParts.push(['text',part]);}
    else if(part&&typeof part==='object'&&typeof part.text==='string'){
      values.push(part.text);orderedParts.push(['text',part.text]);
    } else {
      omitted=true;const safe=descriptor(part);descriptors.push(safe);orderedParts.push(['omitted',safe]);
    } // Never retain media payload bytes.
  }
  if(!parts.length)omitted=true;
  return {text:values.join('\n'),omitted,parts:orderedParts,descriptors};
}
export function normalizeChatGptConversations(input,{accountId,limit=1000,maxTextBytes=1_000_000}={}){
  if(typeof accountId!=='string'||!accountId||accountId.length>256)throw error('ACCOUNT_REQUIRED');
  if(!Array.isArray(input)||!Number.isSafeInteger(limit)||limit<1||limit>10000||input.length>limit)throw error('CONVERSATION_LIMIT');
  const conversations=[];
  for(const conversation of input){
    if(!conversation||typeof conversation!=='object'||typeof conversation.id!=='string'||!conversation.id||conversation.id.length>256)throw error('INVALID_CONVERSATION');
    const mapping=conversation.mapping;
    if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))throw error('MAPPING_REQUIRED');
    const messages=[];
    if(Object.keys(mapping).length>200000)throw error('NODE_LIMIT');
    for(const [nodeId,node] of Object.entries(mapping)){
      if(!node||typeof node!=='object'||!node.message)continue;
      const message=node.message;
      const id=typeof message.id==='string'&&message.id?message.id:nodeId;
      if(id.length>256||nodeId.length>256)throw error('INVALID_NODE');
      const {text,omitted,parts,descriptors}=textParts(message.content);
      if(Buffer.byteLength(text,'utf8')>maxTextBytes)throw error('MESSAGE_SIZE_LIMIT');
      const role=str(message.author?.role,32)||'unknown';
      const record={nativeId:id,nodeId,parentId:typeof node.parent==='string'?node.parent:null,
        children:Array.isArray(node.children)?node.children.filter(v=>typeof v==='string').sort():[],
        role,createdAt:timestamp(message.create_time),updatedAt:timestamp(message.update_time),
        contentType:str(message.content?.content_type,64),text,omittedMedia:omitted,
        omissionDescriptors:descriptors,contentParts:parts,
        contentDigest:hash(JSON.stringify([CONTENT_REVISION_SCHEMA,id,nodeId,role,message.content?.content_type??null,parts]))};
      messages.push(record);
    }
    messages.sort((a,b)=>a.nodeId.localeCompare(b.nodeId));
    const title=str(conversation.title,1024),createdAt=timestamp(conversation.create_time),updatedAt=timestamp(conversation.update_time);
    const currentNode=typeof conversation.current_node==='string'?conversation.current_node:null;
    const contentDigest=hash(JSON.stringify([CONTENT_REVISION_SCHEMA,title,currentNode,createdAt,updatedAt,
      messages.map(m=>[m.nativeId,m.nodeId,m.parentId,m.children,m.role,m.createdAt,m.updatedAt,m.contentType,m.contentParts,m.omittedMedia,m.omissionDescriptors])]));
    conversations.push({
      source:'chatgpt-export',accountId,nativeId:conversation.id,title,createdAt,updatedAt,currentNode,
      messages,revisionSchema:CONTENT_REVISION_SCHEMA,contentDigest,
      omissions:messages.filter(m=>m.omittedMedia).length
    });
  }
  return conversations;
}
// Return only bounded metadata intended for coordinator.recordBatch after Host evidence acceptance.
export function batchMetadata(conversations){
  return conversations.map(c=>({nativeId:c.nativeId,kind:'conversation',contentDigest:c.contentDigest}));
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
