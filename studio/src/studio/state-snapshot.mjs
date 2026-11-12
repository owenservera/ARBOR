/**
 * @hq:context State snapshot composer: one object answering "what is true right now" from already-sampled browser, tab, window, page and account data.
 * @hq:owner vivim-orchestrator
 * @hq:task state-snapshot-composer
 * @hq:invariant every input is optional and already sampled; this function does no I/O. A missing section is freshness 'missing' and is named by missingFacts, never silently defaulted to a known zero. Cookie/token/password-like keys never pass through sections.
 */

// Keys that look like credentials and must never be passed through the snapshot.
const SECRET_KEY = /^(?:cookie|tokens?|password|passwd|secret|access.token|refresh.token|api.key|authorization|bearer|credential|private.key|session.id|xsrf|csrf)$/i;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Deep copy of an array/object with secret-looking keys removed at every level.
function stripSecrets(value) {
  if (Array.isArray(value)) return value.map((item) => stripSecrets(item));
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) continue;
      out[key] = stripSecrets(item);
    }
    return out;
  }
  return value;
}

function stripSecretsArray(list) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => stripSecrets(item));
}

// Best-effort site key for a page: an explicit `site`, else the URL origin.
function siteOf(page) {
  if (!isPlainObject(page)) return undefined;
  if (typeof page.site === 'string' && page.site.trim() !== '') return page.site.trim();
  if (typeof page.url === 'string' && page.url.trim() !== '') {
    try {
      return new URL(page.url.trim()).origin;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function accountSignedIn(account) {
  if (!isPlainObject(account)) return false;
  if (typeof account.signedIn === 'boolean') return account.signedIn;
  const state = String(account.state ?? '').toLowerCase();
  return state === 'signed-in' || state === 'signedin' || state === 'authenticated' || state === 'active';
}

function accountUnknown(account) {
  if (!isPlainObject(account)) return true;
  if (typeof account.signedIn === 'boolean') return false; // explicitly signed in or signed out
  if (account.state === undefined) return true;
  const state = String(account.state ?? '').toLowerCase();
  return state === 'unknown' || state === '' || state === 'unset';
}

function freshnessOf(section) {
  return section === undefined ? 'missing' : 'live';
}

/**
 * Compose a point-in-time state snapshot from already-sampled data.
 *
 * Every input is optional and was already sampled by the browser/CDP owner; this
 * function does no I/O. A section that was not sampled is freshness 'missing' and
 * its summary count stays 0 — missingFacts(snapshot) names it so a reader can
 * distinguish "0 tabs because none are open" (known) from "0 tabs because nothing
 * was sampled" (unknown).
 *
 * @param {object} args
 * @param {Array} [args.browsers] sampled browser handles
 * @param {Array} [args.tabs] sampled tab handles
 * @param {Array} [args.windows] sampled window handles
 * @param {Array} [args.pages] sampled page observations (each with `url` and/or `site`)
 * @param {Array} [args.accounts] sampled account observations (each with `signedIn` and/or `state`)
 * @param {string} [args.sampledAt] ISO timestamp; defaults to now
 * @returns {{ sampledAt: string, freshness: { browsers: 'live'|'stale'|'missing', tabs: 'live'|'stale'|'missing', windows: 'live'|'stale'|'missing', pages: 'live'|'stale'|'missing', accounts: 'live'|'stale'|'missing' }, summary: { browserCount: number, windowCount: number, tabCount: number, siteCount: number, signedInCount: number, unknownAccounts: number }, sections: { browsers, tabs, windows, pages, accounts } }}
 */
export function composeSnapshot({ browsers, tabs, windows, pages, accounts, sampledAt } = {}) {
  const at =
    typeof sampledAt === 'string' && sampledAt.trim() !== '' ? sampledAt.trim() : new Date().toISOString();

  const sections = {
    browsers: stripSecretsArray(browsers),
    tabs: stripSecretsArray(tabs),
    windows: stripSecretsArray(windows),
    pages: stripSecretsArray(pages),
    accounts: stripSecretsArray(accounts),
  };

  const freshness = {
    browsers: freshnessOf(browsers),
    tabs: freshnessOf(tabs),
    windows: freshnessOf(windows),
    pages: freshnessOf(pages),
    accounts: freshnessOf(accounts),
  };

  const browserCount = Array.isArray(browsers) ? browsers.length : 0;
  const windowCount = Array.isArray(windows) ? windows.length : 0;
  const tabCount = Array.isArray(tabs) ? tabs.length : 0;

  const sites = new Set();
  for (const page of pages ?? []) {
    const site = siteOf(page);
    if (site !== undefined) sites.add(site);
  }
  const siteCount = sites.size;

  let signedInCount = 0;
  let unknownAccounts = 0;
  if (Array.isArray(accounts)) {
    for (const account of accounts) {
      if (accountSignedIn(account)) signedInCount += 1;
      if (accountUnknown(account)) unknownAccounts += 1;
    }
  } else {
    // Accounts were not sampled: every known tab carries an unknown account.
    unknownAccounts = tabCount;
  }

  return {
    sampledAt: at,
    freshness,
    summary: {
      browserCount,
      windowCount,
      tabCount,
      siteCount,
      signedInCount,
      unknownAccounts,
    },
    sections,
  };
}

/**
 * Human sentences naming what the snapshot does not know.
 *
 * An empty array means the snapshot is complete. It is never empty when a section
 * was missing.
 *
 * @param {object} snapshot output of composeSnapshot
 * @returns {string[]}
 */
export function missingFacts(snapshot) {
  const facts = [];
  const freshness = isPlainObject(snapshot) && isPlainObject(snapshot.freshness) ? snapshot.freshness : {};
  const summary = isPlainObject(snapshot) && isPlainObject(snapshot.summary) ? snapshot.summary : {};

  const missing = (key) => freshness[key] === 'missing' || freshness[key] === undefined;

  if (missing('browsers')) facts.push('no browser is reachable');
  if (missing('tabs')) facts.push('no tab is reachable');
  if (missing('windows')) facts.push('window geometry is missing');
  if (missing('pages')) facts.push('pages were not sampled');
  if (missing('accounts')) {
    const tabCount = typeof summary.tabCount === 'number' ? summary.tabCount : 0;
    if (tabCount > 0) facts.push(`${tabCount} tabs have an unknown account`);
    else facts.push('accounts were not sampled');
  }

  return facts;
}
