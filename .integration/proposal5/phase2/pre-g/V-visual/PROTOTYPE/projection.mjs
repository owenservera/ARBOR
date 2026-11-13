/** Inert, pure source-projection prototype. No runtime interpreter, permission checker, DOM publisher or effect port. */
export const SCHEMA="arbor.p5.realtime-semantic-projection/1";
export function clone(x){return JSON.parse(JSON.stringify(x));}

export function utf8Bytes(s){let n=0;for(const c of s){const k=c.codePointAt(0);n+=k<128?1:k<2048?2:k<65536?3:4;}return n;}

export function isBoundary(s,p){return Number.isInteger(p)&&p>=0&&p<=s.length&&!(p>0&&p<s.length&&s.charCodeAt(p)>=0xDC00&&s.charCodeAt(p)<=0xDFFF&&s.charCodeAt(p-1)>=0xD800&&s.charCodeAt(p-1)<=0xDBFF);}

export function sourceSpan(text,startUtf16,endUtf16,role){if(!isBoundary(text,startUtf16)||!isBoundary(text,endUtf16)||endUtf16<=startUtf16)return null;return{startUtf16,endUtf16,startUtf8:utf8Bytes(text.slice(0,startUtf16)),endUtf8:utf8Bytes(text.slice(0,endUtf16)),role,text:text.slice(startUtf16,endUtf16)};}

export function sameVersions(a,b){return ["source","catalog","policy","graph"].every(k=>typeof a?.[k]==="string"&&a[k].length>0&&a[k]===b?.[k]);}

export function newSnapshot({sessionId,revision,text,composing=false,revisions}){if(typeof sessionId!=="string"||!sessionId||!Number.isSafeInteger(revision)||revision<0||typeof text!=="string"||text.length>16384||!sameVersions(revisions,revisions))throw Error("BAD_INPUT_SNAPSHOT");return{schema:SCHEMA,sessionId,input:{revision,text,composing:composing===true},revisions:{...revisions},patches:[]};}

export function validateCandidate(c,text){
 if(!c||typeof c.id!=="string"||!c.id||typeof c.label!=="string"||!["candidate","grounded","ambiguous","stale","denied","revoked","unknown"].includes(c.status)||c.permission!=="not_assessed"||c.effectAuthorization!==false||!Array.isArray(c.spans)||!Array.isArray(c.negations)||!Array.isArray(c.quotations)||!Array.isArray(c.entities)||!Array.isArray(c.missingSlots)||!Array.isArray(c.alternatives)||!Array.isArray(c.sourceRefs)||typeof c.explanation!=="string"||!c.explanation||!c.risk||!["R0","R1","R2","R3","unknown"].includes(c.risk.level))return false;
 for(const s of [...c.spans,...c.negations,...c.quotations]){if(!s||!isBoundary(text,s.startUtf16)||!isBoundary(text,s.endUtf16)||s.endUtf16<=s.startUtf16||text.slice(s.startUtf16,s.endUtf16)!==s.text||utf8Bytes(text.slice(0,s.startUtf16))!==s.startUtf8||utf8Bytes(text.slice(0,s.endUtf16))!==s.endUtf8)return false;}
 return true;
}

export function ingestPatch(snapshot,patch){
 const reject=reason=>({accepted:false,reason,snapshot});
 if(!snapshot||snapshot.schema!==SCHEMA||!patch||patch.sessionId!==snapshot.sessionId)return reject("SESSION_MISMATCH");
 if(patch.inputRevision!==snapshot.input.revision)return reject("STALE_INPUT_REVISION");
 if(!sameVersions(snapshot.revisions,patch.revisions))return reject("STALE_SOURCE_POLICY_GRAPH_OR_CATALOG");
 if(typeof patch.producerId!=="string"||!patch.producerId||!Number.isSafeInteger(patch.producerRevision)||patch.producerRevision<1||!["partial","complete","denied","revoked","stale","unknown"].includes(patch.coverage?.status)||!Array.isArray(patch.coverage?.facets)||!Array.isArray(patch.candidates))return reject("INVALID_PRODUCER_PATCH");
 if(patch.candidates.some(c=>!validateCandidate(c,snapshot.input.text)))return reject("INVALID_OR_EFFECT_BEARING_CANDIDATE");
 const prior=snapshot.patches.find(x=>x.producerId===patch.producerId);
 if(prior&&prior.producerRevision>=patch.producerRevision)return reject("OLDER_OR_DUPLICATE_PRODUCER_PATCH");
 const patches=[...snapshot.patches.filter(x=>x.producerId!==patch.producerId),clone(patch)].sort((a,b)=>a.producerId.localeCompare(b.producerId));
 return{accepted:true,reason:"ACCEPTED_INERT",snapshot:{...snapshot,patches}};
}

