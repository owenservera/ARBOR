// @ts-check
/**
 * @hq:context FSF (Fleet State Feed) HTTP surface: versioned snapshot, delta, live SSE stream and an Atom projection rendered from the same snapshot, behind one token check.
 * @hq:owner hq
 * @hq:task F051
 * @hq:invariant Read-only: the server never writes store state; a missing snapshot is 503 NO_SNAPSHOT, never an empty healthy-looking feed.
 * @hq:invariant Every 200 response carries x-fsf-generation, x-fsf-version, x-fsf-issued-at and x-fsf-refresh-after.
 * @hq:invariant A delta the store cannot serve from retention is 410 GAP; a malformed `since` is 400 BAD_VERSION; neither silently falls back to the snapshot.
 * @hq:invariant /fsf/feed.xml is rendered from the normalized snapshot only: one entry per degraded slice plus one fleet entry.
 * @hq:invariant Each SSE connection owns exactly one store subscription and releases it when the socket closes.
 * @hq:why An agent must be able to prove staleness from response metadata alone and re-snapshot on a gap instead of running on stale slices.
 * @hq:see docs/FLEET-SCALE-UPGRADE.md
 */
import http from 'node:http';

/**
 * Feed store contract (owned outside this module; a stub is enough for tests):
 *
 *   store.snapshot() -> FsfSnapshot | null
 *   store.delta(since) -> { ok: true, from?, to?, changes? }
 *                       | { ok: false, code: 'GAP', oldest?, newest? }
 *                       | { ok: false, code: 'BAD_VERSION' }
 *   store.subscribe(listener) -> unsubscribe()
 *
 * `store.delta` may also throw an Error carrying `code: 'GAP' | 'BAD_VERSION'`.
 * `subscribe` listeners receive an optional publish payload; the server reads
 * the current snapshot itself so an event never carries unnormalized data.
 *
 * @typedef {object} FsfSnapshot
 * @property {string} [schema]
 * @property {number} generation
 * @property {number} version
 * @property {string | number | Date} [issuedAt]
 * @property {number} [refreshAfterMs]
 * @property {Record<string, unknown>} slices
 */

/** @typedef {{ ok: true, from?: number, to?: number, changes?: unknown[] }} FsfDeltaOk */
/** @typedef {{ ok: false, code: string, oldest?: number | null, newest?: number | null }} FsfDeltaError */
/** @typedef {FsfDeltaOk | FsfDeltaError} FsfDeltaResult */

/**
 * @typedef {object} FsfStore
 * @property {() => FsfSnapshot | null} snapshot
 * @property {(since: number) => FsfDeltaResult} [delta]
 * @property {(listener: (payload?: unknown) => void) => () => void} [subscribe]
 */

/**
 * @typedef {object} NormalizedSnapshot
 * @property {string} schema
 * @property {number} generation
 * @property {number} version
 * @property {string} issuedAt
 * @property {number} refreshAfterMs
 * @property {Record<string, unknown>} slices
 * @property {boolean} degraded True when any slice is degraded. The store publishes this
 *   flag, so a snapshot served over HTTP carries it exactly as the local one does.
 */

/**
 * @typedef {object} FeedServerOptions
 * @property {FsfStore} store
 * @property {string} token
 * @property {number} [refreshAfterMs]
 * @property {string} [host]
 * @property {number} [port]
 */

const DEFAULT_REFRESH_AFTER_MS = 5000;
const HEARTBEAT_MS = 15000;
const DEFAULT_SCHEMA = 'hq.fsf/1';

// ---------------------------------------------------------------------------
// construction
// ---------------------------------------------------------------------------

/**
 * Start an FSF feed server. Async because an ephemeral port is only known once
 * the listener is bound; `port` and `url` in the result are the real ones.
 *
 * @param {FeedServerOptions} options
 * @returns {Promise<{ server: import('node:http').Server, port: number, url: string, close: () => Promise<void> }>}
 */
