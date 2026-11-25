'use strict';
// Generates only a remote plugin manifest; does not activate, deploy or authenticate.
const {isIP}=require('node:net');
function buildRemoteManifest(endpoint) {
  if(typeof endpoint!=='string'||endpoint!==endpoint.trim()||endpoint.length>2048)throw Error('Invalid MCP endpoint');
  let url;
  try{url=new URL(endpoint);}catch{throw Error('Invalid MCP endpoint');}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port||
     url.pathname!=='/mcp'||isIP(host.replace(/^\[|\]$/g,''))||!host.includes('.')||
     /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)||
     /(^|\.)example\.(com|net|org)$/.test(host)||host.endsWith('.')||
     !/^[a-z0-9.-]+$/.test(host))throw Error('Require a provisioned HTTPS DNS endpoint at /mcp, no credentials');
  return {$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',mcpServers:{
    'vivim-arbor-remote':{type:'streamable-http',url:url.href,extensions:{'com.openai':{
      auth:{type:'oauth',client:{mode:'cimd'}}
    }}}
  }};
}
if(require.main===module){
  try{
    if(process.argv.length!==3)throw Error('Usage: node remote-manifest.cjs <HTTPS endpoint ending /mcp>');
    process.stdout.write(JSON.stringify(buildRemoteManifest(process.argv[2]),null,2)+'\n');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={buildRemoteManifest};