export function semanticGraph(snapshot){return{revision:snapshot.input.revision,sourceRevisions:{...snapshot.revisions},text:snapshot.input.text,candidates:snapshot.patches.flatMap(p=>p.candidates.map(c=>({...c,key:p.producerId+":"+c.id,producerId:p.producerId,producerRevision:p.producerRevision,coverage:p.coverage.status}))),coverage:snapshot.patches.map(p=>({producerId:p.producerId,status:p.coverage.status,facets:[...p.coverage.facets]}))};}

export function renderDensity(snapshot,density="assisted"){
 if(!["quiet","assisted","view_all"].includes(density))throw Error("UNKNOWN_DENSITY");
 const graph=semanticGraph(snapshot);
 const caution=c=>c.status!=="grounded"||["R2","R3"].includes(c.risk.level)||c.negations.length>0||c.quotations.length>0;
 const keys=(density==="quiet"?graph.candidates.filter(caution):graph.candidates).map(c=>c.key);
 const descriptions=graph.candidates.map(c=>`${c.producerId}: ${c.label}; ${c.status}; risk ${c.risk.level} (${c.risk.source}); permission not assessed; ${c.explanation}${c.negations.length?"; negation present":""}${c.quotations.length?"; quotation present":""}${c.missingSlots.length?"; missing slots "+c.missingSlots.map(s=>s.name).join(", "):""}`);
 const coverage=graph.coverage.map(c=>`Producer ${c.producerId}: ${c.status}; facets ${c.facets.join(", ")||"none"}`);
 const accessibleText=[`Original text: ${graph.text}`,`Input revision ${graph.revision}. ${graph.candidates.length} simultaneous interpretations. Effect authorization never assessed.`,...descriptions,...coverage].join("\n");
 return{density,semanticState:graph,display:{candidateKeys:keys,expanded:density==="view_all",compact:density==="quiet",visibleCoverage:graph.coverage,accessibleText,submitEnabled:false,authorization:"not_assessed"}};
}

export function proposeSelection(snapshot,{expectedRevision,expectedText,span,insert,candidateKey}){
 if(snapshot?.input.composing)return{ok:false,reason:"IME_ACTIVE"};
 if(snapshot?.input.revision!==expectedRevision||snapshot.input.text!==expectedText)return{ok:false,reason:"STALE_SELECTION"};
 if(typeof insert!=="string"||typeof candidateKey!=="string"||!semanticGraph(snapshot).candidates.some(c=>c.key===candidateKey))return{ok:false,reason:"UNKNOWN_CANDIDATE"};
 if(!span||!isBoundary(expectedText,span.startUtf16)||!isBoundary(expectedText,span.endUtf16)||expectedText.slice(span.startUtf16,span.endUtf16)!==span.text)return{ok:false,reason:"SOURCE_SPAN_CHANGED"};
 const next=expectedText.slice(0,span.startUtf16)+insert+expectedText.slice(span.endUtf16);
 if(next.length>16384)return{ok:false,reason:"OVER_BUDGET"};
 return{ok:true,kind:"DRAFT_CORRECTION_PROPOSAL",text:next,caretUtf16:span.startUtf16+insert.length,undo:{expectedText:next,originalText:expectedText,expectedRevision:expectedRevision+1,caretUtf16:span.endUtf16},submit:false};
}

export function proposeUndo({currentText,currentRevision,composing=false,undo}){if(composing)return{ok:false,reason:"IME_ACTIVE"};if(!undo||currentText!==undo.expectedText||currentRevision!==undo.expectedRevision)return{ok:false,reason:"STALE_UNDO"};return{ok:true,kind:"DRAFT_CORRECTION_PROPOSAL",text:undo.originalText,caretUtf16:undo.caretUtf16,submit:false};}
