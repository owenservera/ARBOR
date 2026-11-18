// VIVIM Universal Text Control — language adapter (UTC02).
// Browser-safe and dependency-free apart from the vendored Omega NCLL engine, so the paired
// phone (keystroke feedback) and the Host (authoritative parse) run identical bytes.
//
//   action catalog ──buildControlWorld──► WorldModel (ops + catalog-derived frames + taught words)
//   text ──interpret (Omega, pure)──► Interpretation ──resolve──► typed candidate {actionId,args}
//
// This module decides MEANING only. It never grants authority, never executes, and never
// treats an NCLL `ok` as readiness: every arg is re-validated against the catalog, scope words
// must disambiguate shared verbs, and the `!` force modifier is reported as ignored.
import { interpret, NCLL_VERSION } from './nlcl/index.mjs';

export const LANGUAGE_SCHEMA = 'vivim.control-language/1';
export const MIN_CONFIDENCE = 0.6;

// Navigating an already-mounted UI is not a Host effect. These exact,
// deterministic phrases do not approve, schedule, send or mutate anything.
const LOCAL_NAVIGATION = Object.freeze({
  'open today': 'today', 'go to today': 'today',
  'open wiki': 'wiki', 'open the wiki': 'wiki', 'go to wiki': 'wiki', 'show wiki': 'wiki',
  'open world': 'world', 'go to world': 'world', 'show media library': 'world',
  'open media library': 'world', 'open my media library': 'world',
  'open build': 'build', 'go to build': 'build',
  'open talk': 'talk', 'go to talk': 'talk', 'open chat': 'talk', 'go to chat': 'talk',
  'open control': 'control', 'go to control': 'control',
  'open me': 'me', 'open my profile': 'me',
  'open pocket': 'pocket', 'capture a note': 'pocket'
});
export function resolveLocalDestination(input) {
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  return Object.hasOwn(LOCAL_NAVIGATION, normalized) ? LOCAL_NAVIGATION[normalized] : null;
}
// An inert precedence rule over existing compiler results, not another interpreter.
export function resolveProductRoute(text,{hostMeaning,compileUi=null,hostRequired=true}={}) {
  const tab=resolveLocalDestination(text);
  if(tab)return {kind:'navigate',tab};
  if(hostMeaning==null&&hostRequired)return {kind:'unavailable'};
  if(hostMeaning!=null){
    if(['candidate','done','approval_required','incomplete','clarification_required'].includes(hostMeaning.outcome))
      return {kind:'host',meaning:hostMeaning};
    if(hostMeaning.outcome==='refused')return {kind:'refused',meaning:hostMeaning};
    if(hostMeaning.outcome!=='interpretation_required')return {kind:'unavailable'};
  }
  if(typeof compileUi==='function'){
    let reading;
    try{reading=compileUi(text);}catch{return {kind:'unavailable'};}
    if(reading?.domain==='ui'){
      if(['candidate','clarification_required'].includes(reading.outcome))return {kind:'ui',reading};
      if(reading.outcome==='refused'||(reading.outcome==='unsupported'&&
        ['COMPLEX_REQUEST','UNSUPPORTED_UI_GRAMMAR','MOVE_NESTED_NOT_SUPPORTED','UI_COMPONENT_ADAPTER_NOT_INSTALLED'].includes(reading.code)))
        return {kind:'refused',reading};
      if(reading.outcome!=='unsupported')return {kind:'unavailable'};
    }
  }
  return {kind:'provider'}; // choice only, never an effect
}
export function resolveDesktopDestination(text){
  const tab=resolveLocalDestination(text);
  if(!tab)return null;
  const routes={wiki:'/wiki',talk:'/chat',control:'/host/control',today:'/'};
  return {tab,href:routes[tab]??null};
}

const OMEGA_RISK = { R0: 'READ', R1: 'MUTATION', R2: 'MUTATION', R3: 'EXTERNAL_MUTATION' };

const fold = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = s => new Set(fold(s).split(/[^a-z0-9]+/).filter(Boolean));
const hasAny = (set, list) => Array.isArray(list) && list.some(w => set.has(fold(w)));

