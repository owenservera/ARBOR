// Taught words (Omega director.teach semantics, as DATA — never generated code).
// "teach blitz means undo" → { word: "blitz", actionId: "ui.theme.undo" }. The word only
// changes how text is READ; the action it reaches keeps its own risk, approval and executor.
// Versioned with compare-and-save; every change is kept in history (forget never erases it).
import { mkdirSync, readFileSync, renameSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { runNativeProductPureSync } from './native-product-pure-sync.mjs';

export const LEXICON_SCHEMA = 'vivim.control-lexicon/1';
const WORD = /^[a-z][a-z0-9-]{1,39}$/;
const MAX_ENTRIES = 200, MAX_HISTORY = 1000;
const fail = code => Object.assign(new Error(code), { code });

export function createLexiconStore({ dataRoot, catalog, now = () => new Date().toISOString() }) {
  const file = path.join(dataRoot, 'control', 'lexicon.json');
  const spoken = new Set(catalog.actions.filter(a => a.language).map(a => a.id));
  // Builtin verbs/scope words are reserved: teaching cannot silently re-route "stop".
  const reserved = new Set(catalog.actions.flatMap(a => [...(a.language?.verbs ?? []), ...(a.language?.scope ?? []), ...(a.language?.objects ?? [])]));
  for (const w of ['teach', 'forget', 'unteach', 'help', 'means', 'and', 'then']) reserved.add(w);
  function load() {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      if (raw?.schema !== LEXICON_SCHEMA || !Number.isInteger(raw.version) || !Array.isArray(raw.entries) || !Array.isArray(raw.history)) throw fail('CONTROL_LEXICON_CORRUPT');
      return raw;
    } catch (e) { if (e.code === 'ENOENT') return { schema: LEXICON_SCHEMA, version: 0, entries: [], history: [] }; throw e; }
  }
  function save(next, expectedVersion) {
    // Exclusive lock across processes: load->validate->write must be atomic.
    // A lock file is created with linkSync (exclusive); only the holder proceeds.
    const lockFile = `${file}.lock`;
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const lockTemp = `${lockFile}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    writeFileSync(lockTemp, '', { mode: 0o600 });
    let lockHeld = false;
    try {
      linkSync(lockTemp, lockFile);
      lockHeld = true;
    } catch (e) {
      if (e.code === 'EEXIST') throw fail('CONTROL_LEXICON_BUSY');
      throw e;
    } finally {
      try { unlinkSync(lockTemp); } catch { /* already gone */ }
    }
    try {
      const current = load();
      if (current.version !== expectedVersion) throw fail('CONTROL_LEXICON_STALE');
      const temp = `${file}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
      writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
      renameSync(temp, file);
      return next;
    } finally {
      if (lockHeld) { try { unlinkSync(lockFile); } catch { /* already gone */ } }
    }
  }
  const word = w => { const v = String(w ?? '').trim().toLowerCase(); if (!WORD.test(v)) throw fail('CONTROL_WORD_INVALID'); return v; };
  // The native reducer computes the exact next version; Host retains the
  // existing locked compare-and-save, ownership and effect journal authority.
  function nativeTransition(mode,current,word,actionId,at,planId){
    const response=runNativeProductPureSync('control-lexicon-transition',{
      schema:'vivim.control-lexicon-transition-input/1',mode,current,word,
      actionId:actionId??null,at,planId,reserved:[...reserved],spoken:[...spoken]
    });
    if(!response)return null;
    if(response.outcome==='refused'){
      if(!['CONTROL_WORD_INVALID','CONTROL_WORD_RESERVED',
        'CONTROL_TEACH_TARGET_INVALID','CONTROL_LEXICON_FULL',
        'CONTROL_WORD_UNKNOWN'].includes(response.code))
        throw fail('CONTROL_LEXICON_NATIVE_INVALID');
      throw fail(response.code);
    }
    const next=response.next,result=response.result;
    if(response.outcome!=='projected'||response.authority!=='none'||
      response.executionAuthorized!==false||response.effectPerformed!==false||
      next?.schema!==LEXICON_SCHEMA||next.version!==current.version+1||
      !Array.isArray(next.entries)||next.entries.length>MAX_ENTRIES||
      !Array.isArray(next.history)||next.history.length>MAX_HISTORY||
      result?.word!==word||result?.version!==next.version)
      throw fail('CONTROL_LEXICON_NATIVE_INVALID');
    return {next,result};
  }

  return {
    schema: LEXICON_SCHEMA, file,
    entries: () => load().entries.map(e => ({ word: e.word, actionId: e.actionId })),
    version: () => load().version,
    teach({ word: w, actionId, planId = null }) {
      const v = word(w);
      if (reserved.has(v)) throw fail('CONTROL_WORD_RESERVED');
      if (!spoken.has(actionId)) throw fail('CONTROL_TEACH_TARGET_INVALID');
      const cur = load();
      const at=now();
      const native=nativeTransition('teach',cur,v,actionId,at,planId);
      if(native){save(native.next,cur.version);return native.result;}
      if (cur.entries.length >= MAX_ENTRIES && !cur.entries.some(e => e.word === v)) throw fail('CONTROL_LEXICON_FULL');
      const previous = cur.entries.find(e => e.word === v) ?? null;
      const next = { ...cur, version: cur.version + 1,
        entries: [...cur.entries.filter(e => e.word !== v), { word: v, actionId, at, planId }].sort((a, b) => a.word.localeCompare(b.word)),
        history: [...cur.history, { op: 'teach', word: v, actionId, previous: previous?.actionId ?? null, at, planId }].slice(-MAX_HISTORY) };
      save(next, cur.version);
      return { word: v, actionId, previous: previous?.actionId ?? null, version: next.version };
    },
    forget({ word: w, planId = null }) {
      const v = word(w);
      const cur = load();
      const at = now();
      const native=nativeTransition('forget',cur,v,null,at,planId);
      if(native){save(native.next,cur.version);return native.result;}
      const existing = cur.entries.find(e => e.word === v);
      if (!existing) throw fail('CONTROL_WORD_UNKNOWN');
      const next = { ...cur, version: cur.version + 1, entries: cur.entries.filter(e => e.word !== v),
        history: [...cur.history, { op: 'forget', word: v, actionId: existing.actionId, at, planId }].slice(-MAX_HISTORY) };
      save(next, cur.version);
      return { word: v, forgot: existing.actionId, version: next.version };
    },
  };
}
