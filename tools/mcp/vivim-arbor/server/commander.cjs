'use strict';
// Existing licensed local engine: no remote relay, downloads or credentials.
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const candidates=[];
if(process.env.VIVIM_COMMANDER_ENTRY)candidates.push(process.env.VIVIM_COMMANDER_ENTRY);
const cache=process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'npm-cache','_npx');
if(cache&&fs.existsSync(cache))for(const p of fs.readdirSync(cache).sort())candidates.push(path.join(cache,p,'node_modules','@wonderwhy-er','desktop-commander','dist','index.js'));
const entry=candidates.find(f=>{try{return fs.statSync(f).isFile()&&JSON.parse(fs.readFileSync(path.join(path.dirname(f),'..','package.json'),'utf8')).version==='0.3.4'}catch{return false}});
if(!entry){console.error('Pinned Desktop Commander 0.3.4 missing; set VIVIM_COMMANDER_ENTRY to a verified local build.');process.exit(1)}
const child=spawn(process.execPath,[entry,'--no-onboarding'],{stdio:'inherit',windowsHide:true});
child.on('error',e=>{console.error(e.message);process.exitCode=1});child.on('exit',code=>{process.exitCode=code??1});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