function frameFor(action) {
  const L = action.language;
  const slots = Object.entries(action.args).map(([key, type]) => {
    const hint = L.slots?.[key] ?? {};
    return {
      role: key, payloadKey: key, required: true, patient: hint.patient ?? true,
      kind: type.type === 'enum' ? 'enum' : (hint.kind ?? 'rest'),
      ...(type.type === 'enum' ? { enumValues: [...type.values] } : {}),
      ...(hint.preps ? { preps: [...hint.preps] } : {}),
    };
  });
  return { op: action.id, verbs: [...L.verbs], title: action.title, family: L.family ?? '/',
    slots, reading: L.reading ?? action.title, examples: [...action.examples] };
}

/** Deterministic WorldModel from the catalog. Only actions with a `language` block are
 *  routable ops: anything else (teach/forget) is reached through dedicated recognizers. */
export function buildControlWorld(catalog, { lexicon = [], version = 1, only = null } = {}) {
  const spoken = catalog.actions.filter(a => a.language && (!only || only.includes(a.id)));
  const ids = new Set(spoken.map(a => a.id));
  return {
    v: version, t: 0,
    kernel: { composition: 'vivim-host-control', nlclVersion: NCLL_VERSION, plugins: [] },
    ops: spoken.map(a => ({ op: a.id, risk: OMEGA_RISK[a.risk] ?? 'ENGINE', provider: a.owner, title: a.title })),
    frames: spoken.map(frameFor),
    entities: [],
    lexicon: lexicon.filter(e => ids.has(e.actionId))
      .map(e => ({ word: fold(e.word), op: e.actionId, source: 'owner', createdAt: 0 })),
    rules: [],
    context: { latestMessageId: null, latestEntityId: null },
  };
}

function feedbackOf(interp) {
  return {
    status: interp.status, confidence: interp.confidence ?? 0,
    canonical: interp.canonical ?? null, reading: interp.reading ?? null,
    nlclVersion: interp.nlclVersion, worldV: interp.worldV,
    tokens: (interp.tokens ?? []).map(t => ({ text: t.text, start: t.start, end: t.end, kind: t.kind,
      ...(t.family ? { family: t.family } : {}), ...(t.role ? { role: t.role } : {}) })),
    suggestions: (interp.suggestions ?? []).slice(0, 8).map(s => ({ kind: s.kind, text: s.text, display: s.display, ...(s.detail ? { detail: s.detail } : {}) })),
    gaps: (interp.gaps ?? []).map(g => ({ kind: g.kind, text: g.text, ...(g.hint ? { hint: g.hint } : {}) })),
  };
}

function validArg(type, value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v !== value) return false;
  if (type.type === 'enum') return type.values.includes(v);
  return v.length >= type.min && v.length <= type.max;
}

// Exact owner wording for free-text slots: the raw input span the slot consumed, not the
// stopword-folded payload ("never mention my X" keeps "my"). `match` extracts typed ids.
function rawSpan(text, interp, key, action) {
  const notes = interp.tokens ?? [];
  const idx = interp.ir?.slots?.[key]?.tokens;
  if (Array.isArray(idx) && idx.length) {
    const used = notes.filter(t => idx.includes(t.i));
    if (used.length) return text.slice(Math.min(...used.map(t => t.start)), Math.max(...used.map(t => t.end)));
  }
  // Rest slots carry no attribution: take everything after the matched verb, but only if it
  // still contains every word the engine put in the slot (otherwise trust the engine).
  const verbs = new Set([...(action.language?.verbs ?? []), ...(interp.ir?.provenance?.verbs ?? [])].map(fold));
  const at = notes.findIndex(t => verbs.has(fold(t.text)));
  if (at < 0 || !notes[at + 1]) return null;
  const raw = text.slice(notes[at + 1].start);
  const value = interp.ir?.payload?.[key];
  const have = words(raw);
  return typeof value === 'string' && [...words(value)].every(w => have.has(w)) ? raw : null;
}

// Text slots with an explicit preposition are literal owner content. NLCL's
// token projection is folded for interpretation, so slice the ORIGINAL sentence.
function literalAfterPrep(text, preps) {
  const folded = text.toLowerCase();
  for (let i = 0; i < text.length; i++) {
    if (i > 0 && !/\s/.test(text[i - 1])) continue;
    for (const prep of preps) {
      if (folded.startsWith(prep.toLowerCase(), i) &&
          /\s/.test(text[i + prep.length] ?? '')) {
        const rest = text.slice(i + prep.length).trimStart();
        if (rest) return rest;
      }
    }
  }
  return null;
}

