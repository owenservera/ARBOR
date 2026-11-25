'use strict';
// Discovery only. This catalogue is not a model registry or an execution router.
const fs=require('node:fs'), path=require('node:path');
const cli=(id,name,command,transport,reference)=>({id,name,kind:'cli',command,transport,reference});
const web=(id,name,origin)=>({id,name,kind:'web',origin,transport:'ARBOR Host / signed-in Chrome / Studio'});
const catalog=[
cli('zcode','ZCode','zcode','Native NDJSON + V4','vivim-labs/ZCODE-DESKTOP-COMMANDER-OPERATIONS/NATIVE-PROTOCOL.md'),
cli('claude-code','Claude Code','claude','Documented headless structured output','https://code.claude.com/docs/en/headless'),
cli('antigravity-cli','Antigravity CLI','agy','Documented headless mode','https://antigravity.google/docs/cli/headless/'),
cli('codex','Codex','codex','Native App Server JSON-RPC','https://learn.chatgpt.com/docs/app-server'),
cli('opencode','OpenCode','opencode','Local server protocol','https://opencode.ai/docs/api'),
cli('gemini-cli','Gemini CLI','gemini','Documented headless JSON (legacy compatibility)','https://geminicli.com/docs/cli/headless/'),
web('chatgpt-web','ChatGPT','https://chatgpt.com'),web('claude-web','Claude','https://claude.ai'),web('gemini-web','Gemini','https://gemini.google.com'),web('qwen-web','Qwen','https://chat.qwen.ai'),web('kimi-web','Kimi','https://www.kimi.com'),web('deepseek-web','DeepSeek','https://chat.deepseek.com'),web('zai-web','Z.ai','https://chat.z.ai')];
const schema={type:'object',properties:{},required:[],additionalProperties:false};
function discover(command){const dirs=(process.env.PATH||'').split(path.delimiter).map(x=>x.trim().replace(/^"|"$/g,'')).filter(x=>path.isAbsolute(x));const exts=process.platform==='win32'?['.exe','.cmd','.bat','.com']:[''];let count=0;for(const d of new Set(dirs)){for(const ext of exts){try{const f=path.join(d,command+ext);if(fs.statSync(f).isFile()){if(process.platform!=='win32')fs.accessSync(f,fs.constants.X_OK);count++}}catch{}}}return {candidateCount:count,discovery:count?'path-candidate':'not-found-on-path',health:'unverified',authenticated:'unknown'};}
module.exports=()=>[
['vivim_ecosystem_catalog','List target CLI and web integrations and the actual adapter implementation boundaries. This is not a model registry.',schema,()=>({authority:'ARBOR Host',admission:'Existing model/provider registry; no unapproved billing',targets:catalog.map(x=>({...x,implementation:x.id==='zcode'?'read-only Rust observer available':x.id==='codex'?'local App Server read-only observer implemented; live acceptance pending':'planned'})),commander:'Bootstrap/fallback only'})],
['vivim_cli_inventory','Detect known CLI executable candidates on PATH without executing any command or exposing credentials or PATH values. Presence does not establish health.',schema,()=>({observedAt:new Date().toISOString(),cli:catalog.filter(x=>x.kind==='cli').map(x=>({id:x.id,command:x.command,...discover(x.command)})),note:'Multiple candidates may include broken launchers. No commands or provider calls executed.'})]
];
