// GUI01: complete-reply-only UI proposal validation + pure preview compiler. Never persists or executes effects.
import {digestJson} from './portable-digest.mjs';
import {CATALOG_VERSION,MAX,PROPOSAL_SCHEMA,PREVIEW_SCHEMA,invalid,keys,plain,id,str,int,validateProps,validateTheme,validateSurface,validateTree} from './catalog.mjs';
const ROOT_FIELDS=['schema','surfaceId','baseRevision','operations','explanation','assumptions','unknowns'];
const OP_FIELDS={insert:['opId','type','parentId','index','component'],remove:['opId','type','componentId'],move:['opId','type','componentId','parentId','index'],
  'replace-props':['opId','type','componentId','props'],'set-theme':['opId','type','theme']};
function safeInput(source){
  if(typeof source==='string') {
    if(new TextEncoder().encode(source).byteLength>MAX.bytes)invalid('proposal too large');
    try {return JSON.parse(source);} catch {invalid('expected a single complete JSON object');}
  }
  if(!plain(source))invalid('proposal must be an object');
  if(new TextEncoder().encode(JSON.stringify(source)).byteLength>MAX.bytes)invalid('proposal too large');
  return structuredClone(source);
}
function locate(root,what){let found=null;const visit=(n,parent)=>{if(n.id===what)found={node:n,parent};for(const c of n.children)visit(c,n);};visit(root,null);return found;}
function normalizeOp(op){
  if(!plain(op)||!Object.hasOwn(OP_FIELDS,op.type))invalid('unsupported operation');
  keys(op,OP_FIELDS[op.type],'operation');id(op.opId);
  if(op.type==='insert'){id(op.parentId);if(op.index!==undefined)int(op.index,0,MAX.children);if(!plain(op.component))invalid('invalid inserted component');}
  if(op.type==='remove'||op.type==='move'||op.type==='replace-props')id(op.componentId);
  if(op.type==='move'){id(op.parentId);if(op.index!==undefined)int(op.index,0,MAX.children);}
  if(op.type==='replace-props'&&!plain(op.props))invalid('invalid changed props');
  return op;
}
// @hq:consumes vivim.ui-proposal@1
export function compileUiProposal({proposal,surface,approvedRefs=[],audience='pc'}={}) {
  if(!['pc','phone'].includes(audience))invalid('unknown preview audience');
  if(!Array.isArray(approvedRefs)||approvedRefs.length>128)invalid('invalid reference allowlist');
  const refs=new Set(approvedRefs.map(id));
  const before=validateSurface(surface,{refs});
  const p=safeInput(proposal);keys(p,ROOT_FIELDS,'proposal');
  if(p.schema!==PROPOSAL_SCHEMA||p.surfaceId!==before.surfaceId||p.baseRevision!==before.revision)invalid('stale or mismatched surface revision');
  if(!Array.isArray(p.operations)||p.operations.length===0||p.operations.length>MAX.operations)invalid('operation count');
  if(!Array.isArray(p.assumptions)||p.assumptions.length>8||!Array.isArray(p.unknowns)||p.unknowns.length>8)invalid('assumptions/unknowns');
  const notes={explanation:str(p.explanation,400),assumptions:p.assumptions.map(v=>str(v,160)),unknowns:p.unknowns.map(v=>str(v,160))};
  const seenOps=new Set(),next=structuredClone(before);
  for(const raw of p.operations) {
    const op=normalizeOp(raw);if(seenOps.has(op.opId))invalid('duplicate operation id');seenOps.add(op.opId);
    if(op.type==='set-theme'){next.theme=validateTheme(op.theme);continue;}
    if(op.type==='insert') {
      const target=locate(next.tree,op.parentId);
      if(!target||!['stack','grid','card'].includes(target.node.type))invalid('invalid insertion parent');
      // Subtree validation happens after edit; no unbounded walks or injected arbitrary fields.
      if(!plain(op.component)||!Array.isArray(op.component.children??[])||locate(next.tree,op.component.id))invalid('invalid/duplicate insertion id');
      const index=op.index??target.node.children.length;
      if(index>target.node.children.length)invalid('insertion index');
      target.node.children.splice(index,0,op.component);
    } else if(op.type==='remove'){
      if(op.componentId==='root')invalid('root is protected');
      const entry=locate(next.tree,op.componentId);if(!entry?.parent)invalid('unknown component');
      entry.parent.children=entry.parent.children.filter(n=>n.id!==op.componentId);
    } else if(op.type==='replace-props'){
      const entry=locate(next.tree,op.componentId);if(!entry)invalid('unknown component');
      entry.node.props=validateProps(entry.node.type,{...entry.node.props,...op.props},{refs});
    } else if(op.type==='move'){
      if(op.componentId==='root')invalid('root is protected');
      const entry=locate(next.tree,op.componentId),dest=locate(next.tree,op.parentId);
      if(!entry?.parent||!dest||!['stack','grid','card'].includes(dest.node.type))invalid('invalid move');
      const ancestors=(n,target)=>n===target||n.children.some(c=>ancestors(c,target));
      if(ancestors(entry.node,dest.node))invalid('cycle');
      entry.parent.children=entry.parent.children.filter(n=>n.id!==op.componentId);
      const index=op.index??dest.node.children.length;if(index>dest.node.children.length)invalid('move index');
      dest.node.children.splice(index,0,entry.node);
    }
    // Fail at the operation boundary. Never return a partly valid preview.
    next.tree=validateTree(next.tree,{refs});
  }
  // PC-private branches must never become phone-visible through a model patch.
  const priorPrivate=new Map();
  const scan=n=>{if(n.visibility==='pc-private')priorPrivate.set(n.id,JSON.stringify(n));n.children.forEach(scan);};scan(before.tree);
  for(const [componentId,original] of priorPrivate){
    const current=locate(next.tree,componentId)?.node;
    if(!current)invalid('private component cannot be moved/removed by untrusted proposal');
    if(current.visibility!=='pc-private')invalid('private component visibility cannot be changed by untrusted proposal');
    if(JSON.stringify(current)!==original)invalid('private component cannot be edited by untrusted proposal');
    if(audience==='phone')invalid('private data cannot be edited from a phone preview');
  }
  const after=validateSurface(next,{refs});
  return {schema:PREVIEW_SCHEMA,surfaceId:before.surfaceId,baseRevision:before.revision,catalogVersion:CATALOG_VERSION,
    proposalDigest:digestJson(p),previewDigest:digestJson(after),operations:p.operations.length,notes,surface:after,authorization:'required',persisted:false};
}
