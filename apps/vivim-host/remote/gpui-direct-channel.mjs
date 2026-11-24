// ONE existing Host Direct handler's GPUI byte/input ferry.
// This module opens NO TCP listener, browser session, pairing store, renderer,
// command dispatcher, or background recorder. The Direct handler has already
// verified the loopback Tailscale Serve proxy before calling handle().
//
// Native frame publication and native input pickup require the CANONICAL Host
// owner token, not a phone grant. Phone pixels require a live device
// control:read grant; input additionally requires control:execute, exact
// Direct origin, and a custom CSRF header. Native GPUI still owns controls,
// focus and actual input-effect admission, never this transport.
import {loadOwnerToken,verifyOwnerToken} from '../bootstrap/owner-auth.mjs';
import {createGpuiHostFrameRelay} from './gpui-frame-relay.mjs';

const MAX_FRAME_BYTES=4*1024*1024;
const MAX_INPUT_BYTES=8*1024;
const MAX_QUEUE=32;
const FRAME_MAX_AGE_MS=5_000;
const hex32=value=>typeof value==='string'&&/^[a-f0-9]{32}$/.test(value);
const integer=value=>typeof value==='string'&&/^(?:0|[1-9][0-9]{0,15})$/.test(value)&&
  Number.isSafeInteger(Number(value));
