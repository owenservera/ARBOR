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