function argsFrom(action, interp, text) {
  const args = {}, missing = [], payload = interp.ir?.payload;
  for (const [key, type] of Object.entries(action.args)) {
    const hint = action.language?.slots?.[key] ?? {};
    let v = payload?.[key];
    if (hint.match) { const m = String(text).match(new RegExp('(?:^|\\s)(' + hint.match + ')(?=$|\\s|[.!?])', 'i')); v = m ? m[1] : null; }
    else if (hint.kind === 'rest' || hint.kind === 'text') {
      v = hint.kind === 'text' && Array.isArray(hint.preps) && hint.preps.length
        ? literalAfterPrep(text, hint.preps) // absent separator => incomplete, never guess
        : rawSpan(text, interp, key, action) ?? v;
    }
    if (typeof v === 'string') {
      v = v.trim();
      if (hint.kind === 'text') {
        // Remove only a matched wrapping quote pair; content punctuation/case
        // are literal. Never strip the final period or fold owner-authored text.
        if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') ||
            (v[0] === "'" && v.at(-1) === "'"))) v = v.slice(1, -1);
      } else v = v.replace(/^['"]|['"]$/g, '').replace(/[.!?]+$/, '').trim();
    }
    if (validArg(type, v)) args[key] = v;
    else missing.push({ arg: key, ...(type.type === 'enum' ? { choices: [...type.values] } : { min: type.min, max: type.max }) });
  }
  return { args, missing };
}

/** Is this action even a plausible reading of the input? `objects` are topic nouns. */
function plausible(action, input, taught) {
  const L = action.language;
  if (!L?.objects || taught.has(action.id)) return true;
  return hasAny(input, L.objects) || hasAny(input, L.scope);
}

/**
 * Text → typed candidate (or an explicit non-executable outcome).
 * outcomes: empty | candidate | incomplete | clarification_required | interpretation_required
 */

