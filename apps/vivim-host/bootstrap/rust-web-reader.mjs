// Host-only Rust HQKG query adapter. Runs the existing read-only CLI, not a
// browser, Studio ingress, provider API, or secondary storage engine.
import path from 'node:path';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { WEB_MEMORY_SCHEMA } from './web-memory.mjs';

const execFile = promisify(execFileCb);
const error = code => Object.assign(new Error(code), { code });

export function createRustWebReader({ dataRoot, env = process.env, execute = execFile } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot))
    throw error('WEB_ROOT_REQUIRED');
  const binary = env.VIVIM_WEB_MEMORY_BIN;
  const journal = env.VIVIM_WEB_MEMORY_JOURNAL ||
    path.join(dataRoot, 'browser-companion', 'web-memory.hqj');

  return async function readRustPage(cursor = 0) {
    if (typeof binary !== 'string' || !path.isAbsolute(binary))
      throw error('WEB_RUST_QUERY_UNAVAILABLE');
    if (!path.isAbsolute(journal) || !Number.isSafeInteger(cursor) || cursor < 0)
      throw error('WEB_RUST_CURSOR_INVALID');
    let stdout;
    try {
      ({ stdout } = await execute(binary, [journal, 'query',
        '--after-cursor', String(cursor), '--limit', '32'], {
        encoding: 'utf8', shell: false, windowsHide: true, timeout: 8000, maxBuffer: 65536
      }));
    } catch (cause) {
      const e = error('WEB_RUST_QUERY_FAILED');
      e.cause = cause;
      throw e;
    }
    if (typeof stdout !== 'string' || Buffer.byteLength(stdout) > 65536)
      throw error('WEB_RUST_OUTPUT_INVALID');
    let response;
    try { response = JSON.parse(stdout); } catch { throw error('WEB_RUST_OUTPUT_INVALID'); }
    if (response?.schema !== WEB_MEMORY_SCHEMA || !Array.isArray(response.results) ||
        response.results.length > 32 || !Number.isSafeInteger(response.nextCursor) ||
        response.nextCursor < cursor || typeof response.hasMore !== 'boolean' ||
        !Number.isSafeInteger(response.cursor) || response.cursor < response.nextCursor)
      throw error('WEB_RUST_OUTPUT_INVALID');
    if (response.hasMore && (response.results.length === 0 || response.nextCursor === cursor))
      throw error('WEB_RUST_CURSOR_STALLED');
    const items = response.results.map(r => {
      if (r?.source !== 'vivim.browser-companion' ||
          r.provenance !== 'browser:' + r.installationId + ':' + r.id ||
          r.verified !== true) throw error('WEB_RUST_SOURCE_UNVERIFIED');
      return { eventId: r.id, installationId: r.installationId, site: r.site,
        url: r.url, observedAt: r.observedAt, sourceRef: r.provenance, verified: true };
    });
    return {
      schema: WEB_MEMORY_SCHEMA, authority: 'hqkg', cursor: String(response.nextCursor),
      coverage: response.hasMore ? 'partial' : 'complete', items, hasMore: response.hasMore
    };
  };
}
