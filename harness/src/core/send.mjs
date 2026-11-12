import { digestPayload, threadKeyFor } from './journal.mjs';
export { digestPayload, threadKeyFor } from './journal.mjs';

// Expressions return only the DOM data needed for preflight and attribution.
export function snapshotExpression(provider) {
  return `(() => { /* harness:snapshot */
    const p = ${JSON.stringify(provider)};
    const first = xs => (xs || []).map(s => document.querySelector(s)).find(Boolean);
    const composer = first(p.composer?.selectors);
    /* Rich editors (ProseMirror) report an empty composer as a lone newline: compare trimmed text. */
    const text = e => e ? (('value' in e ? e.value : e.innerText) || '').trim() : '';
    /* Some providers render one user turn as several line elements: join them, then normalize whitespace. */
    const norm = t => t.replace(/\\s+/g, ' ').trim();
    const turnText = e => p.user?.lineSelector ? Array.from(e.querySelectorAll(p.user.lineSelector)).map(l => (l.innerText || '').trim()).join('\\n') : text(e);
    const users = Array.from(document.querySelectorAll((p.user?.selectors || []).join(',') || '[data-message-author-role="user"], [data-testid="user-message"], [data-role="user"]')).map(e => norm(turnText(e)));
    const assistants = Array.from(document.querySelectorAll((p.assistant?.containerSelectors || []).join(',') || '[data-message-author-role="assistant"]'));
    return { authWall: !!first(p.preflight?.authWallSelectors), composer: !!composer, composerText:text(composer), userTurns:users, assistantTurns:assistants.length, buttonSelector:(p.send?.buttonSelectors || []).find(s => document.querySelector(s)) || null };
  })()`;
}
export function focusExpression(provider) {
  return `(() => { /* harness:focus */
    const p = ${JSON.stringify(provider)};
    for (const s of (p.composer?.selectors || [])) { const e = document.querySelector(s); if (e) { e.focus(); return document.activeElement === e || e.contains(document.activeElement); } }
    return false;
  })()`;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function threadId(profile, url) {
  const u = new URL(url); if (!profile.hosts.includes(u.hostname)) return null;
  if (!profile.threadPattern) return null;
  const regex = profile.threadPattern instanceof RegExp ? new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g,'')) : new RegExp(profile.threadPattern);
  return regex.exec(u.pathname)?.groups?.id ?? null;
}
export async function sendOnce({ page, provider, journal, requestId, threadUrl, prompt, approval, observeTimeoutMs = 1000, pollIntervalMs = 100, readyTimeoutMs = 0, threadUrlTimeoutMs = 0 }) {
  const payloadDigest = digestPayload(prompt);
  const normalizedThread = threadUrl === 'new' || threadUrl == null ? null : threadUrl;
  const created = await journal.create({ requestId, provider:provider.id, threadKey:threadKeyFor(provider, normalizedThread), payloadDigest });
  const result = rec => ({ state:rec.state, submitted:rec.submitted, ...(rec.reason ? { reason:rec.reason } : {}), requestId, threadUrl:normalizedThread });
  if (!created.created) return result(created.existing || {state:'uncertain', submitted:'unknown'});
  const block = async reason => result(await journal.update(requestId, { state:'blocked', submitted:'no', reason }));
  if (!approval || approval.requestId !== requestId || approval.payloadDigest !== payloadDigest || approval.provider !== provider.id || approval.threadUrl !== normalizedThread || !Number.isFinite(approval.expiresAt) || approval.expiresAt <= Date.now() || !approval.approvedAt) return block('APPROVAL_INVALID');
  let snap;
  try {
    // Read-only readiness wait: a fresh tab may still be on about:blank, and SPAs often render the
    // composer after load. Nothing is typed meanwhile; binding is checked on the final URL.
    const readyBy = Date.now() + Math.max(0, readyTimeoutMs);
    const onHost = u => { try { return provider.hosts.includes(new URL(u).hostname); } catch { return false; } };
    const readUrl = () => Promise.resolve().then(() => page.url()).catch(() => 'about:blank');
    let url = await readUrl();
    while (!onHost(url) && Date.now() < readyBy) { await sleep(Math.min(250, readyBy - Date.now())); url = await readUrl(); }
    const current = new URL(url);
    if (!provider.hosts.includes(current.hostname)) return block('BINDING_MISMATCH');
    if (normalizedThread) { const expected = threadId(provider, normalizedThread); if (!expected || threadId(provider, url) !== expected || new URL(normalizedThread).hostname !== current.hostname) return block('BINDING_MISMATCH'); }
    snap = await page.evaluate(snapshotExpression(provider));
    while ((!snap.composer || snap.authWall) && Date.now() < readyBy) { await sleep(Math.min(250, readyBy - Date.now())); snap = await page.evaluate(snapshotExpression(provider)); }
    if (snap.authWall) return block('AUTH_WALL');
    if (!snap.composer) return block('COMPOSER_MISSING');
    if (snap.composerText !== '') return block('DRAFT_PRESENT');
    if (!Array.isArray(snap.userTurns) || !Number.isInteger(snap.assistantTurns)) return block('BASELINE_UNAVAILABLE');
    // Some sites (Qwen) silently drop a send from a hidden background tab: bring the harness's own
    // tab to the front first, and refuse to type if it is still hidden.
    if (provider.send.foreground) {
      if (typeof page.bringToFront !== 'function') return block('FOREGROUND_UNSUPPORTED');
      await page.bringToFront();
      let visible = false;
      for (let i = 0; i < 20 && !visible; i++) { visible = await page.evaluate('document.visibilityState') === 'visible'; if (!visible) await sleep(100); }
      if (!visible) return block('FOREGROUND_FAILED');
    }
    await journal.update(requestId, { state:'typing', boundary:{ userTurns:snap.userTurns.length, assistantTurns:snap.assistantTurns } });
    // Input.insertText goes to the focused element: focus the composer first (never clears or edits it).
    const focused = await page.evaluate(focusExpression(provider));
    if (focused !== true) return block('COMPOSER_NOT_FOCUSABLE');
    await page.insertText(prompt);
    const typed = await page.evaluate(snapshotExpression(provider));
    // Rich editors (ProseMirror) render blank lines as extra empty paragraphs in innerText: the typed
    // text must match exactly up to whitespace runs (every non-whitespace character still has to match).
    // ChatGPT also inserts a space before auto-linked URLs.
    // One-directional: the composer may ADD a space before http(s)://; a space missing from it never matches.
    const ws = t => t.replace(/\s+/g, ' ').trim();
    const sameAllowingUrlSpace = (p, c) => { let i = 0, j = 0; while (i < p.length || j < c.length) { if (p[i] === c[j]) { i++; j++; } else if (c[j] === ' ' && /^https?:\/\//.test(c.slice(j + 1, j + 9))) j++; else return false; } return true; };
    if (typed.composerText !== prompt.trim() && !sameAllowingUrlSpace(ws(prompt), ws(typed.composerText))) return block('TYPING_MISMATCH');
    // Many composers only render the send button once text is present: pick it after typing.
    snap.buttonSelector = typed.buttonSelector || snap.buttonSelector;
  } catch (e) { return result(await journal.update(requestId, { state:'failed', submitted:'no', reason:'PREFLIGHT_OR_TYPING_ERROR' })); }
  await journal.update(requestId, { state:'dispatching', submitted:'unknown' });
  try {
    if (provider.send.strategy === 'enter') await page.pressEnter();
    else if (provider.send.strategy === 'button' && snap.buttonSelector) await page.click(snap.buttonSelector);
    else throw new Error('Unsupported send strategy');
  } catch { /* dispatch can have succeeded despite an error */ }
  const normPrompt = prompt.replace(/\s+/g, ' ').trim();
  // Chat UIs render the user's own markdown (backticks, emphasis, list markers, smart quotes vanish or
  // change in innerText). Attribution still needs a NEW user turn whose letters and digits, in order,
  // equal the prompt's: punctuation-only differences are rendering, anything else stays uncertain.
  const unmark = t => t.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');
  // Long prompts: chat UIs collapse the user bubble ("… Show more"), so only a prefix is readable. A NEW
  // turn in our own tab is attributable only if it is visibly truncated (ends with a Show more control) and
  // ALL of its visible letters/digits (>= 1500) equal the start of the prompt's; nothing visible may differ.
  const PREFIX = 1500; const core = unmark(normPrompt);
  const truncated = t => { const m = String(t).match(/^([\s\S]*?)\s*…?\s*Show more\s*$/i); return m ? unmark(m[1]) : null; };
  const isOurs = t => { if (t === normPrompt || unmark(t) === core) return true; const v = truncated(t); return v !== null && v.length >= PREFIX && v.length < core.length && core.startsWith(v); };
  const readUrlSafe = () => Promise.resolve().then(() => page.url()).catch(() => null);
  /* New threads get their id URL only after submit: wait (bounded, read-only) for a thread URL before recording it. */
  const waitThreadUrl = async () => {
    const until = Date.now() + Math.max(0, threadUrlTimeoutMs);
    let url = await readUrlSafe();
    while (provider.threadPattern && !(url && safeThreadId(url)) && Date.now() < until) { await sleep(Math.min(pollIntervalMs, Math.max(0, until - Date.now()))); url = await readUrlSafe(); }
    return url;
  };
  const safeThreadId = url => { try { return threadId(provider, url); } catch { return null; } };
  const deadline = Date.now() + Math.max(0, observeTimeoutMs);
  do {
    try { const current = await page.evaluate(snapshotExpression(provider)); if (Array.isArray(current.userTurns) && current.userTurns.length > snap.userTurns.length && current.userTurns.slice(snap.userTurns.length).some(isOurs)) { const boundUrl = await waitThreadUrl(); const rec = await journal.update(requestId, { state:'observed', submitted:'yes', reason:null, threadUrl:boundUrl }); return { ...result(rec), threadUrl: boundUrl ?? normalizedThread }; } } catch { /* read-only observation may fail */ }
    if (Date.now() >= deadline) break;
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
  } while (true);
  return result(await journal.update(requestId, { state:'uncertain', submitted:'unknown', reason:'NO_ATTRIBUTABLE_EVIDENCE' }));
}