// Pre-NLCL safety grammar. NLCL may drop negators or punctuation during frame scoring.
// These checks must run before device fast paths, help/teach recognizers and slot extraction.
// Quoted literal text is data, not an imperative clause.
function safeSyntaxFeedback(world) {
  return { status: 'refused', confidence: 0, canonical: null, reading: null,
    nlclVersion: NCLL_VERSION, worldV: world?.v,
    tokens: [], suggestions: [], gaps: [] };
}
export function guardControlSyntax(text, { catalog, world }) {
  const raw = String(text ?? '');
  const unquoted = raw.replace(/"(?:\\.|[^"\\])*"|“[^”]*”|«[^»]*»/g,
    match => ' '.repeat(match.length));
  const normalized = fold(unquoted).replace(/\u2019/g, "'").trim();
  const make = (outcome, code, message) => ({
    schema: LANGUAGE_SCHEMA, input: raw, outcome,
    ...(outcome === 'refused' ? { refusal: { code, message } } :
      { question: message, choices: [] }),
    feedback: safeSyntaxFeedback(world),
  });
  // "Never mention X" is a positive, explicit hard-exclusion action in this catalog.
  // No other "never ..." construction inherits this exception.
  const positiveExclusion = /^(?:please\s+)?never\s+mention\b/.test(normalized);
  const negationScan = positiveExclusion
    ? normalized.replace(/^(?:please\s+)?never\b/, '')
    : normalized;
  if (/\b(?:never|not|no|nunca|jamas|cannot|cant|dont|wont|shouldnt|mustnt|isnt|arent|wasnt|werent|sin|tampoco|avoid|avoiding|skip|skipping|without|refrain|nothing|unchanged|evita|evitar|evitando)\b|(?:\b(?:do|does|did|should|must|will|can)\s+not\b)|(?:\b(?:don't|doesn't|didn't|can't|won't|shouldn't|mustn't)\b)/.test(
    negationScan.replace(/[’']/g, ''))) {
    return make('refused', 'NEGATED_ACTION',
      'Negative instructions cannot be converted to a positive command.');
  }

  // V0.1 is deliberately fail-closed: any unquoted connective or clause/list
  // separator is ambiguous unless a narrow, fully validated grammar owns it.
  // Recognizing only known second verbs allowed unknown commands to disappear.
  const deviceGrant = exactDeviceIntent(raw, { catalog, world })?.candidate?.actionId === 'devices.approve';
  const separators = /\b(?:and\s+then|and|then|also|plus|or|y\s+luego|y|luego|ademas|despues|o)\b|[;,&|]|\n+|[.!?:](?=\s+\S)|\s+[—–/+]\s+/g;
  for (const match of normalized.matchAll(separators)) {
    if (match[0] === ',' && deviceGrant) continue; // a validated scopes CSV is one argument
    return make('clarification_required', 'COMPOUND_OR_LIST',
      'Please give one command at a time, or quote literal lists.');
  }
  return null;
}

function exactDeviceIntent(text, {catalog,world}) {
  // A deliberately narrow deterministic grammar: no AI routing, no privilege
  // shortcuts, no guessing device identity or requested permissions.
  const value=String(text??'').trim();
  const revoke=/^(?:revoke|disconnect)\s+(?:paired\s+)?phone(?:\s+grant)?\s+([a-f0-9]{32})\.?$/i.exec(value);
  const approve=/^approve\s+(?:paired\s+)?phone\s+grant\s+([a-f0-9]{32})\s+(?:with\s+)?scopes?\s+([a-z0-9:.,\s-]+)$/i.exec(value);
  let id,args;
  if(revoke) {
    id='devices.revoke';args={grant_id:revoke[1].toLowerCase()};
  } else if(approve) {
    const scopes=approve[2].split(',').map(s=>s.trim()).filter(Boolean);
    if(!scopes.length||scopes.some(s=>!(/^[a-z][a-z0-9:.-]{0,63}$/.test(s)))||
       new Set(scopes).size!==scopes.length)return null;
    id='devices.approve';args={grant_id:approve[1].toLowerCase(),scopes:scopes.join(',')};
  } else return null;
  if(!catalog.actions.some(a=>a.id===id))return null;
  return {schema:LANGUAGE_SCHEMA,input:String(text??''),
    outcome:'candidate',candidate:{actionId:id,args},
    feedback:{status:'ok',confidence:1,canonical:id,reading:id,
      nlclVersion:NCLL_VERSION,worldV:world?.v,tokens:[],suggestions:[],gaps:[]}};
}

export function interpretControl(text, { catalog, world }) {
  const raw=String(text??'').trim();
  // Explicit read-program envelope only; ordinary compound/negated commands remain refused.
  const envelope=/^run wiki read sequence:\s*\n([\s\S]+)$/i.exec(raw);
  if(envelope&&catalog.actions.some(a=>a.id==='program.read_wiki')){
    const commands=envelope[1].trim();
    if(commands.length<=950&&commands.split(/\r?\n/).length>=2)
      return {schema:LANGUAGE_SCHEMA,input:raw,outcome:'candidate',candidate:{actionId:'program.read_wiki',args:{commands}},
        feedback:{status:'ok',confidence:1,canonical:'program.read_wiki',reading:'Read-only Wiki sequence; child meanings checked by Host',nlclVersion:NCLL_VERSION,worldV:world?.v,tokens:[],suggestions:[],gaps:[]}};
  }
  const unsafe = guardControlSyntax(text, { catalog, world });
  if (unsafe) return unsafe;
  const exact=exactDeviceIntent(text,{catalog,world});
  if(exact)return exact;
  const interp = interpret(String(text ?? ''), world);
  const base = { schema: LANGUAGE_SCHEMA, input: String(text ?? ''), feedback: feedbackOf(interp) };
  const ir = interp.ir;
  if (ir?.modifiers?.force) base.ignoredModifiers = ['!'];
  if (interp.status === 'empty') return { ...base, outcome: 'empty' };
  if (!ir || interp.status === 'unknown' || interp.status === 'invalid') return { ...base, outcome: 'interpretation_required' };
  const byId = new Map(catalog.actions.map(a => [a.id, a]));

  if (ir.intent === 'surface.help') return { ...base, outcome: 'candidate', candidate: { actionId: 'control.catalog.list', args: {} } };
  if (ir.intent === 'director.teach@1') {
    const { word, op, action } = ir.payload ?? {};
    if (action === 'remove' && word) return { ...base, outcome: 'candidate', candidate: { actionId: 'control.lexicon.forget', args: { word } } };
    if (action === 'add' && word && op && byId.get(op)?.language) {
      return { ...base, outcome: 'candidate', candidate: { actionId: 'control.lexicon.teach', args: { word, action: op } } };
    }
    return { ...base, outcome: 'incomplete', missing: [{ arg: 'actionId' }],
      question: 'Teach it to mean which command? Try: teach blitz means undo' };
  }
  // Composite commands ("x and stop y") are not split yet: one typed action per approval.
  // A clause boundary followed by another catalog verb is a second command, not slot text.
  const verbs = new Set(catalog.actions.flatMap(a => a.language?.verbs ?? []).map(fold));
  const clauses = fold(text).split(/\s*(?:\band then\b|\bthen\b|\band\b|&|;)\s*/).filter(Boolean);
  if ((interp.tokens ?? []).some(t => t.family === '&') ||
      clauses.slice(1).some(c => verbs.has(c.split(/[^a-z0-9]+/).filter(Boolean)[0]))) {
    return { ...base, outcome: 'clarification_required', question: 'Please give one command at a time.', choices: [] };
  }
  const primary = byId.get(ir.intent);
  if (!primary?.language) return { ...base, outcome: 'interpretation_required' };

  // ---- scope resolution: verbs like "stop" / "show" are shared across actions ----
  const input = words(text);
  const verb = fold(ir.provenance?.verbs?.[0] ?? '');
  const pool = new Map([[primary.id, primary]]);
  for (const alt of interp.alternatives ?? []) if (byId.get(alt.intent)?.language) pool.set(alt.intent, byId.get(alt.intent));
  for (const a of catalog.actions) if (a.language?.verbs?.map(fold).includes(verb)) pool.set(a.id, a);
  // A taught word names its action: it counts as both topic and scope for that action only.
  const taught = new Set((world.lexicon ?? []).filter(e => input.has(fold(e.word))).map(e => e.op));
  const candidates = [...pool.values()].filter(a => plausible(a, input, taught));
  if (!candidates.length) return { ...base, outcome: 'interpretation_required' };
  const explicit = candidates.filter(a => a.language.scope && (hasAny(input, a.language.scope) || taught.has(a.id)));
  let chosen = null;
  if (explicit.length === 1) chosen = explicit[0];
  else if (explicit.length > 1) {
    return { ...base, outcome: 'clarification_required', question: 'Which one do you mean?', choices: explicit.map(a => a.id) };
  } else {
    const unscoped = candidates.filter(a => !a.language.scope);
    if (unscoped.length === 1) chosen = unscoped[0];
    else if (unscoped.length > 1) {
      if (unscoped.some(a => a.id === primary.id) && interp.status !== 'ambiguous') chosen = primary;
      else return { ...base, outcome: 'clarification_required', question: 'Which one do you mean?', choices: unscoped.map(a => a.id) };
    } else {
      const group = candidates.find(a => a.language.group)?.language.group;
      const members = group ? catalog.actions.filter(a => a.language?.group === group) : candidates;
      const question = (group && catalog.languageGroups?.[group]?.question) ?? candidates[0].language.scopeQuestion ?? 'Which one do you mean?';
      return { ...base, outcome: 'clarification_required', question, choices: members.map(a => a.id) };
    }
  }

  // Re-read deterministically against the chosen action alone when scope changed the reading.
  let reading = interp;
  if (chosen.id !== primary.id) {
    reading = interpret(String(text), buildControlWorld(catalog, { lexicon: [], version: world.v, only: [chosen.id] }));
    if (!reading.ir || reading.ir.intent !== chosen.id) {
      return { ...base, outcome: Object.keys(chosen.args).length ? 'incomplete' : 'candidate',
        candidate: { actionId: chosen.id, args: {} }, missing: Object.keys(chosen.args).map(arg => ({ arg })) };
    }
  }
  const { args, missing } = argsFrom(chosen, reading, String(text));
  if (missing.length) {
    const first = missing[0];
    return { ...base, outcome: 'incomplete', candidate: { actionId: chosen.id, args }, missing,
      question: first.choices ? `Which ${first.arg}? One of: ${first.choices.join(', ')}` : `Please give the ${first.arg}.` };
  }
  if ((reading.confidence ?? 0) < MIN_CONFIDENCE) return { ...base, outcome: 'interpretation_required', candidate: { actionId: chosen.id, args } };
  return { ...base, outcome: 'candidate', candidate: { actionId: chosen.id, args } };
}