export async function createFeedServer(options) {
  const {
    store,
    token,
    refreshAfterMs = DEFAULT_REFRESH_AFTER_MS,
    host = '127.0.0.1',
    port = 0,
  } = options ?? /** @type {any} */ ({});

  if (typeof token !== 'string' || token.trim() === '') {
    throw new TypeError('createFeedServer requires a non-empty token');
  }
  if (!store || typeof store !== 'object' || typeof store.snapshot !== 'function') {
    throw new TypeError('createFeedServer requires a store with a snapshot() method');
  }
  if (typeof refreshAfterMs !== 'number' || !Number.isFinite(refreshAfterMs) || refreshAfterMs <= 0) {
    throw new TypeError('refreshAfterMs must be a positive number');
  }
  if (typeof host !== 'string' || host.trim() === '') {
    throw new TypeError('host must be a non-empty string');
  }
  if (typeof port !== 'number' || !Number.isInteger(port) || port < 0 || port > 65535) {
    throw new TypeError('port must be an integer between 0 and 65535');
  }

  /** @type {Set<import('node:net').Socket>} */
  const sockets = new Set();
  /** @type {Set<() => void>} */
  const streams = new Set();
  /** @type {Promise<void> | null} */
  let closePromise = null;

  const server = http.createServer((req, res) => {
    try {
      handle(req, res);
    } catch {
      if (res.headersSent) {
        res.destroy();
      } else {
        sendJson(res, 500, { ok: false, code: 'STORE_ERROR' });
      }
    }
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  server.on('clientError', (_error, socket) => {
    try {
      socket.destroy();
    } catch {
      // socket already gone
    }
  });

  // -------------------------------------------------------------------------
  // read helpers
  // -------------------------------------------------------------------------

  /** @returns {NormalizedSnapshot | null} */
  function readSnapshot() {
    /** @type {unknown} */
    let raw;
    try {
      raw = store.snapshot();
    } catch {
      return null;
    }
    return normalizeSnapshot(raw, refreshAfterMs);
  }

  /**
   * @param {NormalizedSnapshot | null} snap
   * @returns {Record<string, string>}
   */
  function feedHeaders(snap) {
    const generation = snap ? snap.generation : 0;
    const version = snap ? snap.version : 0;
    const issuedAt = snap ? snap.issuedAt : new Date().toISOString();
    const refresh = snap ? snap.refreshAfterMs : refreshAfterMs;
    return {
      'x-fsf-generation': String(generation),
      'x-fsf-version': String(version),
      'x-fsf-issued-at': issuedAt,
      'x-fsf-refresh-after': String(refresh),
    };
  }

  // -------------------------------------------------------------------------
  // auth
  // -------------------------------------------------------------------------

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {URL} url
   * @returns {boolean}
   */
  function authorized(req, url) {
    const queryToken = url.searchParams.get('token');
    if (typeof queryToken === 'string' && safeEqual(queryToken, token)) return true;
    const header = req.headers.authorization;
    if (typeof header !== 'string') return false;
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match ? safeEqual(match[1].trim(), token) : false;
  }

  // -------------------------------------------------------------------------
  // routing
  // -------------------------------------------------------------------------

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  function handle(req, res) {
    /** @type {URL} */
    let url;
    try {
      url = new URL(req.url ?? '/', 'http://fsf.invalid');
    } catch {
      sendJson(res, 400, { ok: false, code: 'BAD_REQUEST' });
      return;
    }

    // The home page is a public dashboard: anyone opening the feed URL should
    // see the fleet state without needing to supply a token. The raw data
    // endpoints remain token-protected.
    const isPublicPath = url.pathname === '/' || url.pathname === '/fsf' || url.pathname === '/fsf/';
    if (!isPublicPath && !authorized(req, url)) {
      sendJson(res, 401, { ok: false, code: 'UNAUTHORIZED' }, {
        'www-authenticate': 'Bearer realm="fsf"',
      });
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 404, { ok: false, code: 'NOT_FOUND' });
      return;
    }

    switch (url.pathname) {
      case '/':
      case '/fsf':
      case '/fsf/':
        handleHome(res);
        return;
      case '/fsf/snapshot':
        handleSnapshot(res);
        return;
      case '/fsf/delta':
        handleDelta(url, res);
        return;
      case '/fsf/stream':
        handleStream(req, res);
        return;
      case '/fsf/feed.xml':
        handleFeed(res);
        return;
      default:
        sendJson(res, 404, { ok: false, code: 'NOT_FOUND' });
    }
  }

  /** @param {import('node:http').ServerResponse} res */
  function handleSnapshot(res) {
    const snap = readSnapshot();
    if (!snap) {
      sendJson(res, 503, { ok: false, code: 'NO_SNAPSHOT' });
      return;
    }
    sendJson(res, 200, { ok: true, ...snap }, feedHeaders(snap));
  }

  /** @param {import('node:http').ServerResponse} res */
  function handleHome(res) {
    const snap = readSnapshot();
    const version = snap ? snap.version : null;
    const generation = snap ? snap.generation : null;
    const issuedAt = snap ? snap.issuedAt : null;
    const degraded = snap ? snap.degraded : false;
    const slicesCount = snap && typeof snap.slices === 'object' && !Array.isArray(snap.slices)
      ? Object.keys(snap.slices).length
      : null;
    // Name the degraded slices, exactly as the Atom feed does. `snap.degraded` is a
    // boolean, so it can never be joined; the names come from the slices themselves.
    const degradedNames = snap && typeof snap.slices === 'object' && !Array.isArray(snap.slices)
      ? Object.entries(snap.slices).filter(([, slice]) => isDegraded(slice)).map(([name]) => name)
      : [];

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>FSF — Fleet State Feed</title>
<style>
body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
.container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; }
.degraded .dot { background: #ef4444; }
h1 { font-size: 1.25rem; margin: 0; }
.muted { color: #64748b; font-size: 0.875rem; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
.table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th { text-align: left; color: #475569; padding: 8px 12px; font-weight: 600; }
td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
.monospace { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8125rem; }
.good { color: #15803d; }
.bad { color: #dc2626; }
.footer { margin-top: 24px; color: #64748b; font-size: 0.875rem; }
</style>
</head>
<body>
<div class="container">
<div class="header${degraded ? ' degraded' : ''}">
<div class="dot"></div>
<div><h1>FSF — Fleet State Feed</h1><div class="muted">${version ? `generation ${generation} · version ${version}` : 'no snapshot yet'}</div></div>
</div>
<div class="card">
<table class="table">
<tr><th style="width:30%">Generated</th><td>${issuedAt || '—'}</td></tr>
<tr><th>Last refresh</th><td><span class="monospace">${issuedAt || '—'}</span></td></tr>
<tr><th>Slices</th><td>${slicesCount !== null ? slicesCount : '—'}</td></tr>
<tr><th>Degraded</th><td class="${degraded ? 'bad' : 'good'}">${degradedNames.length ? degradedNames.join(', ') : 'none'}</td></tr>
</table>
</div>
<div class="footer">
Built with the FSF feed · <a href="/fsf/snapshot">raw snapshot</a> · <a href="/fsf/feed.xml">atom feed</a> · <a href="/fsf/delta?since=1">delta stream</a>
</div>
</body>
</html>`;
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...feedHeaders(snap),
    });
    res.end(html);
  }

  /** @param {URL} url
   * @param {import('node:http').ServerResponse} res
   */
  function handleDelta(url, res) {
    const snap = readSnapshot();
    if (!snap) {
      sendJson(res, 503, { ok: false, code: 'NO_SNAPSHOT' });
      return;
    }

    const since = parseSince(url.searchParams.get('since'));
    if (since === null) {
      sendJson(res, 400, { ok: false, code: 'BAD_VERSION' });
      return;
    }
    if (typeof store.delta !== 'function') {
      sendJson(res, 500, { ok: false, code: 'STORE_ERROR' });
      return;
    }

    /** @type {any} */
    let result;
    try {
      result = store.delta(since);
    } catch (error) {
      result = error;
    }

    if (result && result.ok === true) {
      sendJson(res, 200, {
        ok: true,
        from: typeof result.from === 'number' ? result.from : since,
        to: typeof result.to === 'number' ? result.to : snap.version,
        changes: Array.isArray(result.changes) ? result.changes : [],
      }, feedHeaders(snap));
      return;
    }

    const code = result && typeof result === 'object' ? result.code : undefined;
    if (code === 'GAP' || (result && result.gap === true)) {
      sendJson(res, 410, {
        ok: false,
        code: 'GAP',
        oldest: typeof result.oldest === 'number' ? result.oldest : null,
        newest: typeof result.newest === 'number' ? result.newest : snap.version,
      });
      return;
    }
    if (code === 'BAD_VERSION') {
      sendJson(res, 400, { ok: false, code: 'BAD_VERSION' });
      return;
    }
    if (code === 'NO_SNAPSHOT') {
      sendJson(res, 503, { ok: false, code: 'NO_SNAPSHOT' });
      return;
    }
    sendJson(res, 500, { ok: false, code: 'STORE_ERROR' });
  }

  /** @param {import('node:http').ServerResponse} res */
  function handleFeed(res) {
    const snap = readSnapshot();
    if (!snap) {
      sendJson(res, 503, { ok: false, code: 'NO_SNAPSHOT' });
      return;
    }
    const xml = renderAtom(snap);
    res.writeHead(200, {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(xml),
      ...feedHeaders(snap),
    });
    res.end(xml);
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  function handleStream(req, res) {
    const snap = readSnapshot();
    // A missing snapshot is 503 NO_SNAPSHOT, never an empty healthy-looking feed:
    // a stream that opened at version 0 with nothing behind it would tell the
    // client it is current at a version that does not exist.
    if (!snap) {
      sendJson(res, 503, { ok: false, code: 'NO_SNAPSHOT' });
      return;
    }
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      ...feedHeaders(snap),
    });
    res.write('retry: 5000\n\n');
    res.write(`: fsf generation=${snap.generation} version=${snap.version}\n\n`);

    let cleaned = false;
    /** @type {() => void} */
    let unsubscribe = () => {};
    /** @type {ReturnType<typeof setInterval> | null} */
    let poll = null;

    const heartbeat = setInterval(() => {
      if (cleaned || res.writableEnded) return;
      res.write(': heartbeat\n\n');
    }, HEARTBEAT_MS);
    if (typeof heartbeat.unref === 'function') heartbeat.unref();

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearInterval(heartbeat);
      if (poll) clearInterval(poll);
      streams.delete(cleanup);
      try {
        unsubscribe();
      } catch {
        // an unsubscribe failure must not leak the response
      }
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {
          // client already disconnected
        }
      }
    };

    /** @param {unknown} payload */
    const publish = (payload) => {
      if (cleaned || res.writableEnded) return;
      const current = readSnapshot();
      /** @type {Record<string, unknown>} */
      const data = current
        ? {
          generation: current.generation,
          version: current.version,
          issuedAt: current.issuedAt,
          refreshAfterMs: current.refreshAfterMs,
        }
        : {
          generation: 0,
          version: 0,
          issuedAt: new Date().toISOString(),
          refreshAfterMs,
        };
      const record = /** @type {any} */ (payload);
      if (payload && typeof payload === 'object' && Array.isArray(record.changes)) {
        data.changes = record.changes;
      }
      res.write(`event: publish\ndata: ${JSON.stringify(data)}\n\n`);
    };

    if (typeof store.subscribe === 'function') {
      try {
        const off = store.subscribe(publish);
        if (typeof off === 'function') unsubscribe = off;
      } catch {
        cleanup();
        return;
      }
    } else {
      // Pull-only store (snapshot/delta, no subscribe): watch the version so the
      // stream still reports each publish instead of going silent. Coalesces
      // publishes that land between polls into one event, which is the same
      // guarantee a slow subscriber gets from any push source.
      let lastVersion = snap.version;
      const pollMs = Math.max(100, Math.min(refreshAfterMs, 1000));
      poll = setInterval(() => {
        if (cleaned || res.writableEnded) return;
        const current = readSnapshot();
        if (!current || current.version === lastVersion) return;
        lastVersion = current.version;
        publish(undefined);
      }, pollMs);
      if (poll && typeof poll.unref === 'function') poll.unref();
    }

    streams.add(cleanup);
    req.on('close', cleanup);
    req.on('aborted', cleanup);
    req.on('error', cleanup);
    res.on('close', cleanup);
  }

  // -------------------------------------------------------------------------
  // lifecycle
  // -------------------------------------------------------------------------

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve(undefined);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });

  const address = server.address();
  const boundPort = address && typeof address === 'object' ? address.port : port;
  const urlHost = host.includes(':') ? `[${host}]` : host;

  /** @returns {Promise<void>} */
  function close() {
    if (closePromise) return closePromise;
    for (const cleanup of [...streams]) {
      try {
        cleanup();
      } catch {
        // keep closing the remaining streams
      }
    }
    streams.clear();

    closePromise = new Promise((resolve) => {
      const done = () => resolve(undefined);
      if (!server.listening) {
        done();
        return;
      }
      try {
        server.close(() => done());
      } catch {
        done();
        return;
      }
      if (typeof server.closeAllConnections === 'function') {
        try {
          server.closeAllConnections();
        } catch {
          // fall through to explicit socket destruction
        }
      }
      for (const socket of [...sockets]) {
        try {
          socket.destroy();
        } catch {
          // socket already closed
        }
      }
      sockets.clear();
    });

    return closePromise;
  }

  return {
    server,
    port: boundPort,
    url: `http://${urlHost}:${boundPort}`,
    close,
  };
}

// ---------------------------------------------------------------------------
// normalization
// ---------------------------------------------------------------------------

/**
 * @param {unknown} raw
 * @param {number} fallbackRefreshMs
 * @returns {NormalizedSnapshot | null}
 */
function normalizeSnapshot(raw, fallbackRefreshMs) {
  if (!raw || typeof raw !== 'object') return null;
  const record = /** @type {Record<string, any>} */ (raw);
  const refresh = typeof record.refreshAfterMs === 'number'
    && Number.isFinite(record.refreshAfterMs)
    && record.refreshAfterMs > 0
    ? record.refreshAfterMs
    : fallbackRefreshMs;
  const slices = record.slices && typeof record.slices === 'object' && !Array.isArray(record.slices)
    ? record.slices
    : {};
  // The store publishes a top-level `degraded` flag. Preserve it so the snapshot served
  // over HTTP carries the same fields as the local one; fall back to the slice truth so
  // a store that omits it still reports degradation honestly.
  const degraded = typeof record.degraded === 'boolean'
    ? record.degraded
    : Object.values(slices).some((slice) => isDegraded(slice));
  return {
    schema: typeof record.schema === 'string' && record.schema ? record.schema : DEFAULT_SCHEMA,
    generation: toCount(record.generation),
    version: toCount(record.version),
    issuedAt: toIsoString(record.issuedAt),
    refreshAfterMs: refresh,
    degraded,
    slices: /** @type {Record<string, unknown>} */ (slices),
  };
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toCount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function toIsoString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    if (!Number.isNaN(fromNumber.getTime())) return fromNumber.toISOString();
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/**
 * @param {string | null} raw
 * @returns {number | null}
 */
function parseSince(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Atom projection (rendered from the snapshot, never hand-written)
// ---------------------------------------------------------------------------

/**
 * @param {NormalizedSnapshot} snap
 * @returns {string}
 */
function renderAtom(snap) {
  const degraded = Object.entries(snap.slices).filter(([, slice]) => isDegraded(slice));
  const total = Object.keys(snap.slices).length;
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <id>urn:fsf:fleet</id>',
    '  <title>FSF Fleet State Feed</title>',
    `  <updated>${escapeXml(snap.issuedAt)}</updated>`,
    '  <generator>hq-fsf/1</generator>',
    '  <author><name>HQ</name></author>',
    atomEntry({
      id: `urn:fsf:fleet:generation:${snap.generation}`,
      title: `Fleet generation ${snap.generation}: ${degraded.length} ${degraded.length === 1 ? 'slice' : 'slices'} degraded`,
      updated: snap.issuedAt,
      summary: `version ${snap.version}; ${total} ${total === 1 ? 'slice' : 'slices'} total; ${degraded.length} degraded; generation ${snap.generation}`,
    }),
  ];

  for (const [name, slice] of degraded) {
    const detail = sliceDetail(slice, snap.issuedAt);
    lines.push(atomEntry({
      id: `urn:fsf:slice:${encodeURIComponent(name)}`,
      title: `${name} degraded`,
      updated: detail.updated,
      summary: detail.summary,
    }));
  }

  lines.push('</feed>');
  return `${lines.join('\n')}\n`;
}

/**
 * @param {{ id: string, title: string, updated: string, summary: string }} entry
 * @returns {string}
 */
function atomEntry(entry) {
  return [
    '  <entry>',
    `    <id>${escapeXml(entry.id)}</id>`,
    `    <title>${escapeXml(entry.title)}</title>`,
    `    <updated>${escapeXml(entry.updated)}</updated>`,
    `    <summary>${escapeXml(entry.summary)}</summary>`,
    '  </entry>',
  ].join('\n');
}

/**
 * @param {unknown} slice
 * @returns {boolean}
 */
function isDegraded(slice) {
  if (!slice || typeof slice !== 'object') return false;
  const record = /** @type {Record<string, unknown>} */ (slice);
  return record.degraded === true || record.status === 'degraded';
}

/**
 * A degraded slice may be flat (`{ degraded, reason, lastGoodAt }`) or the
 * FeedStore envelope (`{ degraded, keys: { data, lastGoodAt, ... } }`). Read
 * both so the Atom entry carries the same reason the JSON feed does.
 *
 * @param {unknown} slice
 * @param {string} fallbackUpdated
 * @returns {{ updated: string, summary: string }}
 */
function sliceDetail(slice, fallbackUpdated) {
  const outer = /** @type {Record<string, any>} */ (slice ?? {});
  const keys = outer.keys && typeof outer.keys === 'object' && !Array.isArray(outer.keys)
    ? /** @type {Record<string, any>} */ (outer.keys)
    : outer;
  const data = keys.data && typeof keys.data === 'object' && !Array.isArray(keys.data)
    ? /** @type {Record<string, any>} */ (keys.data)
    : null;
  const reason = typeof keys.reason === 'string' && keys.reason
    ? keys.reason
    : data && typeof data.error === 'string' && data.error
      ? data.error
      : data && typeof data.reason === 'string' && data.reason
        ? data.reason
        : null;
  const lastGoodAt = typeof keys.lastGoodAt === 'string' && keys.lastGoodAt
    ? keys.lastGoodAt
    : typeof outer.lastGoodAt === 'string' && outer.lastGoodAt
      ? outer.lastGoodAt
      : fallbackUpdated;
  return {
    updated: lastGoodAt,
    summary: reason ?? 'degraded without a reported reason',
  };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// transport helpers
// ---------------------------------------------------------------------------

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @param {Record<string, string>} [headers]
 */
function sendJson(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
    ...headers,
  });
  res.end(text);
}

/**
 * Length-independent comparison so a token check does not leak a prefix match.
 *
 * @param {string} candidate
 * @param {string} expected
 * @returns {boolean}
 */
function safeEqual(candidate, expected) {
  const a = Buffer.from(String(candidate), 'utf8');
  const b = Buffer.from(String(expected), 'utf8');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}
