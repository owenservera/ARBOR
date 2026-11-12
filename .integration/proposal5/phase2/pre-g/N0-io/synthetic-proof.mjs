// PRE-G contract test: node .integration/proposal5/phase2/pre-g/N0-io/synthetic-proof.mjs
// Pure, source-compatible fixture, not a runtime bridge, authentication verifier or parallel scheduler.
const result=(()=>{
  const passed=[];const check=(n,x)=>{if(!x)throw Error("FAIL "+n);passed.push(n)};
  const rejects=(fn,c)=>{try{fn();return false}catch(e){return e.message===c}};
  const fail=c=>{throw Error(c)};
  const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
  const keys=(v,a)=>obj(v)&&Object.keys(v).every(k=>a.includes(k));
  const ident=s=>typeof s==="string"&&/^[A-Za-z0-9._:-]{1,96}$/.test(s);
  const positive=n=>Number.isSafeInteger(n)&&n>0;
  const digest=s=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
  const size=s=>{let n=0;for(const x of s){const c=x.codePointAt(0);if(c>=0xd800&&c<=0xdfff)fail("BAD_UTF8");n+=c<=127?1:c<=2047?2:c<=65535?3:4;}return n;};
  const ref=s=>keys(s,["id","domain","ownerRef","revision"])&&ident(s.id)&&["personal","development","ui","control"].includes(s.domain)&&(s.ownerRef===null||ident(s.ownerRef))&&(s.domain!=="personal"||ident(s.ownerRef))&&Number.isSafeInteger(s.revision)&&s.revision>=0;
  const eventKeys=["schema","kind","eventId","sessionId","surfaceId","sequence","inputRevision","interactionRevision","expectedRevision","text","composing","span","idempotencyKey","contentDigest","audience","dataClass","policyVersion","engineVersion","sourceRefs","correlationId","causationRefs"];
  const kinds=["DraftChanged","VoicePartial","Submit","VoiceFinal","Select","EditStructured","Attach","Approve","Reject","Cancel","Correct","FocusChanged","OfflineDraftReconcile"];
  const event=(e,state)=>{
    if(!keys(e,eventKeys))fail("UNKNOWN_FIELD");
    if(e.schema!=="arbor.n0-io/1"||!kinds.includes(e.kind)||![e.eventId,e.sessionId,e.surfaceId,e.audience,e.policyVersion,e.engineVersion].every(ident)||!positive(e.sequence)||!positive(e.inputRevision)||!Number.isSafeInteger(e.interactionRevision)||e.interactionRevision<0||!Number.isSafeInteger(e.expectedRevision)||e.expectedRevision<0||!["public","internal","private","sensitive","secret"].includes(e.dataClass)||!Array.isArray(e.sourceRefs)||e.sourceRefs.length>16||!e.sourceRefs.every(ref))fail("BAD_EVENT");
    if(state&&(e.sequence<=state.sequence||e.expectedRevision!==state.interactionRevision))fail("STALE_CAS");
    if(e.text!==undefined&&(typeof e.text!=="string"||size(e.text)>4096||e.text.includes("\u0000")))fail("BAD_TEXT");
    if(["DraftChanged","VoicePartial"].includes(e.kind)&&(typeof e.text!=="string"||typeof e.composing!=="boolean"||e.idempotencyKey!==undefined))fail("BAD_DRAFT");
    if(["Submit","VoiceFinal"].includes(e.kind)&&(!ident(e.idempotencyKey)||e.idempotencyKey===e.eventId||!digest(e.contentDigest)||e.composing===true))fail("BAD_SUBMIT");
    if(e.kind==="Select"&&e.composing===true)fail("IME_ACTIVE");
    if(e.span!==undefined){
      if(!keys(e.span,["unit","start","end"])||e.span.unit!=="unicode_scalar"||!Number.isSafeInteger(e.span.start)||!Number.isSafeInteger(e.span.end)||e.span.start<0||e.span.end<e.span.start||typeof e.text!=="string")fail("BAD_SPAN");
      let p=0;const boundaries=[0];for(const part of new Intl.Segmenter("und",{granularity:"grapheme"}).segment(e.text)){p+=[...part.segment].length;boundaries.push(p);}
      if(!boundaries.includes(e.span.start)||!boundaries.includes(e.span.end))fail("SPLIT_GRAPHEME");
    }
    return Object.freeze({...e});
  };
  // The trusted parameter is ONLY a synthetic precondition. No actual Host or Tauri verifier exists here.
  const snapshot=(e,verified)=>{
    if(!verified||verified.kind!=="synthetic-verifier-test-only"||verified.sessionId!==e.sessionId)fail("UNVERIFIED_ACTOR");
    return {sessionId:e.sessionId,inputRevision:e.inputRevision,graphEpoch:verified.graphEpoch,policyVersion:e.policyVersion,engineVersion:e.engineVersion,audience:verified.audience,readable:verified.readable};
  };
  const stage=s=>({s,records:new Map(),cancelled:false,version:1});
  const dkeys=["derivationId","reactorId","eventId","sessionId","inputRevision","graphEpoch","policyVersion","engineVersion","sourceRef","sourceOwner","audience","kind","confidence","candidateId","inputRefs","ttlRevisions","status","cancelled"];
  const join=(st,d)=>{
    if(!keys(d,dkeys))fail("ILLEGAL_DERIVED_FIELD");
    if(![d.derivationId,d.reactorId,d.eventId,d.sessionId,d.policyVersion,d.engineVersion,d.sourceOwner,d.audience,d.candidateId].every(ident)||!positive(d.inputRevision)||!Number.isSafeInteger(d.graphEpoch)||d.graphEpoch<0||!ref(d.sourceRef)||!["candidate","observation","context_hint","ambiguity","missing_slot"].includes(d.kind)||!["grounded","tentative","unknown"].includes(d.confidence)||!Array.isArray(d.inputRefs)||d.inputRefs.length>32||!d.inputRefs.every(ident)||!Number.isSafeInteger(d.ttlRevisions)||d.ttlRevisions<0||d.ttlRevisions>16||!["partial","complete","inconclusive"].includes(d.status)||typeof d.cancelled!=="boolean")fail("BAD_DERIVATION");
    if(st.cancelled||d.cancelled)return "CANCELLED";
    if(d.sessionId!==st.s.sessionId||d.inputRevision!==st.s.inputRevision||d.graphEpoch!==st.s.graphEpoch||d.policyVersion!==st.s.policyVersion||d.engineVersion!==st.s.engineVersion)return "STALE";
    if(d.audience!==st.s.audience)return "AUDIENCE_DENIED";
    if(!st.s.readable.includes(d.sourceRef.id))return "SOURCE_DENIED";
    if(st.records.has(d.derivationId))return JSON.stringify(st.records.get(d.derivationId))===JSON.stringify(d)?"DUPLICATE":"COLLISION";
    if(st.records.size>=32)return "BACKPRESSURE";
    st.records.set(d.derivationId,Object.freeze({...d}));st.version++;return "ACCEPTED";
  };
  const project=st=>{
    const evidence=[...st.records.values()].sort((a,b)=>a.derivationId.localeCompare(b.derivationId,"en"));
    const choices=[...new Set(evidence.filter(x=>x.kind==="candidate").map(x=>x.candidateId))].sort();
    return {schema:"arbor.n0-io-output/1",sessionId:st.s.sessionId,inputRevision:st.s.inputRevision,graphEpoch:st.s.graphEpoch,projectionVersion:st.version,audience:st.s.audience,phase:evidence.length?"partial":"inconclusive",evidence,ambiguities:choices.length>1?[choices]:[],unknown:!evidence.length,effectPerformed:false,authorization:"not_assessed",hostReceiptRef:null};
  };
  const enqueue=(q,e,cap)=>{if(q.length<cap){q.push(e);return "ACCEPTED"}if(["DraftChanged","VoicePartial"].includes(e.kind)){const i=q.findIndex(x=>x.sessionId===e.sessionId&&["DraftChanged","VoicePartial"].includes(x.kind));if(i>=0){q[i]=e;return "COALESCED";}}return "BACKPRESSURE";};
  const e0={schema:"arbor.n0-io/1",kind:"DraftChanged",eventId:"e.1",sessionId:"s.1",surfaceId:"desktop.1",sequence:1,inputRevision:1,interactionRevision:0,expectedRevision:0,text:"g",composing:false,sourceRefs:[],dataClass:"private",audience:"owner.1",policyVersion:"p.1",engineVersion:"engine.1"};
  check("immutable bounded event",Object.isFrozen(event(e0,{sequence:0,interactionRevision:0})));
  check("reject claimed actor",rejects(()=>event({...e0,actor:"owner"}),"UNKNOWN_FIELD"));
  check("reject claimed grant",rejects(()=>event({...e0,grant:"yes"}),"UNKNOWN_FIELD"));
  check("reject unknown field",rejects(()=>event({...e0,extra:true}),"UNKNOWN_FIELD"));
  check("UTF8 byte bounds",rejects(()=>event({...e0,text:"🧭".repeat(1025)}),"BAD_TEXT"));
  check("invalid isolated surrogate",rejects(()=>event({...e0,text:"\ud800"}),"BAD_UTF8"));
  check("replay sequence",rejects(()=>event(e0,{sequence:1,interactionRevision:0}),"STALE_CAS"));
  check("stale CAS",rejects(()=>event({...e0,sequence:2},{sequence:1,interactionRevision:1}),"STALE_CAS"));
  check("IME draft remains a preview",event({...e0,composing:true}).composing);
  check("grapheme-aligned scalar span",event({...e0,text:"a\u0301🌍",span:{unit:"unicode_scalar",start:0,end:2}}).span.end===2);
  check("no splitting combining span",rejects(()=>event({...e0,text:"a\u0301🌍",span:{unit:"unicode_scalar",start:1,end:2}}),"SPLIT_GRAPHEME"));
  check("IME Select denied",rejects(()=>event({...e0,kind:"Select",composing:true}),"IME_ACTIVE"));
  check("Submit requires unique idempotency",rejects(()=>event({...e0,kind:"Submit",eventId:"same",idempotencyKey:"same",contentDigest:"a".repeat(64)}),"BAD_SUBMIT"));
  check("Submit distinct from draft",event({...e0,kind:"Submit",eventId:"e.2",idempotencyKey:"request.2",contentDigest:"a".repeat(64),text:undefined}).eventId!==e0.eventId);
  check("unverified actor refuses",rejects(()=>snapshot(e0,null),"UNVERIFIED_ACTOR"));
  const s=snapshot(e0,{kind:"synthetic-verifier-test-only",sessionId:"s.1",audience:"owner.1",graphEpoch:7,readable:["source.1"]});
  const make=(id,candidate="command.1")=>({derivationId:id,reactorId:"reactor."+id,eventId:"e.1",sessionId:"s.1",inputRevision:1,graphEpoch:7,policyVersion:"p.1",engineVersion:"engine.1",sourceRef:{id:"source.1",domain:"personal",ownerRef:"owner.1",revision:3},sourceOwner:"Host",audience:"owner.1",kind:"candidate",confidence:"tentative",candidateId:candidate,inputRefs:["e.1"],ttlRevisions:2,cancelled:false,status:"partial"});
  const left=stage(s),right=stage(s),a=make("react.a"),b=make("react.b","command.2");
  check("reactor A accepted",join(left,a)==="ACCEPTED");check("reactor B accepted",join(left,b)==="ACCEPTED");
  check("inverse arrival",join(right,b)==="ACCEPTED"&&join(right,a)==="ACCEPTED");
  check("deterministic out-of-order convergence",JSON.stringify(project(left))===JSON.stringify(project(right)));
  check("ambiguities not last-writer-wins",project(left).ambiguities.length===1);
  check("derivation deduplication",join(left,a)==="DUPLICATE");
  check("derivation collision",join(left,{...a,candidateId:"else"})==="COLLISION");
  check("stale input revision",join(left,{...make("react.old"),inputRevision:2})==="STALE");
  check("stale graph epoch",join(left,{...make("react.graph"),graphEpoch:6})==="STALE");
  check("stale policy version",join(left,{...make("react.policy"),policyVersion:"p.0"})==="STALE");
  check("source permission fence",join(left,{...make("react.secret"),sourceRef:{...a.sourceRef,id:"source.2"}})==="SOURCE_DENIED");
  check("audience isolation",join(left,{...make("react.other"),audience:"other.1"})==="AUDIENCE_DENIED");
  check("invalid effect claim refused",rejects(()=>join(left,{...make("react.effect"),effectAuthorized:true}),"ILLEGAL_DERIVED_FIELD"));
  check("uncertainty is explicit",project(stage(s)).unknown===true&&project(stage(s)).phase==="inconclusive");
  check("preview no effect or receipt",project(left).effectPerformed===false&&project(left).hostReceiptRef===null);
  const cancelled=stage(s);cancelled.cancelled=true;check("cancellation fences late results",join(cancelled,make("react.late"))==="CANCELLED");
  const capped=stage(s);for(let i=0;i<32;i++)capped.records.set("fill."+i,make("fill."+i));check("evidence capacity",join(capped,make("react.overflow"))==="BACKPRESSURE");
  const q=[{kind:"DraftChanged",sessionId:"s.1",inputRevision:1},{kind:"Submit",sessionId:"s.2"}];
  check("draft coalescing",enqueue(q,{kind:"DraftChanged",sessionId:"s.1",inputRevision:2},2)==="COALESCED");
  check("Submit not dropped by coalescing",q[1].kind==="Submit"&&q[0].inputRevision===2);
  check("Submit backpressured not discarded",enqueue(q,{kind:"Submit",sessionId:"s.3"},2)==="BACKPRESSURE");
  check("Cancel backpressured not discarded",enqueue(q,{kind:"Cancel",sessionId:"s.3"},2)==="BACKPRESSURE");
  return {schema:"arbor.n0-io-proof/1",passed:passed.length,failed:0,names:passed,scope:"synthetic pure V8/Node; no live auth or Rust execution"};
})();
if(typeof console!=="undefined")console.log(JSON.stringify(result,null,2));
