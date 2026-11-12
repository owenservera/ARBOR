// Outbound-only operational event publisher. Does not inspect browser or conversation bodies.
const TYPES=new Set(['request.created','request.approved','request.completed','request.blocked','build.started','build.completed','review.completed','fleet.started','fleet.completed','system.status']);
export function publicEvent(input) {
  if(!input || !TYPES.has(input.type)) throw Error('Invalid public event type');
  const e={type:input.type,at:input.at || new Date().toISOString()};
  if(input.provider && /^[a-z0-9_-]{1,32}$/.test(input.provider)) e.provider=input.provider;
  if(input.status && /^[a-z0-9_-]{1,32}$/.test(input.status)) e.status=input.status;
  if(typeof input.durationMs==='number' && Number.isFinite(input.durationMs) && input.durationMs>=0) e.durationMs=Math.floor(input.durationMs);
  return e;
}
export async function publishFeedEvent(input,{endpoint=process.env.VIVIM_SHARE_FEED_URL,token=process.env.VIVIM_FEED_PUBLISH_TOKEN,fetcher=fetch}={}) {
  if(!endpoint || !token) throw Error('Feed URL and token required');
  const url=new URL(endpoint);
  if(url.protocol!=='https:') throw Error('Feed requires HTTPS');
  const result=await fetcher(url,{method:'POST',headers:{'authorization':`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(publicEvent(input)),signal:AbortSignal.timeout(10000)});
  if(!result.ok) throw Error(`Feed publish HTTP ${result.status}`);
  return {published:true};
}
