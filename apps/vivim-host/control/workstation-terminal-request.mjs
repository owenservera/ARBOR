// Pure request shape at the incumbent Host JS boundary. This is NOT a grant,
// executable resolver, sandbox, or effect executor. Host must independently
// resolve the local program and cwd, bind exact argv and current authority to
// its receipt, and use the existing native Rust session worker. A working
// directory is not a security sandbox for an authorized general-purpose CLI.
export function normalizeTerminalRequest(input) {
  const invalid=()=>{throw new Error('WORKSTATION_TERMINAL_REQUEST_INVALID')};
  if(input===null||typeof input!=='object'||Array.isArray(input))invalid();
  const required=['program','args','root_id','cwd','interactive','timeout_ms'];
  if(Object.keys(input).length!==required.length||required.some(k=>!Object.prototype.hasOwnProperty.call(input,k)))invalid();
  const {program,args,root_id,cwd,interactive,timeout_ms}=input;
  const cleanText=(v,max)=>typeof v==='string'&&v.length<=max&&!v.includes('\0')&&Array.from(v).every(c=>c.length===2||!(c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff));
  if(!cleanText(program,128)||!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(program)||program==='.'||program==='..')invalid();
  if(!cleanText(root_id,64)||!/^[a-z][a-z0-9-]*$/.test(root_id))invalid();
  if(!cleanText(cwd,1024)||(cwd!=='.'&&cwd.split('/').some(p=>!p||p==='.'||p==='..'||/[\x00-\x1f\\:<>|?*"]/.test(p)||/[. ]$/.test(p))))invalid();
  if(!Array.isArray(args)||args.length>64||args.some(a=>!cleanText(a,4096))||args.reduce((n,a)=>n+a.length,0)>32768)invalid();
  if(typeof interactive!=='boolean'||!Number.isSafeInteger(timeout_ms)||timeout_ms<100||timeout_ms>1800000)invalid();
  return {program,args:[...args],root_id,cwd,interactive,timeout_ms};
}
