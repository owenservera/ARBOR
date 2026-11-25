'use strict';
// Local operator maintenance marker. It only narrows admission, never grants
// new authority. No remote tool creates, clears, or changes this marker.
const fs=require('node:fs'),path=require('node:path');
function createMaintenanceGate({directory=path.join(__dirname,'..','maintenance')}={}){
 const file=path.join(directory,'drain.json');
 return ()=>{
  try{
   const st=fs.lstatSync(file);
   if(!st.isFile()||st.isSymbolicLink()||st.size>1024)throw Error();
   const record=JSON.parse(fs.readFileSync(file,'utf8'));
   if(record?.schema!=='vivim.workstation-maintenance/1'||!/^[a-f0-9]{32}$/.test(record.id)||
      Object.keys(record).some(k=>!['schema','id'].includes(k)))throw Error();
   return {id:record.id,reason:'local-operator-maintenance'};
  }catch(e){
   if(e?.code==='ENOENT')return null;
   return {id:null,reason:'invalid-maintenance-record'};
  }
 };
}
function createAdmission(readMarker=()=>null){
 let inFlight=0;
 function marker(){
  try{return readMarker();}catch{return {id:null,reason:'maintenance-state-unavailable'};}
 }
 return {
  status(){
   const m=marker();
   return m?{state:inFlight?'draining':'drained',inFlight,...m}:null;
  },
  async run(name,invoke){
   const m=marker();
   // Existing authorized session status/output remain observable while draining.
   // They cannot start or mutate a job. Never cancel or replay an effect here.
   if(m&&!['vivim_session_status','vivim_session_output'].includes(name))
    throw Error('WORKSTATION_MAINTENANCE');
   inFlight++;
   try{return await invoke();}finally{inFlight--;}
  }
 };
}
module.exports={createMaintenanceGate,createAdmission};
