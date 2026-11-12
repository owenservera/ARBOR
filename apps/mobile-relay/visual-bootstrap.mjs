// Immediate local visual preview. No provider send, database write or durable World claim.
// The Host will later feed this same renderer a validated F02 revision from local authority.
import { THEME_PRESETS, makeProvisionalTheme, compileVisualTheme, readableForeground } from './visual-theme.mjs';
import { compileF02RenderPlan } from './bootstrap-f02.mjs';
import { readProjection, cacheProjection, readCachedProjection, cssEntries } from './bootstrap-phone.mjs';
import { transport } from './transport.mjs';

const $=id=>document.getElementById(id);
const root=document.documentElement;
const presetWorld='local-preview';
const presetNames={lab:'Lab',tide:'Tide',dusk:'Dusk',ember:'Ember',grove:'Grove',ink:'Ink',dawn:'Dawn'};
const vars=['--bg','--s1','--s2','--bd','--tx','--mu','--ac','--ac2',
 '--vivim-background-image','--vivim-font-family','--vivim-base-font-size',
 '--vivim-heading-font-size','--vivim-corner-radius','--vivim-spacing-scale',
 '--vivim-accent-ink','--vivim-appearance'];
let stage='provisional';
let selectedPreset='lab', paired=false, previewing=false, actionBusy=false, activeWorld=null;
function blend(a,b,f) {
 const bytes=[1,3,5].map(n=>{
  const x=parseInt(a.slice(n,n+2),16),y=parseInt(b.slice(n,n+2),16);
  return Math.round(x*(1-f)+y*f).toString(16).padStart(2,'0');
 });
 return '#'+bytes.join('');
}
function applyProperties(properties) {
 for(const name of vars){
  if(Object.hasOwn(properties,name)) root.style.setProperty(name,properties[name]);
 }
 root.dataset.vivimAppearance=properties['--vivim-appearance']==='light'?'light':'dark';
}
function basicPreset(name) {
 const t=makeProvisionalTheme(presetWorld,name);
 const paint=compileVisualTheme(t,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
 const bg=t.palette.background,s=t.palette.secondary,ac=t.palette.accent;
 const ink=readableForeground(bg);
 return {'--bg':bg,'--s1':blend(bg,s,.28),'--s2':blend(bg,s,.53),
  '--bd':blend(bg,ink,.16),'--tx':ink,'--mu':blend(bg,ink,.58),
  '--ac':ac,'--ac2':blend(bg,ac,.2),
  '--vivim-background-image':paint.backgroundImage,
  '--vivim-accent-ink':readableForeground(ac),
  '--vivim-font-family':'"Geist", "Segoe UI Variable Text", system-ui, -apple-system, sans-serif',
  '--vivim-base-font-size':'15px','--vivim-heading-font-size':'28px',
  '--vivim-corner-radius':'8px','--vivim-spacing-scale':'1',
  '--vivim-appearance':t.appearance};
}
function showPreset(name) {
 if(!Object.hasOwn(THEME_PRESETS,name))return;
 selectedPreset=name;previewing=true;
 applyProperties(basicPreset(name));stage='provisional';
 $('theme-state').textContent='Local preview · not yet synced to your PC';
 $('theme-status').textContent=presetNames[name]+' background preview';
 $('theme-choices').querySelectorAll('button[data-preset]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.preset===name)));
}
function showPlan(plan) {
 if(!plan || plan.schema!=='vivim.render-plan/1')throw new TypeError('Validated render plan required');
 applyProperties(plan.cssVariables);
 stage='proposed';
 $('theme-state').textContent='ChatGPT suggestion · local preview only';
 $('theme-status').textContent='Personal theme preview';
 $('theme-choices').querySelectorAll('button[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
}
function fillChoices(){
 const choices=$('theme-choices');
 for(const [name,palette] of Object.entries(THEME_PRESETS)){
  const b=document.createElement('button');b.type='button';b.dataset.preset=name;
  b.setAttribute('aria-label',presetNames[name]+' background');
  b.setAttribute('aria-pressed','false');
  b.className='theme-choice';
  const swatch=document.createElement('span');swatch.className='theme-swatch';
  swatch.style.background='linear-gradient(130deg,'+palette.background+','+palette.secondary+')';
  const title=document.createElement('span');title.textContent=presetNames[name];
  b.append(swatch,title);
  b.addEventListener('click',()=>showPreset(name));
  choices.append(b);
 }
}
function close(){ $('theme-panel').hidden=true;$('theme-toggle').setAttribute('aria-expanded','false'); }
fillChoices();
showPreset('lab'); // First paint needs no network, ChatGPT memory or Local Host availability.
previewing=false; // A real scoped Host theme may replace this provisional first frame.
$('theme-toggle').addEventListener('click',()=>{
 const panel=$('theme-panel');panel.hidden=!panel.hidden;
 $('theme-toggle').setAttribute('aria-expanded',String(!panel.hidden));
 if(!panel.hidden)panel.querySelector('button[data-preset]')?.focus();
});
$('theme-close').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('theme-panel').hidden)close();});
window.addEventListener('vivim:preview-f02',event=>{
 try{
  const {response,worldId,requestId}=event.detail || {};
  showPlan(compileF02RenderPlan(response,{worldId,requestId,
   reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches}));
 }catch{
  $('theme-status').textContent='Theme suggestion could not be validated';
 }
});
// The classic Talk script may finish its initial session fetch before this module
// and its imports load. Independently initialize the paired status to avoid a lost event.
relay('session').then(async session=>{
  if(session?.paired!==true)return;
  paired=true;$('theme-save').disabled=false;$('theme-undo').disabled=false;
  const cached=readCachedProjection(localStorage);
  if(cached&&cached.themeStatus==='active')applyHostProjection(cached);
  try{
    const status=await relay('status');
    window.dispatchEvent(new CustomEvent('vivim:bootstrap-status',{detail:status}));
  }catch{ /* Existing Talk polling keeps retrying the session status. */ }
}).catch(()=>{});
// Read-only reporting of the current local preview for debugging; no storage/approval action.