const bodyContentType=req=>String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
const failure=(code,status=400)=>Object.assign(new Error(code),{code,status});
const json=(res,status,value)=>{
  res.setHeader('content-type','application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(value));
};
const noContent=(res)=>{res.writeHead(204);res.end();};
async function readLimited(req,max){
  let total=0,oversized=false;
  const chunks=[];
  for await(const block of req){
    total+=block.length;
    if(total>max){oversized=true;chunks.length=0;}
    else if(!oversized)chunks.push(Buffer.from(block));
  }
  if(oversized)throw failure('GPUI_BODY_TOO_LARGE',413);
  return Buffer.concat(chunks);
}
function cursorFromUrl(req,origin){
  const params=new URL(req.url||'/',origin).searchParams;
  if([...params.keys()].some(k=>k!=='session'&&k!=='after')||
     params.getAll('session').length>1||params.getAll('after').length>1)
    throw failure('GPUI_CURSOR_INVALID');
  if(!params.has('session')&&!params.has('after'))return null;
  if(!hex32(params.get('session'))||!integer(params.get('after')))
    throw failure('GPUI_CURSOR_INVALID');
  return {session:params.get('session'),revision:Number(params.get('after'))};
}
function nativeFrameMetadata(req){
  const session=req.headers['x-vivim-gpui-session'];
  const revision=req.headers['x-vivim-gpui-revision'];
  const width=req.headers['x-vivim-gpui-width'];
  const height=req.headers['x-vivim-gpui-height'];
  if(!hex32(session)||!integer(revision)||Number(revision)<1||
     !integer(width)||!integer(height)||
     Number(width)<240||Number(width)>4096||
     Number(height)<240||Number(height)>4096)
    throw failure('GPUI_FRAME_METADATA_INVALID');
  return {session,revision:Number(revision),width:Number(width),height:Number(height)};
}
export function createGpuiDirectChannel({
  dataRoot,origin,enrollment,ownerTokenFor=()=>loadOwnerToken({dataRoot,create:false}).token,
  now=()=>Date.now()
}={}){
  if(typeof dataRoot!=='string'||!dataRoot||
     typeof origin!=='string'||!origin.startsWith('https://')||
     !enrollment||typeof enrollment.validateGrant!=='function'||
     typeof ownerTokenFor!=='function'||typeof now!=='function')
    throw new TypeError('GPUI_DIRECT_DEPENDENCIES_INVALID');

  let frameAt=0,closed=false;
  const queue=[];
  const phoneContext=(req,scope)=>{
    const grantId=req.headers['x-vivim-grant-id'];
    const sessionId=req.headers['x-vivim-device-session'];
    if(!hex32(grantId)||!hex32(sessionId))throw failure('DEVICE_SESSION_REQUIRED',401);
    let grant;
    try{grant=enrollment.validateGrant({grantId,sessionId});}
    catch{throw failure('DEVICE_SESSION_INVALID',403);}
    if(!hex32(grant?.deviceId)||!Array.isArray(grant?.scopes)||
       !grant.scopes.includes(scope))throw failure('DEVICE_SCOPE_DENIED',403);
    return {deviceId:grant.deviceId,grantId,sessionId};
  };
  const nativeAuthorized=req=>{
    if(req.headers['x-vivim-gpui-native']!=='1'||
       req.headers.origin!==undefined)return false;
    try{return verifyOwnerToken(req.headers.authorization,ownerTokenFor());}
    catch{return false;}
  };
  const phoneStillAuthorized=(context,_)=>{
    try{
      const grant=enrollment.validateGrant({
        grantId:context.grantId,sessionId:context.sessionId
      });
      return grant?.deviceId===context.deviceId &&
        grant.scopes?.includes('control:read');
    }catch{return false;}
  };
  const relay=createGpuiHostFrameRelay({
    authorizeNative:context=>context?.verifiedOwner===true,
    authorizePhone:phoneStillAuthorized,
    forwardToGpui:async(_context,packet)=>{
      if(queue.length>=MAX_QUEUE)throw failure('GPUI_INPUT_QUEUE_FULL',503);
      queue.push({...packet}); // only already validated inert GPUI input shape
    }
  });
  const expire=()=>{
    if(frameAt>0&&now()-frameAt>FRAME_MAX_AGE_MS){
      frameAt=0;queue.length=0;relay.invalidate();
    }
  };
  const handle=async(req,res,route)=>{
    if(!route.startsWith('api/gpui/'))return false;
    res.setHeader('cache-control','private, no-store');
    res.setHeader('x-content-type-options','nosniff');
    if(closed){json(res,503,{code:'GPUI_DIRECT_CLOSED'});return true;}
    expire();
    try{
      if(route==='api/gpui/native-frame'){
        if(req.method!=='POST')throw failure('GPUI_METHOD',405);
        if(!nativeAuthorized(req))throw failure('GPUI_OWNER_REQUIRED',401);
        if(bodyContentType(req)!=='image/png')throw failure('GPUI_CONTENT_TYPE',415);
        const dimensions=nativeFrameMetadata(req);
        const bytes=await readLimited(req,MAX_FRAME_BYTES);
        // Revocation or owner-token rotation while reading must still refuse.
        if(!nativeAuthorized(req))throw failure('GPUI_OWNER_REQUIRED',401);
        const result=relay.publish({verifiedOwner:true},{
          kind:'vivim.gpui.pixels/1',...dimensions,png:Uint8Array.from(bytes)
        });
        if(result.state!=='published')throw failure(result.reason||'GPUI_FRAME_INVALID',409);
        frameAt=now();
        json(res,202,{schema:'vivim.gpui-native-frame-receipt/1',
          state:'published',session:result.session,revision:result.revision,
          subscribersDelivered:result.subscribersDelivered});
        return true;
      }
      if(route==='api/gpui/native-stop'){
        if(req.method!=='POST')throw failure('GPUI_METHOD',405);
        if(!nativeAuthorized(req))throw failure('GPUI_OWNER_REQUIRED',401);
        if(req.headers['content-length']!==undefined &&
           req.headers['content-length']!=='0')
          throw failure('GPUI_STOP_BODY_UNEXPECTED',400);
        // Explicit owner stop is stronger than TTL: clear every retained
        // frame and pending input before replying. Device replay cursors
        // survive reconnect, never replay uncertain native effects.
        queue.length=0;frameAt=0;relay.invalidate();
        json(res,200,{schema:'vivim.gpui-owner-stop/1',state:'stopped'});
        return true;
      }
      if(route==='api/gpui/native-input'){
        if(req.method!=='GET')throw failure('GPUI_METHOD',405);
        if(!nativeAuthorized(req))throw failure('GPUI_OWNER_REQUIRED',401);
        if(new URL(req.url||'/',origin).search)throw failure('GPUI_QUERY_INVALID');
        if(!queue.length){noContent(res);return true;}
        // Never auto-requeue on uncertain response. Native GPUI's InputFence
        // must acknowledge by exact native control, not by Host submission.
        const packet=queue.shift();
        json(res,200,{schema:'vivim.gpui-native-input/1',
          state:'unverified',input:packet});
        return true;
      }
      if(route==='api/gpui/status'||route==='api/gpui/frame'){
        if(req.method!=='GET')throw failure('GPUI_METHOD',405);
        const context=phoneContext(req,'control:read');
        if(route==='api/gpui/status'){
          if(new URL(req.url||'/',origin).search)throw failure('GPUI_QUERY_INVALID');
          const snapshot=relay.readLatest(context);
          json(res,200,{schema:'vivim.gpui-phone-status/1',
            available:snapshot.state==='frame',
            session:snapshot.state==='frame'?snapshot.session:null,
            revision:snapshot.state==='frame'?snapshot.revision:null,
            reason:snapshot.state==='frame'?null:'No fresh owner-authenticated GPUI frame'});
          return true;
        }
        const snapshot=relay.readLatest(context,cursorFromUrl(req,origin));
        if(snapshot.state==='unavailable'||snapshot.state==='unchanged'){
          noContent(res);return true;
        }
        if(snapshot.state!=='frame')throw failure(snapshot.reason||'GPUI_PHONE_NOT_ADMITTED',403);
        // The grant may have been revoked during source observation.
        phoneContext(req,'control:read');
        res.setHeader('content-type','image/png');
        res.setHeader('x-vivim-gpui-session',snapshot.session);
        res.setHeader('x-vivim-gpui-revision',String(snapshot.revision));
        res.setHeader('x-vivim-gpui-width',String(snapshot.width));
        res.setHeader('x-vivim-gpui-height',String(snapshot.height));
        res.writeHead(200);res.end(Buffer.from(snapshot.png));
        return true;
      }
      if(route==='api/gpui/input'){
        if(req.method!=='POST')throw failure('GPUI_METHOD',405);
        if(req.headers.origin!==origin ||
           req.headers['x-vivim-gpui-input']!=='1')
          throw failure('GPUI_ORIGIN_OR_CSRF',403);
        const context=phoneContext(req,'control:execute');
        if(bodyContentType(req)!=='application/json')throw failure('GPUI_CONTENT_TYPE',415);
        const raw=await readLimited(req,MAX_INPUT_BYTES);
        let packet;
        try{packet=JSON.parse(raw.toString('utf8'));}
        catch{throw failure('GPUI_INPUT_JSON_INVALID');}
        expire();
        if(!frameAt)throw failure('GPUI_FRAME_UNAVAILABLE',503);
        phoneContext(req,'control:execute');
        let result;
        if(packet?.kind==='vivim.gpui.pointer/1')
          result=await relay.receivePointer(context,packet);
        else if(packet?.kind==='vivim.gpui.text/1')
          result=await relay.receiveText(context,packet);
        else throw failure('GPUI_INPUT_KIND_INVALID');
        // If authorization is lost during uncertain native submission, do
        // NOT report a confirmed result or replay this packet.
        try{phoneContext(req,'control:execute');}
        catch{json(res,503,{state:'native_delivery_uncertain'});return true;}
        const status=result.state==='submitted_to_native_unverified'?202:
          result.state==='native_delivery_uncertain'?503:409;
        json(res,status,result);
        return true;
      }
      throw failure('GPUI_ROUTE_UNKNOWN',404);
    }catch(error){
      const status=Number.isInteger(error?.status)?error.status:500;
      json(res,status,{code:typeof error?.code==='string'?error.code:
        status===500?'GPUI_DIRECT_UNAVAILABLE':'GPUI_REQUEST_REFUSED'});
      return true;
    }
  };
  const close=()=>{if(closed)return;closed=true;queue.length=0;frameAt=0;relay.close();};
  return Object.freeze({handle,close,status:()=>Object.freeze({
    active:!closed&&frameAt>0&&now()-frameAt<=FRAME_MAX_AGE_MS,
    queuedInputs:queue.length // no image, token, identity or private text
  })});
}
