// Preserve exact UTF-8 bytes across the incumbent typed planner's trim rule.
// No implicit decoding of unmarked strings, no NUL, no lossy UTF-8.
export function decodeWorkstationText(value,maxBytes=4*1024*1024){
 if(typeof value!=='string'||!value.startsWith('b64:')||value.length>4+4*Math.ceil(maxBytes/3))
  throw Object.assign(Error('WORKSTATION_TEXT_ENCODING_INVALID'),{code:'WORKSTATION_TEXT_ENCODING_INVALID',status:409});
 const encoded=value.slice(4);
 // Exact re-encoding below rejects malformed/noncanonical base64 without a
 // repeated regex that can overflow the stack for large legitimate payloads.
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>maxBytes||bytes.toString('base64')!==encoded)
  throw Object.assign(Error('WORKSTATION_TEXT_ENCODING_INVALID'),{code:'WORKSTATION_TEXT_ENCODING_INVALID',status:409});
 let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{
  throw Object.assign(Error('WORKSTATION_TEXT_ENCODING_INVALID'),{code:'WORKSTATION_TEXT_ENCODING_INVALID',status:409});
 }
 if(text.includes('\0'))throw Object.assign(Error('WORKSTATION_TEXT_ENCODING_INVALID'),{code:'WORKSTATION_TEXT_ENCODING_INVALID',status:409});
 return text;
}
export const encodeWorkstationText=value=>'b64:'+Buffer.from(value,'utf8').toString('base64');
