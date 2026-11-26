#!/usr/bin/env bash
# VIVIM ARBOR Android R001: foreground, fixed-probe MCP; no APK or root.
set -euo pipefail
umask 077
root="$HOME/.vivim-android"
write_server() {
  cat > "$1" <<'JS'
'use strict';
const readline = require('node:readline');
const {execFileSync} = require('node:child_process');
const os = require('node:os');
const assert = require('node:assert/strict');
const tools = [
 {name:'vivim_android_health',description:'Read this Android MCP runtime health; no personal data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'vivim_android_probe',description:'Execute a fixed native uname -m command and report its actual output and exit code.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}}
];
function probe(){
 const env={PATH:process.env.PATH||'',HOME:process.env.HOME||''};
 const machine=execFileSync('uname',['-m'],{encoding:'utf8',timeout:3000,maxBuffer:1024,env}).trim();
 return {schema:'vivim.android-probe/1',platform:process.platform,arch:os.arch(),machine,node:process.version,exitCode:0};
}
function create(){
 let initialized=false,negotiated=false;
 const result=(id,r)=>({jsonrpc:'2.0',id,result:r});
 const error=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
 return m=>{
  if(!m||m.jsonrpc!=='2.0'||typeof m.method!=='string')return error(null,-32600,'Invalid request');
  if(!Object.hasOwn(m,'id')){if(m.method==='notifications/initialized'&&negotiated)initialized=true;return null;}
  const id=m.id;
  if(m.method==='initialize'){
   if(typeof m.params?.protocolVersion!=='string')return error(id,-32602,'Invalid initialization');
   negotiated=true;
   const versions=['2025-03-26','2025-06-18','2025-11-25'];
   return result(id,{protocolVersion:versions.includes(m.params.protocolVersion)?m.params.protocolVersion:versions.at(-1),capabilities:{tools:{listChanged:false}},serverInfo:{name:'vivim-android',version:'0.1.0'}});
  }
  if(m.method==='ping')return result(id,{});
  if(!initialized)return error(id,-32002,'Not initialized');
  if(m.method==='tools/list')return result(id,{tools});
  if(m.method!=='tools/call')return error(id,-32601,'Method not found');
  const a=m.params?.arguments??{};
  if(!a||Array.isArray(a)||typeof a!=='object'||Object.keys(a).length||!tools.some(t=>t.name===m.params?.name))return error(id,-32602,'Invalid tool or arguments');
  try{
   const data=m.params.name==='vivim_android_health'?{schema:'vivim.android-health/1',status:'ready',profile:'termux-fixed-probe',platform:process.platform}:probe();
   return result(id,{content:[{type:'text',text:JSON.stringify(data)}]});
  }catch{return result(id,{isError:true,content:[{type:'text',text:'Native probe failed'}]});}
 };
}
if(process.argv.includes('--self-test')){
 const f=create(), call=(method,params={})=>f({jsonrpc:'2.0',id:1,method,params});
 assert.equal(call('tools/list').error.code,-32002);
 assert.equal(call('initialize',{protocolVersion:'2025-11-25'}).result.protocolVersion,'2025-11-25');
 f({jsonrpc:'2.0',method:'notifications/initialized'});
 assert.equal(call('tools/list').result.tools.length,2);
 assert.equal(call('tools/call',{name:'vivim_android_health'}).result.content.length,1);
 assert.equal(call('tools/call',{name:'vivim_android_probe',arguments:{command:'id'}}).error.code,-32602);
 assert.equal(call('tools/call',{name:'unknown'}).error.code,-32602);
 assert.equal(JSON.parse(call('tools/call',{name:'vivim_android_probe'}).result.content[0].text).exitCode,0);
 console.log('7/7 local MCP checks passed, including real uname execution');
}else{
 const f=create();
 readline.createInterface({input:process.stdin,crlfDelay:Infinity}).on('line',line=>{
  let r;try{if(Buffer.byteLength(line)>65536)throw Error();r=f(JSON.parse(line));}catch{r={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid input'}};}
  if(r)process.stdout.write(JSON.stringify(r)+'\n');
 });
}
JS
}
if [[ ${1:-} == selftest ]]; then
  tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
  write_server "$tmp"; node "$tmp" --self-test; exit
fi
[[ -n ${PREFIX:-} && -x $PREFIX/bin/pkg ]] || { echo 'Run inside Termux.' >&2; exit 1; }
case ${1:-prepare} in
 prepare)
  # Termux is rolling-release: partial upgrades are unsupported.
  pkg update
  pkg upgrade
  pkg install -y git golang clang libicu
  if ! command -v node >/dev/null 2>&1; then
    pkg install -y nodejs-lts
  fi
  if ! node --version; then
    echo 'Node runtime broken; synchronize Termux packages with pkg upgrade, then retry prepare.' >&2
    exit 1
  fi
  mkdir -p "$root"; chmod 700 "$root"
  write_server "$root/server.cjs"
  node "$root/server.cjs" --self-test
  echo 'Local probe ready. Next run: bash vivim-termux.sh build'
  ;;
 build)
  [[ -f $root/server.cjs ]] || { echo 'Run prepare first.'; exit 1; }
  [[ ! -e $root/tunnel-src ]] || { echo 'Source already exists; inspect or move it locally before rebuilding.'; exit 1; }
  git clone --depth 1 --branch v0.0.21 https://github.com/openai/tunnel-client.git "$root/tunnel-src"
  (cd "$root/tunnel-src"; git rev-parse HEAD; CGO_ENABLED=1 go build -trimpath -o "$root/tunnel-client.new" ./cmd/client)
  "$root/tunnel-client.new" --version
  mv "$root/tunnel-client.new" "$root/tunnel-client"
  echo 'Candidate built. Native Android tunnel support still requires live verification.'
  ;;
 connect)
  [[ -x $root/tunnel-client && -f $root/server.cjs ]] || { echo 'Run prepare and build first.'; exit 1; }
  echo 'Use a NEW Android tunnel ID, not the Windows ID. Create it in OpenAI Platform.'
  read -r -p 'Android tunnel ID: ' CONTROL_PLANE_TUNNEL_ID
  [[ $CONTROL_PLANE_TUNNEL_ID =~ ^tunnel_([a-z0-9]{4}_)?[a-z0-9]{32}$ ]] || { echo 'Invalid tunnel ID'; exit 1; }
  read -r -s -p 'Restricted runtime API key (hidden): ' CONTROL_PLANE_API_KEY; echo
  [[ -n $CONTROL_PLANE_API_KEY ]] || exit 1
  export CONTROL_PLANE_TUNNEL_ID CONTROL_PLANE_API_KEY
  export GODEBUG=netdns=cgo HEALTH_LISTEN_ADDR=127.0.0.1:8765
  export MCP_COMMAND="$PREFIX/bin/env -u CONTROL_PLANE_API_KEY -u OPENAI_API_KEY -u OPENAI_ADMIN_KEY $PREFIX/bin/node $root/server.cjs"
  echo 'Foreground tunnel; Ctrl+C disconnects. Local health: http://127.0.0.1:8765/readyz'
  exec "$root/tunnel-client" run --log.level=info --log.format=json
  ;;
 *) echo 'Usage: bash vivim-termux.sh {prepare|build|connect|selftest}'; exit 1;;
esac
