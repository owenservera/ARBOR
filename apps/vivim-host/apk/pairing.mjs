// APK07 PC<->phone pairing store.
// The PC mints a short-lived, single-use token (rendered as a QR code). The phone
// scans it, then calls activate() exactly once to exchange the token for a deviceId.
// Tokens are never reusable, never persisted in plaintext logs, and expire after
// 10 minutes. Paired-device state lives beside the tokens in <dataRoot>/pairing/.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PAIRING_DIR_NAME = 'pairing';
const STATE_FILE = 'pairing.json';
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_TOKENS = 32; // bounded memory: prune oldest beyond this

const emptyState = () => ({ tokens: {}, pairing: { paired: false, deviceId: null, pairedAt: null, deviceInfo: null } });

export function createPairingStore({ dataRoot }) {
  if (!dataRoot) throw Object.assign(new Error('DATA_ROOT_REQUIRED'), { status: 400 });
  const dir = path.join(dataRoot, PAIRING_DIR_NAME);
  const statePath = path.join(dir, STATE_FILE);

  const now = () => Date.now();

  const ensureDir = () => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); };

  const loadState = () => {
    try {
      const parsed = JSON.parse(readFileSync(statePath, 'utf8'));
      const state = emptyState();
      if (parsed && typeof parsed === 'object') {
        if (parsed.tokens && typeof parsed.tokens === 'object') state.tokens = parsed.tokens;
        if (parsed.pairing && typeof parsed.pairing === 'object') {
          state.pairing = { ...state.pairing, ...parsed.pairing };
          state.pairing.paired = Boolean(state.pairing.paired);
        }
      }
      return state;
    } catch { return emptyState(); }
  };

  const saveState = (state) => {
    ensureDir();
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  };

  // Drop expired tokens and cap the map size so a long-lived PC install cannot grow
  // an unbounded token history. Expired tokens are useless anyway: their TTL is the
  // only thing that ever makes them valid.
  const pruneTokens = (state) => {
    const ts = now();
    for (const [token, entry] of Object.entries(state.tokens)) {
      if (!entry || ts > (entry.expiresAt || 0)) delete state.tokens[token];
    }
    const entries = Object.entries(state.tokens).sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));
    while (entries.length > MAX_TOKENS) {
      const [oldest] = entries.shift();
      delete state.tokens[oldest];
    }
    return state;
  };

  const invalid = (message, status) => Object.assign(new Error(message), { status });

  // Mint a one-time pairing token. The PC renders this as a QR code; only the phone
  // that scans it within the TTL can redeem it, and only once.
  const createToken = () => {
    const state = pruneTokens(loadState());
    const token = randomBytes(32).toString('hex'); // 64 hex chars
    const createdAt = now();
    const expiresAt = createdAt + TOKEN_TTL_MS;
    state.tokens[token] = { createdAt, expiresAt, usedAt: null, deviceId: null };
    saveState(state);
    return { token, expiresAt, createdAt, ttlMs: TOKEN_TTL_MS };
  };

  // Redeem a token without pairing a device. Single-use: returns a grant object on
  // the first valid call and null for unknown, expired or already-used tokens.
  const consume = (token) => {
    if (typeof token !== 'string' || !token) return null;
    const state = pruneTokens(loadState());
    const entry = state.tokens[token];
    if (!entry) { saveState(state); return null; }
    if (entry.usedAt) { saveState(state); return null; }
    if (now() > (entry.expiresAt || 0)) {
      delete state.tokens[token];
      saveState(state);
      return null;
    }
    entry.usedAt = now();
    entry.deviceId = entry.deviceId || null;
    saveState(state);
    return { token, createdAt: entry.createdAt, expiresAt: entry.expiresAt, usedAt: entry.usedAt };
  };

  // Current pairing status for the Host UI.
  const getStatus = () => {
    const { pairing } = loadState();
    return {
      paired: Boolean(pairing.paired),
      deviceId: pairing.deviceId || null,
      pairedAt: pairing.pairedAt || null,
    };
  };

  // Exchange a scanned token for a persistent deviceId. Throws with .status codes so
  // the phone route can map failures to HTTP responses (404 unknown, 410 expired,
  // 409 already used / already paired).
  const activate = (token, deviceInfo = {}) => {
    if (typeof token !== 'string' || !token) throw invalid('TOKEN_REQUIRED', 400);
    const state = pruneTokens(loadState());
    const entry = state.tokens[token];
    if (!entry) throw invalid('TOKEN_UNKNOWN', 404);
    if (entry.usedAt) throw invalid('TOKEN_ALREADY_USED', 409);
    if (now() > (entry.expiresAt || 0)) {
      delete state.tokens[token];
      saveState(state);
      throw invalid('TOKEN_EXPIRED', 410);
    }
    if (state.pairing.paired && state.pairing.deviceId) {
      // A device is already paired. Re-pairing must go through an explicit
      // unpair/reset on the PC rather than silently stealing the session.
      throw invalid('ALREADY_PAIRED', 409);
    }

    const deviceId = createHash('sha256')
      .update(token + randomBytes(32).toString('hex'))
      .digest('hex')
      .slice(0, 32);

    entry.usedAt = now();
    entry.deviceId = deviceId;
    state.pairing = {
      paired: true,
      deviceId,
      pairedAt: new Date().toISOString(),
      deviceInfo: deviceInfo && typeof deviceInfo === 'object' ? { ...deviceInfo } : null,
    };
    saveState(state);

    return { deviceId, pairedAt: state.pairing.pairedAt };
  };

  // PC-only: drop the pairing. Not required by the phone flow, but needed so the
  // owner can re-pair without editing JSON on disk.
  const unpair = () => {
    const state = pruneTokens(loadState());
    state.pairing = { paired: false, deviceId: null, pairedAt: null, deviceInfo: null };
    saveState(state);
    return { paired: false };
  };

  return { createToken, consume, getStatus, activate, unpair };
}
