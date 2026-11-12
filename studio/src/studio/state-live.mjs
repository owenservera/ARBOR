/**
 * @hq:context Live samplers for browser and tab state via Chrome DevTools HTTP endpoints on loopback.
 * @hq:owner atlas
 * @hq:task state-live-samplers
 *
 * Pure fetch over loopback. No CDP websocket, no new dependencies, no cookies/tokens ever returned.
 * A probe failure is data, not an exception: unreachable ports are reported with reachable:false.
 */

const VERSION_KEYS = ['Version', 'version'];

function versionOf(body) {
  for (const key of VERSION_KEYS) {
    if (body !== null && typeof body === 'object' && key in body) return body[key];
  }
  return null;
}

function siteOf(url) {
  try {
    return new URL(String(url ?? '')).hostname;
  } catch {
    return '';
  }
}

async function fetchJson(fetchImpl, url) {
  const res = await fetchImpl(url);
  if (res !== null && typeof res === 'object' && typeof res.json === 'function') {
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return await res.json();
  }
  return res;
}

export async function enumerateBrowsers({ ports = [9222], fetchImpl = globalThis.fetch } = {}) {
  const browsers = [];
  for (const port of ports) {
    const url = `http://127.0.0.1:${port}/json/version`;
    let reachable = false;
    let version = null;
    try {
      const body = await fetchJson(fetchImpl, url);
      reachable = true;
      version = versionOf(body);
    } catch {
      // Probe failure is data, not an exception: report reachable:false.
    }
    browsers.push({ port, reachable, version });
  }
  return { count: browsers.filter((b) => b.reachable).length, browsers };
}

export async function sampleTabs({ port = 9222, fetchImpl = globalThis.fetch } = {}) {
  const url = `http://127.0.0.1:${port}/json/list`;
  let targets;
  try {
    targets = await fetchJson(fetchImpl, url);
  } catch {
    return { count: 0, tabs: [], sites: [] };
  }
  const tabs = [];
  const siteSet = new Set();
  for (const t of targets ?? []) {
    if (t?.type !== 'page') continue;
    const url = String(t?.url ?? '');
    const site = siteOf(url);
    const tab = { id: t?.id, url, title: t?.title ?? '', site };
    tabs.push(tab);
    if (site) siteSet.add(site);
  }
  return { count: tabs.length, tabs, sites: Array.from(siteSet) };
}

export async function sampleLiveState(opts = {}) {
  const { ports = [9222], port = 9222, fetchImpl = globalThis.fetch } = opts;
  const sampledAt = new Date().toISOString();
  try {
    const [browsers, tabs] = await Promise.all([
      enumerateBrowsers({ ports, fetchImpl }),
      sampleTabs({ port, fetchImpl }),
    ]);
    return { browsers, tabs, sampledAt };
  } catch {
    return {
      browsers: { count: 0, browsers: [] },
      tabs: { count: 0, tabs: [], sites: [] },
      sampledAt,
    };
  }
}

// Alias kept for the `studio state live` command, which was specified as sampleLive.
export const sampleLive = sampleLiveState;
