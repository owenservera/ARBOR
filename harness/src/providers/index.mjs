import chatgpt from './chatgpt.mjs';
import claude from './claude.mjs';
import deepseek from './deepseek.mjs';
import grok from './grok.mjs';
import qwen from './qwen.mjs';
import zai from './zai.mjs';
import gemini from './gemini.mjs';
import kimi from './kimi.mjs';

// Every imported profile MUST appear here. An imported-but-unregistered profile is silently
// unreachable: it validates, it exports, and `getProvider`/`providerForUrl` never see it.
// This array is the ONLY list of reachable providers, so it is maintained explicitly (order is
// meaningful) and the invariant is pinned by a test: every profile module in this directory is
// registered here. See test/providers/providers.test.mjs.
const providers = [chatgpt, claude, deepseek, grok, qwen, zai, gemini, kimi];
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
export function validateProfile(p) {
  if (!p || typeof p !== 'object' || !['id', 'label', 'url'].every(k => typeof p[k] === 'string' && p[k].trim())) fail('INVALID_PROFILE', 'Missing profile identity');
  if (!Array.isArray(p.hosts) || !p.hosts.length || p.hosts.some(h => typeof h !== 'string' || !/^[a-z0-9.-]+$/.test(h))) fail('INVALID_HOSTS', 'Invalid hosts');
  let url; try { url = new URL(p.url); } catch { fail('INVALID_URL', 'Invalid provider URL'); }
  if (url.protocol !== 'https:' || !p.hosts.includes(url.hostname) || url.username || url.password || url.port) fail('INVALID_URL', 'Provider URL must match its HTTPS host');
  if (p.threadPattern !== null && (!(p.threadPattern instanceof RegExp) || !p.threadPattern.source.includes('?<id>'))) fail('INVALID_THREAD_PATTERN', 'Expected a named thread id or null');
  if (!['enter', 'button'].includes(p.send?.strategy)) fail('INVALID_SEND_STRATEGY', 'Unsupported send strategy');
  for (const selectors of [p.composer?.selectors, p.send?.buttonSelectors, p.assistant?.containerSelectors, p.assistant?.streamingSelectors, p.preflight?.authWallSelectors]) {
    if (!Array.isArray(selectors) || !selectors.length || selectors.some(s => typeof s !== 'string' || !s.trim())) fail('INVALID_SELECTORS', 'Selectors must be nonempty string arrays');
  }
  if (p.user !== undefined && (!Array.isArray(p.user?.selectors) || !p.user.selectors.length || p.user.selectors.some(s => typeof s !== 'string' || !s.trim()))) fail('INVALID_SELECTORS', 'user.selectors must be a nonempty string array');
  if (p.assistant?.excludeSelectors !== undefined && (!Array.isArray(p.assistant.excludeSelectors) || p.assistant.excludeSelectors.some(x => typeof x !== 'string' || !x.trim()))) fail('INVALID_SELECTORS', 'assistant.excludeSelectors must be a string array');
  if (p.user?.lineSelector !== undefined && (typeof p.user.lineSelector !== 'string' || !p.user.lineSelector.trim())) fail('INVALID_SELECTORS', 'user.lineSelector must be a nonempty string');
  if (p.models !== undefined) {
    const m = p.models;
    if (!m || typeof m.triggerSelector !== 'string' || !m.triggerSelector.trim()) fail('INVALID_MODELS', 'models.triggerSelector must be a nonempty string');
    for (const list of [m.ignore, m.tiers?.strong, m.tiers?.fast]) if (list !== undefined && (!Array.isArray(list) || list.some(x => { try { new RegExp(x); return typeof x !== 'string'; } catch { return true; } }))) fail('INVALID_MODELS', 'models regex lists must be valid regex strings');
    if (m.submenuText !== undefined && (typeof m.submenuText !== 'string' || !m.submenuText.trim())) fail('INVALID_MODELS', 'models.submenuText must be a nonempty string');
  }
  if (p.send?.foreground !== undefined && typeof p.send.foreground !== 'boolean') fail('INVALID_SEND_STRATEGY', 'send.foreground must be a boolean');
  if (!['measured', 'seeded-unverified'].includes(p.status)) fail('INVALID_STATUS', 'Invalid status');
  // `strengths` is optional. A profile that omits it is defaulted to an empty list instead of
  // throwing, so one incomplete provider (e.g. a seeded, unmeasured profile that declares no
  // strengths) cannot kill the whole registry at import time. An explicitly invalid value
  // (wrong type, blank entries) is still a hard error.
  if (p.strengths === undefined) { if (Object.isExtensible(p)) p.strengths = []; }
  else if (!Array.isArray(p.strengths) || p.strengths.some(s => typeof s !== 'string' || !s.trim())) fail('INVALID_STRENGTHS', 'strengths must be an array of nonempty strings');
  return p;
}
providers.forEach(validateProfile);
export const listProviders = () => [...providers];
export const getProvider = id => providers.find(p => p.id === id) ?? null;
export function providerForUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return providers.find(p => p.hosts.includes(url.hostname)) ?? null;
  } catch { return null; }
}
