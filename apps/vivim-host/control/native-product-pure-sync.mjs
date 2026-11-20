// Compatibility bridge for pre-existing synchronous Host pure APIs.
// When the packaged Rust binary exists, these APIs compute natively. The
// original JS remains a source-compatible fallback for unpackaged workspaces.
// @hq:consumes vivim.product-pure-native@1
import {spawnSync} from 'node:child_process';
import {resolveBundledRustBinary} from '../chat/rust-context.mjs';
const LIMIT=512*1024;
const operations=Object.freeze({
  'command-program':'vivim.command-program/1',
  'context-grounding':'vivim.command-grounding/1',
  'control-preclaim':'vivim.control-preclaim/1',
  'control-effect-disposition':'vivim.control-effect-disposition/1',
  'control-typed-plan':'vivim.control-plan-projection/1',
  'control-candidate-plan':'vivim.control-plan-projection/1',
  'wiki-write-recipe':'vivim.wiki-write-recipe-native/1',
  'wiki-read-recipe':'vivim.wiki-read-recipe-native/1',
  'command-ai-guard':'vivim.command-ai-proposal-guard/1',
  'control-lexicon-transition':'vivim.control-lexicon-transition/1'
});
export function runNativeProductPureSync(operation,input){
  if(!Object.hasOwn(operations,operation)||input===null||typeof input!=='object')
    return null;
  let binary;
  try{binary=resolveBundledRustBinary('vivim-product-pure');}catch{return null}
  if(!binary)return null;
  let wire;
  try{wire=JSON.stringify({schema:'vivim.product-pure-request/1',operation,input})}catch{return null}
  if(typeof wire!=='string'||Buffer.byteLength(wire,'utf8')>LIMIT)return null;
  const reply=spawnSync(binary,[],{input:wire,encoding:'utf8',shell:false,
    windowsHide:true,timeout:1200,maxBuffer:LIMIT});
  if(reply.error||reply.status!==0||typeof reply.stdout!=='string'||
    Buffer.byteLength(reply.stdout,'utf8')>LIMIT)return null;
  let result;try{result=JSON.parse(reply.stdout)}catch{return null}
  if(result?.schema!=='vivim.product-pure-response/1'||result.operation!==operation||
    result.state!=='computed'||result.authority!=='none'||
    result.executionAuthorized!==false||result.effectPerformed!==false||
    result.result?.schema!==operations[operation]||
    result.result?.executionAuthorized!==false)return null;
  return result.result;
}
