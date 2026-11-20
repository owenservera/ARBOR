# File: apps/mobile-relay/grokbot.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/grokbot.js |
| Language | JavaScript |
| Kind | source |
| Size | 2859 B |
| Lines | 39 |
| Hash | 007cc9337944 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| $ | function | 2 | no | const $ = id =&gt; document.getElementById(id); |
| api | function | 3 | no | const api = async (path, options = {}) =&gt; { |
| res | const | 4 | no | const res = await fetch(&#39;/mobile/api/relay?path=&#39; + encodeURIComponent(path), { ...options, credentials:&#39;same-origin&#39;, cache:&#39;no-store&#39;, headers:{&#39;content-type&#39;:&#39;application/json&#39;, ...(options.header… |
| data | const | 5 | no | const data = await res.json(); |
| inFlight | variable | 9 | no | let inFlight=false, timer; |
| msg | function | 10 | no | function msg(text) { $(&#39;notice&#39;).textContent=text; } |
| render | function | 11 | no | function render(commands) { |
| jobs | const | 12 | no | const jobs=$(&#39;jobs&#39;);jobs.replaceChildren(); |
| mine | const | 13 | no | const mine=commands.filter(c=&gt;c.consumer===&#39;grokbot&#39;).slice(0,50); |
| article | const | 16 | no | const article=document.createElement(&#39;article&#39;); |
| top | const | 17 | no | const top=document.createElement(&#39;small&#39;);top.textContent=(c.id\|\|&#39;&#39;)+&#39; · &#39;+(c.status\|\|&#39;unknown&#39;)+&#39; · &#39;+(c.updatedAt\|\|&#39;&#39;); |
| task | const | 18 | no | const task=document.createElement(&#39;p&#39;);task.textContent=c.text\|\|&#39;&#39;; |
| refresh | function | 26 | no | async function refresh() { |
| text | const | 32 | no | const text=$(&#39;task&#39;).value.trim();if(!text\|\|inFlight)return; |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Direct-only Grokbot command inbox. Execution is performed only by a separately authorized native worker.
const $ = id => document.getElementById(id);
const api = async (path, options = {}) => {
  const res = await fetch('/mobile/api/relay?path=' + encodeURIComponent(path), { ...options, credentials:'same-origin', cache:'no-store', headers:{'content-type':'application/json', ...(options.headers||{})} });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
};
let inFlight=false, timer;
function msg(text) { $('notice').textContent=text; }
function render(commands) {
  const jobs=$('jobs');jobs.replaceChildren();
  const mine=commands.filter(c=>c.consumer==='grokbot').slice(0,50);
  if (!mine.length) { jobs.textContent='No Grokbot tasks on this host.';return; }
  for (const c of mine) {
    const article=document.createElement('article');
    const top=document.createElement('small');top.textContent=(c.id||'')+' · '+(c.status||'unknown')+' · '+(c.updatedAt||'');
    const task=document.createElement('p');task.textContent=c.text||'';
    article.append(top,task);
    if(c.result!=null){const pre=document.createElement('pre');pre.textContent=c.result;article.append(pre);}
    if(c.status==='queued') {const hint=document.createElement('small');hint.textContent='Waiting for the Linux Grokbot consumer. Queued does not mean executed.';article.append(hint);}
    if(c.status==='claimed') {const hint=document.createElement('small');hint.textContent='Claimed; execution/reply has not been verified.';article.append(hint);}
    jobs.append(article);
  }
}
async function refresh() {
  try { const data=await api('commands');render(data.commands||[]);const status=await api('agent/status');$('status').textContent='Direct '+status.host+' · '+(status.nativeWorker.available ? 'Worker ready' : 'Worker unavailable: '+status.nativeWorker.reason);$('send').disabled=inFlight; }
  catch(e) { $('status').textContent='Direct connection unavailable: '+e.message;$('send').disabled=true; }
}
$('host').textContent=location.host;
$('send').addEventListener('click',async()=>{
  const text=$('task').value.trim();if(!text||inFlight)return;
  inFlight=true;$('send').disabled=true;msg('Submitting once…');
  try {const c=await api('commands',{method:'POST',body:JSON.stringify({text,kind:'command',consumer:'grokbot',stage:$('task-class').value})});msg('Queued '+c.id+'. Execution requires an available Linux Grokbot worker.');$('task').value='';await refresh();}
  catch(e){msg('Submission outcome unknown: '+e.message+'. Check job history before retrying.');}
  finally{inFlight=false;$('send').disabled=false;}
});
await refresh();timer=setInterval(refresh,4000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
