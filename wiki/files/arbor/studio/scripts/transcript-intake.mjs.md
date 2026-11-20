# File: studio/scripts/transcript-intake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/transcript-intake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5163 B |
| Lines | 69 |
| Hash | 72af33113723 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| patterns | const | 8 | no | const patterns=[ |
| analyzeTranscript | function | 16 | yes | export function analyzeTranscript(input){ |
| lines | const | 18 | no | const lines=input.replace(/\\r\\n?/g,&#39;\\n&#39;).split(&#39;\\n&#39;),tools={},events=[],ports=new Set(),heads=new Set(),seen=new Set(); |
| tool | variable | 19 | no | let tool=null,calls=0,fence=false,users=0,assistants=0; |
| s | const | 21 | no | const s=lines[i];if(/^## User\\s*$/.test(s))users++;if(/^## Assistant\\s*$/.test(s))assistants++; |
| t | const | 23 | no | const t=s.match(/^\\*\\*Tool:\\s*([\\w -]{1,60})\\*\\*$/); |
| p | const | 28 | no | const p=Number(m[1]);if(p&gt;=1&amp;&amp;p&lt;=65535)ports.add(p); |
| field | function | 37 | no | const field=k=&gt;(input.match(new RegExp(&#39;^\\\\*\\\\*&#39;+k+&#39;:\\\\*\\\\*\\\\s*(.+)$&#39;,&#39;mi&#39;))?.[1]??&#39;&#39;).slice(0,80).replace(/[^a-zA-Z0-9 .,:+_\\/-]/g,&#39;&#39;)\|\|null; |
| failureCodes | const | 38 | no | const failureCodes=new Set([&#39;binding_changed&#39;,&#39;test_failure&#39;,&#39;port_busy&#39;,&#39;auth_required&#39;,&#39;tool_error&#39;]); |
| failures | const | 39 | no | const failures=events.filter(e=&gt;failureCodes.has(e.code)),priority={binding_changed:0,test_failure:1,port_busy:2,auth_required:3,tool_error:4}; |
| unique | const | 40 | no | const unique=[...new Map([...failures].reverse().map(e=&gt;[e.code,e])).values()]; |
| handoffs | const | 41 | no | const handoffs=unique.sort((a,b)=&gt;priority[a.code]-priority[b.code]).slice(0,3).map(e=&gt;({ code:e.code,location:&#39;transcript:&#39;+e.line,confidence:&#39;unverified&#39;, action:e.code===&#39;binding_changed&#39;?&#39;Read-on… |
| renderSummary | function | 53 | yes | export function renderSummary(r){ |
| main | function | 59 | no | async function main(){ |
| a | const | 60 | no | const a=process.argv.slice(2),p=a[0]; |
| j | const | 62 | no | const j=a.indexOf(&#39;--json&#39;),m=a.indexOf(&#39;--md&#39;);if((j&gt;=0&amp;&amp;!a[j+1])\|\|(m&gt;=0&amp;&amp;!a[m+1]))throw Error(&#39;missing output filename&#39;); |
| r | const | 63 | no | const r=analyzeTranscript(await readFile(resolve(p),&#39;utf8&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| node:crypto | import | 6 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Read-only OpenCode markdown transcript intake. No raw transcript excerpts emitted.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const patterns=[
 ['binding_changed',/\bBINDING_CHANGED\b/i,'BROWSER','Provider binding changed'],
 ['test_failure',/(?:^|\s)(?:not ok \d+|FAIL(?:ED)?\s*[:—-]|tests? failed\s*[:=]\s*[1-9])/i,'TEST','Test failure marker'],
 ['port_busy',/\b(EADDRINUSE|address already in use)\b/i,'ENVIRONMENT','Port in use'],
 ['auth_required',/\b(401 Authentication required|AUTH_REQUIRED)\b/i,'TOOLING','Authentication required'],
 ['tool_error',/\b(ENOENT|ECONNREFUSED|ETIMEDOUT|MODULE_NOT_FOUND)\b/i,'TOOLING','Tool error'],
 ['blocked',/\b(BLOCKED|NOT RUN)\b/i,'BLOCKER','Blocked marker']
];
export function analyzeTranscript(input){
 if(typeof input!=='string')throw new TypeError('text required');
 const lines=input.replace(/\r\n?/g,'\n').split('\n'),tools={},events=[],ports=new Set(),heads=new Set(),seen=new Set();
 let tool=null,calls=0,fence=false,users=0,assistants=0;
 for(let i=0;i<lines.length;i++){
  const s=lines[i];if(/^## User\s*$/.test(s))users++;if(/^## Assistant\s*$/.test(s))assistants++;
  if(/^\x60\x60\x60/.test(s.trim()))fence=!fence;
  const t=s.match(/^\*\*Tool:\s*([\w -]{1,60})\*\*$/);
  if(t){tool=t[1].trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');calls++;tools[tool]=(tools[tool]??0)+1;}
  if(!fence&&/^[a-f\d]{40}\s*$/i.test(s))heads.add(s.trim().toLowerCase());
  if(!fence&&/\b(port|listening|localhost|cdp)\b/i.test(s)){
   for(const m of s.matchAll(/(?:\b(?:port|studio-port|cdp-port)\s*[=: ]\s*|127\.0\.0\.1:|localhost:)(\d{2,5})/gi)){
    const p=Number(m[1]);if(p>=1&&p<=65535)ports.add(p);
   }
  }
  for(const [code,re,category,title] of patterns){
   if(!re.test(s))continue;const key=code+':'+Math.floor(i/100);
   if(seen.has(key)||events.length>=250)continue;seen.add(key);
   events.push({code,category,title,line:i+1,evidence:'TRANSCRIPT_MARKER',status:'OBSERVED_NOT_ROOT_CAUSE',tool});
  }
 }
 const field=k=>(input.match(new RegExp('^\\*\\*'+k+':\\*\\*\\s*(.+)$','mi'))?.[1]??'').slice(0,80).replace(/[^a-zA-Z0-9 .,:+_\/-]/g,'')||null;
 const failureCodes=new Set(['binding_changed','test_failure','port_busy','auth_required','tool_error']);
 const failures=events.filter(e=>failureCodes.has(e.code)),priority={binding_changed:0,test_failure:1,port_busy:2,auth_required:3,tool_error:4};
 const unique=[...new Map([...failures].reverse().map(e=>[e.code,e])).values()];
 const handoffs=unique.sort((a,b)=>priority[a.code]-priority[b.code]).slice(0,3).map(e=>({
  code:e.code,location:'transcript:'+e.line,confidence:'unverified',
  action:e.code==='binding_changed'?'Read-only compare expected vs actual origin, target, path and thread. Do not send or retry.':e.code==='test_failure'?'Confirm executed command, failed assertion, tested commit and later reruns.':'Recheck final runtime state and reproduce non-destructively.'
 }));
 return {schema:'vivim.transcript-intake.v1',input_sha256:createHash('sha256').update(input).digest('hex'),
  session:{session_id:field('Session ID'),created:field('Created'),updated:field('Updated')},
  stats:{lines:lines.length,tool_calls:calls,user_sections:users,assistant_sections:assistants},
  tools:Object.fromEntries(Object.entries(tools).sort(([a],[b])=>a.localeCompare(b))),
  context:{git_heads_observed:[...heads].slice(0,12),ports_observed:[...ports].sort((a,b)=>a-b).slice(0,30)},
  events,findings:{observed_failure_markers:failures.length,confirmed_unresolved:0,resolved:0,resolution_status:'UNKNOWN: markers cannot establish final outcome'},
  handoffs,safety:{raw_content_included:false,no_live_activity:true,status:'metadata-only; review before sharing'}};
}
export function renderSummary(r){
 return '# Transcript intake — '+(r.session.session_id??'unknown')+'\n\nInput SHA-256: '+r.input_sha256+'\n\n'+
 'Lines: '+r.stats.lines+' · Tool calls: '+r.stats.tool_calls+' · Failure markers: '+r.findings.observed_failure_markers+
 '\n\n**Outcome:** '+r.findings.resolution_status+'\n\n## Handoffs\n'+
 (r.handoffs.map(h=>'- **'+h.code+'** ('+h.location+'): '+h.action).join('\n')||'- No failure markers')+'\n';
}
async function main(){
 const a=process.argv.slice(2),p=a[0];
 if(!p||a.includes('--help')){console.log('Usage: node scripts/transcript-intake.mjs <session.md> [--json out.json] [--md out.md]');process.exitCode=p?0:2;return;}
 const j=a.indexOf('--json'),m=a.indexOf('--md');if((j>=0&&!a[j+1])||(m>=0&&!a[m+1]))throw Error('missing output filename');
 const r=analyzeTranscript(await readFile(resolve(p),'utf8'));
 if(j>=0)await writeFile(resolve(a[j+1]),JSON.stringify(r,null,2)+'\n',{flag:'wx',mode:0o600});
 if(m>=0)await writeFile(resolve(a[m+1]),renderSummary(r),{flag:'wx',mode:0o600});
 if(j<0&&m<0)console.log(renderSummary(r));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 main().catch(e=>{console.error('intake failed: '+(e.code??e.name));process.exitCode=1;});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
