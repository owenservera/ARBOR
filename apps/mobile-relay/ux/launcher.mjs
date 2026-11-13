// One local capability finder over *existing* surfaces. None of these actions
// sends a message, executes a Host plan, installs software or authorizes a grant.
export const LAUNCHER_SCHEMA = 'vivim.pwa-capability-catalog/1';
const CATALOG = Object.freeze([
  ['today','Today','Connection, next action and what needs you','today','any'],
  ['talk','Ask VIVIM','Describe a supported Host request and review its plan','talk','paired'],
  ['ai','My AIs','Use signed-in AI conversations via the existing signed-in browser harness','talk','paired'],
  ['sessions','PC sessions','Read existing sessions on your Host','talk','direct'],
  ['build','Build','Propose a deterministic UI edit or preview a design','build','paired'],
  ['world','World','See your committed UI and what is running','world','any'],
  ['media','Movies and shows','Browse your HQ library and mapped streams','world','direct'],
  ['me','Me','Device, permissions, AI providers and recent receipts','me','any'],
  ['readiness','Connection check','Read a device-safe setup and recovery checklist','me','any'],
  ['install','Install PWA','Install from your browser when it offers the option','me','any'],
  ['control','Control','Inspect Host plans, approve with a current grant','control','direct'],
  ['memory','Web memory','Review privacy-filtered PC browsing evidence','control','direct'],
  ['theme','Appearance','Preview the existing VIVIM visual themes','me','paired'],
  ['tour','Introduction','Replay the existing VIVIM welcome tour','today','paired'],
  ['notes','Quick capture','Keep a note locally on this browser, including offline','today','phone']
]);
export function capabilityCatalog(context={}) {
  const mode = context.mode==='direct'?'direct':context.mode==='desktop-preview'?'desktop-preview':'cloud';
  const paired = context.paired===true && mode!=='desktop-preview';
  const offline = context.online===false;
  const preview = mode==='desktop-preview';
  const rows = CATALOG.map(([id,title,detail,tab,requires])=>{
    let available = requires==='any' || requires==='phone' && !preview
      || requires==='paired' && paired || requires==='direct' && paired && mode==='direct';
    if(id==='theme' && preview) available=true; // Local appearance preview only.
    if(id==='install' && preview) available=false;
    if(id==='media' && !context.mediaVisible) available=false;
    if(id==='control' && preview) available=false;
    if(id==='sessions' && preview) available=false;
    if(id==='memory' && preview) available=false;
    if(id==='notes' && preview) available=false;
    if(offline && !['today','world','me','readiness','notes','install'].includes(id)) available=false;
    const reason=available?'Available':preview?'Phone-only action unavailable in read-only Host preview'
      :offline?'Connect to your PC first'
      :requires==='direct'?'Requires approved Direct phone connection'
      :requires==='paired'?'Requires an approved phone session'
      :'Not available on this connection';
    return Object.freeze({id,title,detail,tab,available,reason});
  });
  return Object.freeze({schema:LAUNCHER_SCHEMA,rows});
}
export function searchCapabilities(query='',context={}){
  const input=typeof query==='string'?query.slice(0,100).toLocaleLowerCase('en').trim():'';
  const terms=input.split(/\s+/).filter(Boolean).slice(0,6);
  const rows=capabilityCatalog(context).rows;
  const hits=terms.length?rows.filter(c=>terms.every(t=>
    (c.title+' '+c.detail+' '+c.tab).toLocaleLowerCase('en').includes(t))):rows;
  // Available results first, but retain unavailable rows to explain limitations.
  return hits.slice().sort((a,b)=>Number(b.available)-Number(a.available));
}