// The Vercel relay only transports allowlisted commands; the PC owns every write.
// A command is issued ONCE, then polled by ID. Timeouts are uncertain, NEVER resent automatically.
async function relay(path, options={}) {
  return transport.request(path, options);
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function sendAction(action,preset=null) {
  const cmd={text:action,kind:'command',consumer:'bootstrap',mode:'bootstrap',action};
  if(preset)cmd.preset=preset;
  const created=await relay('commands',{method:'POST',body:JSON.stringify(cmd)});
  if(!created?.id)throw new Error('Relay did not acknowledge command');
  for(let i=0;i<25;i++){
    await pause(1200);
    const state=await relay('commands/'+created.id);
    if(state?.status==='done')return state;
    if(state?.status==='failed')throw new Error(String(state.result||'Command failed').slice(0,160));
  }
  throw new Error('Command pending or uncertain; not resent');
}
function applyHostProjection(projection) {
  const values=cssEntries(projection);
  if(!values.length)return;
  if(previewing)return; // Never interrupt a user actively reviewing their own palette.
  applyProperties(Object.fromEntries(values));
  stage='synced';activeWorld=projection.worldId;
  $('theme-state').textContent='PC synced · '+(projection.themeStatus||'theme')+' · revision '+(projection.revision??0);
  $('theme-status').textContent=projection.source==='owner-choice'?'Your saved background':'Your evolving personal background';
  $('theme-undo').hidden=!projection.undo?.available;
}
window.addEventListener('vivim:clear-bootstrap-cache',()=>{ try { localStorage.removeItem('vivim.bootstrap.projection.v1'); } catch {} });
window.addEventListener('vivim:paired',e=>{
  paired=e.detail?.paired===true;
  $('theme-save').disabled=!paired;
  $('theme-undo').disabled=!paired;
  if(paired){
    const cache=readCachedProjection(localStorage);
    if(cache&&cache.themeStatus==='active')applyHostProjection(cache);
  }else{
    previewing=false;showPreset('lab');
  }
});
window.addEventListener('vivim:bootstrap-status',e=>{
  if(!paired)return;
  const projection=readProjection(e.detail);
  if(!projection)return;
  cacheProjection(localStorage,projection);
  activeWorld=projection.worldId;
  applyHostProjection(projection);
});
async function act(action,preset=null) {
  if(!paired||actionBusy)return;
  actionBusy=true;
  $('theme-save').disabled=true;$('theme-undo').disabled=true;
  $('theme-state').textContent='Sending to your paired PC…';
  try{
    if(action==='choose-preset'){
      // The explicit 'Use on my devices' tap authorizes only the reversible visual scope.
      await sendAction('grant-visual');
      await sendAction('choose-preset',preset);
    }else await sendAction(action);
    previewing=false;
    $('theme-state').textContent='Saved on PC · syncing appearance…';
    window.dispatchEvent(new Event('vivim:bootstrap-refresh'));
  }catch(e){
    $('theme-state').textContent=String(e?.message||'Unable to sync').slice(0,170);
  }finally{
    actionBusy=false;$('theme-save').disabled=!paired;$('theme-undo').disabled=!paired;
  }
}
$('theme-save').disabled=true;$('theme-undo').disabled=true;
$('theme-save').addEventListener('click',()=>act('choose-preset',selectedPreset));
$('theme-undo').addEventListener('click',()=>act('undo-theme'));

window.VIVIMVisualPreview=Object.freeze({get state(){return stage;}});
