#!/usr/bin/env node
// Explicit Inno Setup compilation of a *verified* native GPUI portable tree.
// No Tauri CLI/MSI, no owner data, no GitHub Actions and no signing claim.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyBundle} from './bundle-gpui-desktop.mjs';

const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const RECIPE=path.join(REPO,'tools','packaging','gpui-windows-installer.iss');
const BASENAME='VIVIM-GPUI-Host-0.1.0-x64.exe';
const fail=s=>{throw Error('GPUI_INSTALLER_REFUSED: '+s);};
export function parseInstallerArgs(args) {
  if(args.length!==4||args[0]!=='--portable'||args[2]!=='--iscc')fail('Expected --portable DIR --iscc ABSOLUTE_ISCC_EXE');
  const portable=path.resolve(args[1]),iscc=path.resolve(args[3]);
  if(!path.isAbsolute(args[3])||path.basename(iscc).toLowerCase()!=='iscc.exe')
    fail('Inno Setup compiler must be an explicit absolute ISCC.exe');
  return {portable,iscc};
}
export function buildInstaller({portable,iscc}){
  if(process.platform!=='win32'||process.arch!=='x64')fail('Windows x64 is required');
  if(!existsSync(iscc)||!lstatSync(iscc).isFile()||lstatSync(iscc).isSymbolicLink())fail('Missing legitimate ISCC executable');
  const verified=verifyBundle(portable);
  if(!verified.executableSha256)fail('Portable executable not verified');
  const destination=path.resolve(portable,'..','installers',BASENAME);
  if(existsSync(destination))fail('Existing installer would be overwritten');
  const env={...process.env,ARBOR_GPUI_PORTABLE_DIR:portable};
  const result=spawnSync(iscc,['/Qp',RECIPE],{cwd:REPO,env,encoding:'utf8',windowsHide:true,shell:false,timeout:600000,maxBuffer:1024*1024});
  if(result.error||result.status!==0)fail('ISCC compiler did not complete successfully: '+String(result.status??'spawn error'));
  if(!existsSync(destination)||lstatSync(destination).isSymbolicLink()||!lstatSync(destination).isFile())
    fail('Installer file missing after compiler success');
  const body=readFileSync(destination);
  if(body.length<64||body[0]!==0x4d||body[1]!==0x5a)fail('Installer is not Windows PE executable');
  return {status:'UNSIGNED_GPUI_INSTALLER_BUILT_NOT_RELEASE_ACCEPTED',path:destination,
    sha256:createHash('sha256').update(body).digest('hex'),
    sourceExeSha256:verified.executableSha256,signature:'UNVERIFIED',upgrade:'UNRUN',device:'UNRUN'};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  try{console.log(JSON.stringify(buildInstaller(parseInstallerArgs(process.argv.slice(2)))));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
