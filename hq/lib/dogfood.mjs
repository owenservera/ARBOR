// @ts-check
/**
 * @hq:context The dogfood engine: it turns our own live conversations, channel evidence and the
 *   six-lane qeue register into one ranked work queue, and turns the owner's corrections into
 *   persisted, evidence-counted learnings. A row's proof is the command that actually ran.
 * @hq:owner dogfood-lead
 * @hq:task dogfood-loop
 * @hq:task WO-004
 * @hq:task WO-035
 * @hq:invariant a task without a quote or an id is not a task: every row names the conversation
 *   and the exact words that produced it.
 * @hq:invariant one writer: the rendered document is the supply signal, rewritten atomically,
 *   never appended; the machine form is written beside it.
 * @hq:invariant learning is evidence, not inference: a learning row exists only when an owner
 *   turn contains a correction marker, and it carries every turn that repeated it.
 * @hq:invariant the learnings ledger is merged, never clobbered: a row this loop did not write
 *   (the execution runner's `dfe_*` rows) survives every write of this file.
 * @hq:invariant the qeue is a hypothesis register: a status of not_verified means "unproven",
 *   never "missing"; only a recon row can lower the gap weight.
 * @hq:invariant nothing here sends, approves or wakes: read-only probes, pure transforms, one
 *   file writer.
 * @hq:invariant a proof command and a file are tool evidence or nothing: they come from a
 *   tool_use a turn actually carried (hq/lib/session-parts.mjs), never mined out of prose, and
 *   never written as a command the dispatcher would refuse.
 * @hq:invariant no secrets: every persisted quote passes redactSecrets.
 * @hq:see docs/ACTIVE-TASK-SCANNER.md
 * @hq:see hq/lib/session-parts.mjs
 * @hq:see qeue/README.md
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FILE_INPUT_FIELDS, readSessionParts, toolCalls } from './session-parts.mjs';

export const DOGFOOD_SCHEMA = 'hq.dogfood/1';
export const LEARNINGS_SCHEMA = 'hq.dogfood-learnings/1';
export const RECON_SCHEMA = 'hq.dogfood-recon/1';
export const TASK_ID_PREFIX = 'dt_';
export const LEARNING_ID_PREFIX = 'lrn_';

/** The six lanes of the qeue register, in release order. */
export const QEUE_LANES = /** @type {const} */ (['DATA', 'INTELLIGENCE', 'AGENTS', 'BUILDER', 'MACHINE', 'EXPERIENCE']);

/** A recon row may only claim one of these states. Anything else is invalid, never guessed. */
export const RECON_STATES = /** @type {const} */ (['proven', 'partial', 'blocked', 'absent']);

/** How much of the qeue gap each recon/qeue status leaves open. */
const GAP_WEIGHT = {
  not_verified: 1,
  absent: 1,
  partial: 0.6,
  blocked: 0.85,
  documented_baseline: 0.5,
  proven: 0.05,
  verified: 0.05,
};

const RELEASE_WEIGHT = { V1: 1, V2: 0.95, V3: 0.9, V4: 0.85, V5: 0.8, V6: 0.75 };

/** Words that appear in nearly every qeue title; matching them proves nothing about relevance. */
const HIT_STOPWORDS = new Set([
  'define', 'create', 'store', 'capture', 'verify', 'support', 'implement', 'build', 'add',
  'user', 'users', 'from', 'with', 'into', 'that', 'this', 'each', 'every', 'across',
  'rules', 'scopes', 'criteria', 'schema', 'identity', 'state', 'data', 'task', 'tasks',
]);

/* ------------------------------------------------------------------ */
/* text hygiene                                                        */
/* ------------------------------------------------------------------ */

const SECRET_PATTERNS = [
  /\b(sk|pk|rk|ghp|gho|ghs|xox[baprs]|AKIA)[-_A-Za-z0-9]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(api[_-]?key|token|secret|password|passwd)\s*[:=]\s*['"]?[^\s'"]{8,}/gi,
];

/**
 * Strip anything that looks like a credential before a quote is persisted. A quote is evidence,
 * and evidence never needs a secret.
 * @param {string} text
 * @returns {string}
 */
export function redactSecrets(text) {
  let out = String(text ?? '');
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[redacted]');
  return out;
}

/** @param {string} text @param {number} max */
export function clip(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, Math.max(0, max - 1))}…`;
}

/** A table cell must never break the table. */
/** @param {string} text */
export function cell(text) {
  return clip(redactSecrets(text), 200).replace(/\|/g, '¦');
}

/** @param {string} text @param {number} size */
function hash12(text, size = 12) {
  return createHash('sha256').update(String(text)).digest('hex').slice(0, size);
}

/** Stable id for a work row: same source, same words, same id across scans. */
/** @param {string} source @param {string} key @param {string} quote */
export function taskId(source, key, quote) {
  return TASK_ID_PREFIX + hash12(`${source}\u0000${key}\u0000${String(quote).toLowerCase().replace(/\s+/g, ' ').trim()}`);
}

/** Stable id for a learning row. */
/** @param {string} rule */
export function learningId(rule) {
  return LEARNING_ID_PREFIX + hash12(`rule\u0000${String(rule).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()}`);
}

/**
 * Who wrote this ledger row. This loop owns the `lrn_*` rows. Every other row in the same file
 * was written by another producer — the dogfood execution runner appends `dfe_*` rows — and is
 * evidence this loop did not write: it is carried verbatim, never re-derived and never dropped.
 * @param {any} row
 */
export function isOwnedLearning(row) {
  if (!row || typeof row !== 'object') return false;
  if (row.schema === LEARNINGS_SCHEMA) return true;
  return String(row.id ?? '').startsWith(LEARNING_ID_PREFIX);
}

/* ------------------------------------------------------------------ */
/* qeue register                                                       */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{
 *   id: string, lane: string, task: string, primary_release: string,
 *   criticality_rank: number, complexity_score: number, status: string,
 *   candidate_blocker_ids: string[], blockers: string[], rabbit_holes: string[],
 *   pitfalls: string[], top_complexity_gates: {gate: string, pass_criterion: string}[],
 *   complexity_axes?: Record<string, number>
 * }} QeueRecord
 */

/**
 * Load every lane file that exists. A missing or broken lane is a defect row, never a throw:
 * a partial register is still usable and the gap stays visible.
 * @param {string} qeueDir
 * @returns {{ records: QeueRecord[], byId: Map<string, QeueRecord>, defects: {source:string,detail:string}[], loaded: string[] }}
 */
export function loadQeue(qeueDir) {
  /** @type {QeueRecord[]} */
  const records = [];
  /** @type {{source:string,detail:string}[]} */
  const defects = [];
  const loaded = [];
  for (const lane of QEUE_LANES) {
    const file = join(qeueDir, `${lane}.json`);
    if (!existsSync(file)) {
      defects.push({ source: `qeue:${lane}`, detail: `missing ${lane}.json` });
      continue;
    }
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      const rows = Array.isArray(parsed?.records) ? parsed.records : [];
      if (!rows.length) {
        defects.push({ source: `qeue:${lane}`, detail: 'no records array' });
        continue;
      }
      for (const r of rows) {
        if (!r || typeof r.id !== 'string' || typeof r.task !== 'string') continue;
        records.push(/** @type {QeueRecord} */ (r));
      }
      loaded.push(lane);
    } catch (err) {
      defects.push({ source: `qeue:${lane}`, detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  return { records, byId: new Map(records.map((r) => [r.id, r])), defects, loaded };
}

/** @param {string} status */
export function gapWeight(status) {
  return GAP_WEIGHT[/** @type {keyof typeof GAP_WEIGHT} */ (status)] ?? 0.8;
}

/* ------------------------------------------------------------------ */
/* recon receipts (written by the 101-lane sweep)                      */
/* ------------------------------------------------------------------ */

/**
 * Validate one recon row. A row without usable evidence is rejected, not trusted: the sweep is
 * only useful if every claim is anchored to a file:line the agent actually read.
 * @param {any} row
 * @returns {{ ok: true, row: any } | { ok: false, reason: string }}
 */
export function validateRecon(row) {
  if (!row || typeof row !== 'object') return { ok: false, reason: 'not an object' };
  if (row.schema !== RECON_SCHEMA) return { ok: false, reason: `schema is ${String(row.schema)}` };
  if (typeof row.id !== 'string' || !/^[A-Z]+-\d{3}$/.test(row.id)) return { ok: false, reason: 'bad id' };
  if (!RECON_STATES.includes(row.status)) return { ok: false, reason: `bad status ${String(row.status)}` };
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) return { ok: false, reason: 'no evidence' };
  if (row.status !== 'absent' && !row.evidence.some((e) => /:\d+/.test(String(e)))) {
    return { ok: false, reason: 'no file:line evidence' };
  }
  return { ok: true, row };
}

/**
 * @param {string} reconDir
 * @returns {{ byId: Map<string, any>, defects: {source:string,detail:string}[], files: string[] }}
 */
export function loadRecon(reconDir) {
  /** @type {Map<string, any>} */
  const byId = new Map();
  /** @type {{source:string,detail:string}[]} */
  const defects = [];
  const files = [];
  if (!existsSync(reconDir)) return { byId, defects, files };
  for (const name of readdirSync(reconDir)) {
    if (!name.endsWith('.json')) continue;
    const file = join(reconDir, name);
    try {
      const verdict = validateRecon(JSON.parse(readFileSync(file, 'utf8')));
      if (verdict.ok === false) { defects.push({ source: `recon:${name}`, detail: verdict.reason }); continue; }
      byId.set(verdict.row.id, verdict.row);
      files.push(name);
    } catch (err) {
      defects.push({ source: `recon:${name}`, detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  return { byId, defects, files };
}

/* ------------------------------------------------------------------ */
/* leapfrog ranking                                                    */
/* ------------------------------------------------------------------ */

/**
 * The leapfrog score answers one question: which unproven capability, if settled now, unblocks
 * the most downstream work? It is criticality (lane-relative leverage) times how open the gap
 * still is, lifted by how often our own conversations already hit it.
 * @param {QeueRecord} record
 * @param {{ recon?: any, hits?: number }} [ctx]
 * @returns {number}
 */
export function leapfrogScore(record, ctx = {}) {
  const recon = ctx.recon;
  const status = recon?.status ?? record.status ?? 'not_verified';
  const gap = gapWeight(status);
  const release = RELEASE_WEIGHT[/** @type {keyof typeof RELEASE_WEIGHT} */ (record.primary_release)] ?? 0.7;
  const hits = Math.max(0, Number(ctx.hits) || 0);
  const lift = Math.min(1.25, 1 + 0.2 * Math.log2(1 + hits));
  return Number((Number(record.criticality_rank) * gap * release * lift).toFixed(2));
}

/**
 * Rank every qeue record. Proven rows stay visible but sink: they are evidence of work done,
 * not work to do.
 * @param {QeueRecord[]} records
 * @param {Map<string, any>} [reconById]
 * @returns {Array<QeueRecord & { score: number, basis: string, reconStatus: string|null, gap: number }>}
 */
export function rankLeapfrog(records, reconById = new Map()) {
  return records
    .map((record) => {
      const recon = reconById.get(record.id);
      const status = recon?.status ?? null;
      return {
        ...record,
        score: leapfrogScore(record, { recon }),
        basis: recon ? `recon:${recon.status}` : `qeue:${record.status}`,
        reconStatus: status,
        gap: gapWeight(status ?? record.status),
      };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/* ------------------------------------------------------------------ */
/* signal extraction                                                   */
/* ------------------------------------------------------------------ */

/** @typedef {{ role: string, text: string }} Turn */

const CORRECTION = /\b(stop|never|don'?t|do not|instead|wrong|incorrect|revert|undo|omit|not what i|i said|that'?s not)\b/i;
const PREFERENCE = /\b(always|must|only|prefer|from now on|every time|make sure)\b/i;
// A blocked row must name a dependency. "Cannot reproduce" is prose, not a block.
const BLOCKED = /\b(blocked on|waiting (?:for|on)|need (?:the )?lease|lease (?:is|held)|not running|unreadable|unavailable|no such (?:file|command)|ENOENT|wedged|dead pid)\b/i;
const DEPENDENCY = /\b(lease|browser|studio|provider|session|file|command|service|server|agent|tool|db|database|host|chrome|tab|credential|network|port)\b/i;
const FAILURE = /\b(fail(?:ed|ing|s)?|broken|crash(?:ed)?|red build|error:|ENOENT|exception)\b/i;
/** A report of zero failures is a pass. "238 pass / 0 fail" is not a broken build. */
const ZERO_FAILURE = /\b0\s+fail(?:s|ed|ure|ing)?\b|\bfail(?:s)?\s*[:=]?\s*0\b(?!\d)/i;
const INTENT = /\b(build|add|write|fix|implement|create|land|update|test|verify|patch|wire|migrate|refactor)\b/i;
const PATHISH = /(?:[A-Za-z]:)?[\w@./-]+\.(?:mjs|cjs|js|ts|tsx|jsx|json|jsonl|md|toml|ya?ml|rs|py|css|html)\b/g;

/** A turn that is harness noise, not a conversation turn. */
/** @param {Turn} turn */
export function isNoiseTurn(turn) {
  const t = String(turn?.text ?? '');
  if (t.length < 12) return true;
  if (/<system-reminder>|untrusted_objective|Continue working toward the active session goal|active session goal is paused/i.test(t)) return true;
  if (/^\[(assistant|user)\]$/.test(t.trim())) return true;
  return isInjectedContext(t);
}

/**
 * Injected context is not something the owner said. AGENTS.md bodies, agent definitions, the
 * environment block and the auto-attached session preamble all arrive as `user` turns; learning a
 * "rule" from them would manufacture consent that never happened.
 * @param {string} text
 */
export function isInjectedContext(text) {
  const t = String(text ?? '');
  if (t.length > 4000) return true;
  if (/<system-reminder>|<untrusted_objective>|Continue working toward the active session goal|active session goal is paused/i.test(t)) return true;
  if (/You have been invoked in the following environment|^#+\s*Environment\b/m.test(t)) return true;
  if (/Contents of .*AGENTS\.md|IMPORTANT: These instructions OVERRIDE/i.test(t)) return true;
  if (/The following skills are available|ZCode attached this context automatically|isn'?t part of the user'?s message/i.test(t)) return true;
  // A subagent report arrives as a `user` turn. It is the agent's own summary of its work, not
  // something the owner said, so it can neither be mined for tasks nor be learned as a rule.
  if (/<subagent-message>/i.test(t)) return true;
  if (/Today'?s date is \d{4}-\d{2}-\d{2}/.test(t)) return true;
  if (/^---\s*\nname:\s*\S+\s*\ndescription:/m.test(t)) return true;
  return false;
}

/**
 * The transcript's `user` role is not the owner: tool results, task notifications, TodoWrite
 * reminders and injected blocks all use it. An owner turn is the one place a correction can come
 * from, so it must be separated from those plumbing turns before anything is learned.
 * @param {Turn} turn
 */
export function isOwnerTurn(turn) {
  const t = String(turn?.text ?? '');
  if (String(turn?.role) !== 'user') return false;
  if (!t.trim() || isInjectedContext(t)) return false;
  if (/<task-notification>|<tool-use-id>|<output-file>|<tool_result>|tool_use_id/i.test(t)) return false;
  if (/The TodoWrite tool hasn'?t been used recently|Here are the existing contents of your todo list/i.test(t)) return false;
  if (/^\s*[{[]/.test(t)) return false;                 // serialized tool payload
  if (t.length > 2000) return false;                     // a pasted document, not a speaking turn
  return true;
}

/** @param {string} text */
function lastQuestion(text) {
  const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0 && i >= lines.length - 6; i--) {
    if (lines[i].endsWith('?')) return lines[i];
  }
  return '';
}

/** @param {string} text */
function firstPath(text) {
  const m = String(text).match(PATHISH);
  return m ? m[0].replace(/[),.;:]+$/, '') : '';
}

/* ------------------------------------------------------------------ */
/* tool evidence: the command that ran, the file that was touched      */
/* ------------------------------------------------------------------ */

/**
 * Input fields a tool call uses to name the command it ran. Only these are read: a sentence that
 * mentions a command is not proof the command ran, and the queue is made of proof.
 */
export const COMMAND_INPUT_FIELDS = Object.freeze(['command', 'cmd']);

/** Tools that change a file. A path one of these named ranks before a path that was only read. */
const MUTATING_TOOLS = new Set(['write', 'edit', 'multiedit', 'notebookedit', 'apply_patch', 'str_replace_editor']);

/**
 * A proof must be runnable, and it is the dispatcher that decides. This mirrors the rule in
 * hq/lib/work-orders.mjs:61 — one line, starting like a command — so a row is never written with
 * a command that hq/lib/autonomy.mjs `proofCommandOf` will silently refuse. A refused command
 * looks like success in the queue and dispatches nothing.
 */
const PROOF_COMMAND_RE = /^(?:bun|bunx|node|npm|npx|pnpm|yarn|deno|python[0-9.]*|py|cargo|rustc|go|dotnet|tsc|git|gh|curl|wget|pwsh|powershell|cmd|sh|bash|hq|zcode|es|du|handle|fclones|sqlite3)(?:\.(?:exe|cmd|bat))?(?=\s|$)/i;

/** A longer command is a script, not a proof line. Refused, never clipped into something unrunnable. */
export const MAX_PROOF_COMMAND = 300;

/**
 * Is this one dispatchable command line? `ls -la` proves nothing and `<test>` is a placeholder;
 * both are refused rather than persisted as though they were evidence.
 * @param {string} text
 */
export function isProofCommand(text) {
  const candidate = String(text ?? '').trim();
  if (!candidate || candidate.length > MAX_PROOF_COMMAND) return false;
  if (/[\r\n]/.test(candidate)) return false;              // a script is not one runnable line
  if (/^\S+$/.test(candidate)) return false;               // a bare tool name names no proof
  if (/<[\w. \/-]{1,40}>/.test(candidate)) return false;   // a placeholder, never a command that ran
  return PROOF_COMMAND_RE.test(candidate);
}

/** Commands that verify something outrank commands that only look. */
const VERIFY_COMMAND = /\b(test|check|typecheck|verify|prove|build|lint)\b/i;

/**
 * Every command and every named file a turn's tool calls actually carried, in the order they
 * happened. Nothing is inferred: a turn with prose only yields nothing, which is the honest answer
 * and the reason this module no longer guesses a file out of a sentence when a call is available.
 * @param {any} turn a hq/lib/session-parts.mjs turn (or any `{ parts }` object)
 * @returns {{ commands: string[], files: string[] }}
 */
export function turnEvidence(turn) {
  /** @type {string[]} */
  const commands = [];
  /** @type {string[]} */
  const mutated = [];
  /** @type {string[]} */
  const named = [];
  for (const call of toolCalls([turn])) {
    const tool = String(call.tool ?? '').toLowerCase();
    for (const field of COMMAND_INPUT_FIELDS) {
      const value = call.input?.[field];
      if (typeof value !== 'string') continue;
      const command = value.trim();
      if (command) commands.push(command);
    }
    for (const field of FILE_INPUT_FIELDS) {
      const value = call.input?.[field];
      if (typeof value !== 'string') continue;
      const file = value.trim();
      if (!file) continue;
      (MUTATING_TOOLS.has(tool) ? mutated : named).push(file);
    }
  }
  return { commands: [...new Set(commands)], files: [...new Set([...mutated, ...named])] };
}

/**
 * The last path a command names as an argument. It is evidence only because the command that ran
 * carried it; this is not the prose guess `firstPath` makes.
 * @param {string} command
 * @returns {string}
 */
function pathFromCommand(command) {
  const tokens = String(command ?? '').match(PATHISH) ?? [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i].replace(/[),.;:]+$/, '');
    if (!token || token.startsWith('-') || /^[a-z]+:\/\//i.test(token)) continue;
    return token;
  }
  return '';
}

/**
 * Pick the proving command out of the ones that ran in this turn: verifying commands first, then
 * the ones naming a file the turn touched, and the latest of those. A turn that ran only
 * exploration commands yields '' rather than the best of a bad set.
 * @param {string[]} commands @param {string[]} files
 * @returns {string}
 */
function chooseProofCommand(commands, files) {
  const usable = commands.map((c) => redactSecrets(c).trim()).filter(isProofCommand);
  if (!usable.length) return '';
  const verifying = usable.filter((c) => VERIFY_COMMAND.test(c));
  const pool = verifying.length ? verifying : usable;
  const bases = files.map((f) => f.split(/[\\/]/).pop() ?? '').filter(Boolean);
  const naming = bases.length ? pool.filter((c) => bases.some((b) => c.includes(b))) : [];
  const chosen = naming.length ? naming : pool;
  return chosen[chosen.length - 1];
}

/**
 * Attribute one quoted turn: the file it touched and the command that proved it. Evidence wins
 * over prose — a path a tool named, then the path the chosen command names, and only then the old
 * prose guess, which stays for rows whose session carries no tool parts at all.
 * @param {any} turn @param {string} text
 * @returns {{ file: string, command: string }}
 */
function attribute(turn, text) {
  const evidence = turnEvidence(turn);
  const command = chooseProofCommand(evidence.commands, evidence.files);
  return { file: evidence.files[0] || pathFromCommand(command) || firstPath(text), command };
}

/**
 * Deterministic signal detection over one conversation's turns. Every signal carries the exact
 * quote; the highest-precision kinds are emitted first so a per-session cap keeps the good rows.
 * A signal also carries the file and the proving command its turn's tool calls actually supplied,
 * so a row built from it is dispatchable instead of merely descriptive.
 * @param {Turn[]} turns
 * @returns {Array<{kind:string, quote:string, file:string, command:string}>}
 */
export function extractSignals(turns) {
  /** @type {Array<{kind:string, quote:string, file:string, command:string}>} */
  const out = [];
  for (const turn of Array.isArray(turns) ? turns : []) {
    if (!turn || isNoiseTurn(turn)) continue;
    const text = redactSecrets(String(turn.text ?? ''));
    const role = String(turn.role ?? '');
    const evidence = attribute(turn, text);
    // Owner corrections are learnings, handled by extractLearnings; they also name work here.
    if (isOwnerTurn(turn) && looksLikeSpokenRule(text) && CORRECTION.test(text)) {
      const sentence = firstSentenceWith(text, CORRECTION) || text;
      out.push({ kind: 'correction', quote: clip(sentence, 240), file: evidence.file, command: evidence.command });
      continue;
    }
    const blocked = text.match(BLOCKED);
    if (blocked) {
      out.push({ kind: 'blocked', quote: clip(sentenceAround(text, blocked.index ?? 0), 240), file: evidence.file, command: evidence.command });
      continue;
    }
    const path = firstPath(text);
    // Test the verb against the prose, not the path: `dogfood.test.mjs` already contains "test".
    const prose = path ? text.split(path).join(' ') : text;
    if (path && INTENT.test(prose) && role !== 'user') {
      out.push({ kind: 'intent', quote: clip(sentenceAround(text, text.search(INTENT)), 240), file: evidence.file, command: evidence.command });
      continue;
    }
    const q = role === 'assistant' ? lastQuestion(text) : '';
    if (q) {
      // A question is answered in words; it names no file and proves nothing with a command.
      out.push({ kind: 'question', quote: clip(q, 240), file: '', command: '' });
      continue;
    }
    const failure = firstRealFailure(text);
    if (failure) {
      out.push({ kind: 'failure', quote: clip(failure.sentence, 240), file: evidence.file, command: evidence.command });
    }
  }
  return out;
}

/**
 * The first failure statement in a turn that is not a report of zero failures. A passing suite
 * ("238 pass / 0 fail") carries the word "fail"; calling that a failure sends the owner to chase
 * a problem that does not exist, so the sentence has to be read, not just pattern-matched.
 * @param {string} text
 * @returns {{ sentence: string, index: number }|null}
 */
function firstRealFailure(text) {
  for (const m of String(text).matchAll(new RegExp(FAILURE, 'gi'))) {
    const index = m.index ?? 0;
    const sentence = sentenceAround(text, index);
    if (ZERO_FAILURE.test(sentence)) continue;
    return { sentence, index };
  }
  return null;
}

/** @param {string} text @param {RegExp} re */
function firstSentenceWith(text, re) {
  const parts = String(text).split(/(?<=[.!?])\s+/);
  return parts.find((p) => re.test(p)) ?? '';
}

/** @param {string} text @param {number} index */
function sentenceAround(text, index) {
  if (!Number.isFinite(index) || index < 0) return clip(text, 240);
  const before = text.slice(0, index);
  const start = Math.max(before.lastIndexOf('. '), before.lastIndexOf('\n'), before.lastIndexOf('! '), before.lastIndexOf('? '));
  const afterIdx = text.slice(index).search(/[.!?](\s|$)/);
  const end = afterIdx === -1 ? text.length : index + afterIdx + 1;
  return text.slice(start + 1, end).trim() || clip(text, 240);
}

/* ------------------------------------------------------------------ */
/* learning                                                            */
/* ------------------------------------------------------------------ */

/** @param {string} text */
function normalizeRule(text) {
  return String(text ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * One piece of evidence per (session, quote). The same sentence repeated inside one session is one
 * observation, not several, and a count that outruns its evidence is drift the ledger cannot hold.
 * @param {any[]} evidence
 * @returns {any[]}
 */
function dedupeEvidence(evidence) {
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {any[]} */
  const out = [];
  for (const e of evidence) {
    if (!e || typeof e !== 'object') continue;
    const key = `${e.session}\u0000${e.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/**
 * Turn the owner's corrections into persisted rules with evidence counts. Repetition is the
 * learning signal: a rule said twice across two sessions outranks a one-off remark.
 * @param {Array<{ id: string, title: string, turns: Turn[] }>} sessions
 * @param {Array<any>} [prior] rows from a previous learnings file
 * @returns {Array<any>}
 */
export function extractLearnings(sessions, prior = [], opts = {}) {
  /** @type {Map<string, any>} */
  const byId = new Map();
  const injected = opts.injected ? normalizeRule(opts.injected) : '';
  for (const row of Array.isArray(prior) ? prior : []) {
    // A row another producer wrote is not an owner correction and is not re-derived here: the
    // ledger writer preserves it verbatim. Re-validating it would strip its evidence (a `dfe_*`
    // row carries an object, not a turn list) and drop the row entirely.
    if (!row || typeof row.id !== 'string') continue;
    if (!isOwnedLearning(row)) continue;
    // Re-validate history: a row that our own corpus already contains was never the owner's, and
    // a pasted report was never a rule. Keeping it would launder our text into owner consent.
    if (!looksLikeSpokenRule(row.rule) || (injected && injected.includes(normalizeRule(row.rule)))) continue;
    // History is re-counted from its evidence: a row written by an older scanner may carry the same
    // observation twice, and a count that outruns its evidence is exactly the drift the ledger
    // exists to prevent.
    const evidence = dedupeEvidence(Array.isArray(row.evidence) ? row.evidence : []);
    byId.set(row.id, { ...row, evidence, count: evidence.length });
  }
  for (const s of Array.isArray(sessions) ? sessions : []) {
    for (const turn of Array.isArray(s?.turns) ? s.turns : []) {
      if (!turn || !isOwnerTurn(turn)) continue;
      const text = redactSecrets(String(turn.text ?? ''));
      if (!looksLikeSpokenRule(text)) continue;
      const kind = CORRECTION.test(text) ? 'correction' : PREFERENCE.test(text) ? 'preference' : '';
      if (!kind) continue;
      const sentence = clip(firstSentenceWith(text, kind === 'correction' ? CORRECTION : PREFERENCE) || text, 240);
      if (sentence.length < 12) continue;
      if (/^#|\*\*[^*]{2,40}:\*\*/.test(sentence)) continue;   // a heading or an analysis label, not a spoken rule
      // A line we already ship in AGENTS.md or an agent definition is our own text coming back as a
      // "user" turn. Learning it would cite us as the owner.
      if (injected && injected.includes(normalizeRule(sentence))) continue;
      const id = learningId(sentence);
      const existing = byId.get(id);
      if (existing) {
        // `s` is a session object: its id lives in `s.id`, and that is what the evidence stores.
        // Comparing against `s.session` (always undefined) let the same observation be counted
        // again and again, which inflated a rule far past the turns that actually support it.
        if (!existing.evidence.some((e) => e.session === s.id && e.quote === sentence)) {
          existing.evidence.push({ session: s.id, title: clip(s.title, 120), quote: sentence });
          existing.count = existing.evidence.length;
          existing.lastSeen = new Date().toISOString();
        }
      } else {
        const now = new Date().toISOString();
        byId.set(id, {
          schema: LEARNINGS_SCHEMA, id, kind, rule: sentence,
          count: 1, firstSeen: now, lastSeen: now,
          evidence: [{ session: s.id, title: clip(s.title, 120), quote: sentence }],
        });
      }
    }
  }
  // A row read back from the ledger may carry no count and no timestamp; the order must not
  // depend on a field the ledger does not promise.
  return [...byId.values()].sort((a, b) =>
    (Number(b.count) || 0) - (Number(a.count) || 0) ||
    String(b.lastSeen ?? '').localeCompare(String(a.lastSeen ?? '')));
}

/* ------------------------------------------------------------------ */
/* session tasks + evidence tasks                                      */
/* ------------------------------------------------------------------ */

const KIND_ORDER = { correction: 0, blocked: 1, mismatch: 2, intent: 3, question: 4, failure: 5 };

/**
 * A rule is something a person says, not a report they paste. Long turns, tables and labelled
 * analysis are summaries of work; treating them as "what the owner wants" would learn from our
 * own prose.
 * @param {string} text
 */
export function looksLikeSpokenRule(text) {
  const t = String(text ?? '');
  if (t.length > 700) return false;
  if ((t.match(/\n/g) ?? []).length > 4) return false;
  if ((t.match(/\|/g) ?? []).length > 2) return false;
  if (/```/.test(t)) return false;
  return true;
}

/** Bound on the turns a session read may consult when the caller supplied no tool parts. */
export const EVIDENCE_TURN_LIMIT = 60;

/** @param {any} turn @returns {string} */
function turnKey(turn) {
  return String(turn?.text ?? '').replace(/\s+/g, ' ').trim();
}

/** A key shorter than this matches too much; it can never identify one turn. */
const MIN_EVIDENCE_KEY = 24;

/**
 * Attach the tool parts a session read holds to the turns the caller supplied. The text-only probe
 * and hq/lib/session-parts.mjs disagree on order and on where a message's text is stored, so the
 * join key is the turn's own words and never a position: a command is attached only to a turn that
 * carries the same text. A turn with no match keeps exactly what the caller gave it, which is why
 * a feed that cannot be joined loses evidence but never loses an observation.
 * @param {Turn[]} given @param {any[]} read
 * @returns {Turn[]}
 */
function withToolEvidence(given, read) {
  const index = read
    .map((turn) => ({ parts: Array.isArray(turn?.parts) ? turn.parts : [], key: turnKey(turn) }))
    .filter((entry) => entry.parts.length && entry.key.length >= MIN_EVIDENCE_KEY);
  if (!index.length) return given;
  return given.map((turn) => {
    const key = turnKey(turn);
    if (key.length < MIN_EVIDENCE_KEY) return turn;
    /** @type {{parts: any[], key: string}|null} */
    let match = null;
    for (const entry of index) {
      if (!(entry.key === key || entry.key.includes(key) || key.includes(entry.key))) continue;
      // `read` is in sequence order, so `>=` keeps the most recent of equally good matches.
      if (!match || entry.key.length >= match.key.length) match = entry;
    }
    return match ? { ...turn, parts: match.parts } : turn;
  });
}

/**
 * Resolve the turns one session is scanned from. A caller that already carries tool parts is used
 * as it stands. Otherwise the session is re-read through hq/lib/session-parts.mjs, which keeps the
 * `tool_use` parts the text-only probe discards, and the evidence is joined onto the caller's own
 * turns by text. A read that fails, or a session the DB does not hold, leaves the turns untouched.
 * @param {any} session
 * @param {(id: string, limit: number) => any[]} readTurns
 * @param {Map<string, any[]>} cache one read per session per scan
 * @returns {Turn[]}
 */
function turnsForSession(session, readTurns, cache) {
  const given = Array.isArray(session?.turns) ? session.turns : [];
  if (!given.length) return given;
  if (given.some((turn) => Array.isArray(turn?.parts) && turn.parts.length)) return given;
  const id = String(session?.id ?? '');
  if (!id) return given;
  const cached = cache.get(id);
  if (cached !== undefined) return withToolEvidence(given, cached);
  /** @type {any[]} */
  let read = [];
  try {
    read = readTurns(id, Math.max(given.length, EVIDENCE_TURN_LIMIT)) ?? [];
  } catch {
    read = [];
  }
  const turns = Array.isArray(read) ? read.filter((t) => t && typeof t === 'object') : [];
  cache.set(id, turns);
  return withToolEvidence(given, turns);
}

/**
 * The evidence seam. `evidence: false` forbids every read (a caller that supplies its own parts,
 * and every test that must stay hermetic); a function is a caller-supplied reader; otherwise the
 * real session DB is read through hq/lib/session-parts.mjs, which is read-only by contract.
 * @param {{ evidence?: false | null | ((id: string, limit: number) => any[]), dbPath?: string }} [opts]
 * @returns {(id: string, limit: number) => any[]}
 */
function evidenceReader(opts = {}) {
  if (opts.evidence === false || opts.evidence === null) return () => [];
  if (typeof opts.evidence === 'function') return opts.evidence;
  return (id, limit) => readSessionParts({ dbPath: opts.dbPath, sessionId: id, limit }).turns;
}

/**
 * @param {{
 *   sessions: Array<{id:string,title:string,ageMinutes:number,turns:Turn[]}>, seats?: Record<string,string>,
 *   maxPerSession?: number, evidence?: false | null | ((id: string, limit: number) => any[]), dbPath?: string
 * }} input
 */
export function extractTasks({ sessions, seats = {}, maxPerSession = 10, evidence, dbPath } = /** @type {any} */ ({})) {
  /** @type {any[]} */
  const tasks = [];
  /** @type {Array<{id:string,title:string,ageMinutes:number,why:string}>} */
  const clear = [];
  const readTurns = evidenceReader({ evidence, dbPath });
  /** @type {Map<string, any[]>} */
  const evidenceCache = new Map();
  for (const s of Array.isArray(sessions) ? sessions : []) {
    const turns = turnsForSession(s, readTurns, evidenceCache);
    const signals = extractSignals(turns)
      .sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9))
      .slice(0, maxPerSession);
    if (!signals.length) {
      clear.push({ id: s.id, title: s.title, ageMinutes: s.ageMinutes, why: 'no task signal in the read turns' });
      continue;
    }
    const seat = seatForSession(s.id, seats) ?? seatFromTitle(s.title, seats) ?? 'unbound';
    for (const sig of signals) {
      tasks.push({
        id: taskId('session', s.id, sig.quote),
        kind: sig.kind,
        conversation: s.title,
        seat,
        session: s.id,
        ageMinutes: s.ageMinutes,
        task: taskTitle(sig),
        file: sig.file,
        // The proving command is a sibling of `proof`, never a rewrite of it: the proof cites the
        // session and the exact words, and hq/test/dogfood.test.mjs:140 depends on that shape.
        proofCommand: sig.command || '',
        proof: `\`${s.id}\`: “${cell(sig.quote)}”`,
        quote: sig.quote,
      });
    }
  }
  return { tasks, clear };
}

/** @param {{kind:string, quote:string, file:string}} sig */
function taskTitle(sig) {
  if (sig.kind === 'blocked') return `Unblock: ${clip(sig.quote, 150)}`;
  if (sig.kind === 'intent') return `Land ${sig.file || 'the named change'}: ${clip(sig.quote, 110)}`;
  if (sig.kind === 'correction') return `Apply owner correction: ${clip(sig.quote, 130)}`;
  if (sig.kind === 'question') return `Answer: ${clip(sig.quote, 150)}`;
  return `${sig.kind}: ${clip(sig.quote, 150)}`;
}

/**
 * The seats register is seat id -> session id, but a task knows only its own session id. The seat
 * that owns that session is the one that must answer for the row, so the register is read
 * backwards here. Seat ids are sorted so the answer stays deterministic if two seats ever share a
 * session.
 * @param {string} sessionId
 * @param {Record<string,string>} seats
 * @returns {string|null} the owning seat id, or null when no seat owns that session
 */
export function seatForSession(sessionId, seats) {
  const target = String(sessionId ?? '').trim();
  if (!target) return null;
  const register = seats && typeof seats === 'object' ? seats : {};
  const owner = Object.keys(register)
    .sort()
    .find((seat) => register[seat] != null && String(register[seat]) === target);
  return owner ?? null;
}

/**
 * Fallback for a session the register does not know: a conversation title that names a seat.
 * Returns null, never an empty string, so the caller can tell "no seat" from "a seat named ''".
 * @param {string} title @param {Record<string,string>} seats
 * @returns {string|null}
 */
function seatFromTitle(title, seats) {
  const t = String(title ?? '').toLowerCase();
  for (const [seat, session] of Object.entries(seats ?? {})) {
    if (typeof session !== 'string') continue;
    if (t.includes(String(seat).toLowerCase())) return seat;
  }
  return null;
}

/**
 * Channel evidence becomes work only when a claim and its outcome disagree. An OK effect with a
 * missing outcome is unproven, not fine.
 * @param {Array<any>} receipts
 * @param {Array<any>} outcomes
 * @returns {{ tasks: any[], defects: {source:string,detail:string}[] }}
 */
export function evidenceTasks(receipts, outcomes) {
  const byRequest = new Map();
  for (const o of Array.isArray(outcomes) ? outcomes : []) {
    if (o && o.requestId != null) byRequest.set(String(o.requestId), o);
  }
  /** @type {any[]} */
  const tasks = [];
  /** @type {{source:string,detail:string}[]} */
  const defects = [];
  for (const r of Array.isArray(receipts) ? receipts : []) {
    if (!r || r.requestId == null) continue;
    const requestId = String(r.requestId);
    const o = byRequest.get(requestId);
    const effect = String(r.effect ?? '');
    const outcomeEffect = o ? String(o.effect ?? '') : null;
    let why = '';
    if (effect === 'OK' && !o) why = 'effect OK but no outcome for this requestId';
    else if (effect === 'OK' && outcomeEffect && outcomeEffect !== 'OK') why = `effect OK but outcome says ${outcomeEffect}`;
    else if (o && o.evidenceState === 'CLAIMED' && effect === 'OK') why = 'evidence state is CLAIMED, not observed';
    const thread = r.thread?.after ?? r.thread?.before ?? '';
    if (!why && thread && /placeholder|live-tab/i.test(String(thread))) {
      why = `receipt touched a placeholder thread (${String(thread)})`;
    }
    if (!why) continue;
    tasks.push({
      id: taskId('receipt', requestId, why),
      kind: 'mismatch',
      conversation: `channel receipt ${clip(r.receiptId ?? requestId, 20)}`,
      seat: String(r.actor?.id ?? 'channel'),
      session: '',
      ageMinutes: null,
      task: `Verify receipt: ${why}`,
      file: r.journalPath ? String(r.journalPath) : '',
      proofCommand: '',
      proof: `requestId \`${requestId}\` → receipt effect \`${effect}\`${o ? `, outcome \`${outcomeEffect}\`` : ', no outcome'}`,
      quote: why,
    });
  }
  if (Array.isArray(receipts) && receipts.length && !byRequest.size) {
    defects.push({ source: 'channel:outcomes', detail: 'receipts exist but no outcome joined by requestId' });
  }
  return { tasks, defects };
}

/**
 * Bus rows: an unread inbox is work the seat has not started. The caller supplies the probe so
 * this module stays pure.
 * @param {Array<{seat:string, unread:number, ids?:string[]}>} bus
 */
export function busTasks(bus) {
  return (Array.isArray(bus) ? bus : [])
    .filter((b) => b && Number(b.unread) > 0)
    .map((b) => ({
      id: taskId('bus', b.seat, String(b.unread)),
      kind: 'blocked',
      conversation: `bus inbox ${b.seat}`,
      seat: b.seat,
      session: '',
      ageMinutes: null,
      task: `Read ${Number(b.unread)} unread bus message(s) for ${b.seat}`,
      file: 'scripts/sync.mjs',
      // The proof already names the command; carrying it in the dispatchable field is what lets an
      // unread inbox become a slice instead of prose.
      proofCommand: `bun scripts/sync.mjs check --as ${b.seat}`,
      proof: `\`bun scripts/sync.mjs check --as ${b.seat}\` reports ${Number(b.unread)} unread${b.ids?.length ? ` (${b.ids.slice(0, 3).join(', ')})` : ''}`,
      quote: `${Number(b.unread)} unread`,
    }));
}

/* ------------------------------------------------------------------ */
/* assembly + render                                                   */
/* ------------------------------------------------------------------ */

/**
 * @param {{
 *   sessions: any[], seats?: Record<string,string>, receipts?: any[], outcomes?: any[],
 *   bus?: any[], qeue: ReturnType<typeof loadQeue>, recon?: ReturnType<typeof loadRecon>,
 *   priorLearnings?: any[], windowMinutes?: number, now?: string, defects?: any[],
 *   injected?: string, evidence?: false | null | ((id: string, limit: number) => any[]), dbPath?: string
 * }} input
 */
export function buildScan(input) {
  const qeue = input.qeue ?? { records: [], byId: new Map(), defects: [], loaded: [] };
  const recon = input.recon ?? { byId: new Map(), defects: [], files: [] };
  const prior = Array.isArray(input.priorLearnings) ? input.priorLearnings : [];

  // The probe reads text only; every row's proof command and touched file come from the
  // tool-call-preserving reader inside extractTasks, so a row can be dispatched as it stands.
  const sessionPart = extractTasks({
    sessions: input.sessions ?? [],
    seats: input.seats ?? {},
    evidence: input.evidence,
    dbPath: input.dbPath,
  });
  // A "correction" that is really our own shipped text echoed into a transcript is not a task.
  const injectedNorm = input.injected ? String(input.injected).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ') : '';
  const isEcho = (t) => t.kind === 'correction' && injectedNorm && injectedNorm.includes(
    String(t.quote ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(),
  );
  sessionPart.tasks = sessionPart.tasks.filter((t) => !isEcho(t));
  const evidencePart = evidenceTasks(input.receipts ?? [], input.outcomes ?? []);
  const busPart = busTasks(input.bus ?? []);

  // Dedupe across sources on the stable id; the first occurrence wins because kinds are ordered.
  const seen = new Set();
  const open = [...sessionPart.tasks, ...busPart, ...evidencePart.tasks]
    .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));

  const blocked = open.filter((t) => t.kind === 'blocked' || t.kind === 'mismatch');
  const active = open.filter((t) => t.kind !== 'blocked' && t.kind !== 'mismatch');

  // How often our own conversations touch a qeue task: title words hitting a conversation quote.
  const corpus = open.map((t) => `${t.task} ${t.quote}`).join(' ').toLowerCase();
  const ranked = rankLeapfrog(qeue.records, recon.byId).map((r) => {
    const words = String(r.task).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !HIT_STOPWORDS.has(w));
    const hits = words.length ? words.filter((w) => corpus.includes(w)).length : 0;
    return { ...r, hits, score: leapfrogScore(r, { recon: recon.byId.get(r.id), hits }) };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const learnings = extractLearnings(input.sessions ?? [], prior, { injected: input.injected ?? '' });

  const defects = [
    ...(qeue.defects ?? []),
    ...(recon.defects ?? []),
    ...(evidencePart.defects ?? []),
    ...(Array.isArray(input.defects) ? input.defects : []),
  ];

  return {
    schema: DOGFOOD_SCHEMA,
    generatedAt: input.now ?? new Date().toISOString(),
    windowMinutes: input.windowMinutes ?? 300,
    counts: {
      sessions: (input.sessions ?? []).length,
      tasks: open.length,
      blocked: blocked.length,
      clear: sessionPart.clear.length,
      learnings: learnings.length,
      qeue: qeue.records.length,
      recon: recon.byId.size,
      defects: defects.length,
    },
    tasks: open,
    active,
    blocked,
    clear: sessionPart.clear,
    learnings,
    queue: ranked.slice(0, 50),
    defects,
    reconFiles: recon.files,
  };
}

/**
 * Render the supply signal. The shape is fixed so a reader (and a test) can rely on it:
 * header, Tasks, Blocked, Scanned/clear, Learnings, Leapfrog queue, Defects.
 * @param {ReturnType<typeof buildScan>} scan
 * @param {{ topQueue?: number, maxTasks?: number }} [opts]
 */
export function renderActiveTasks(scan, opts = {}) {
  const topQueue = opts.topQueue ?? 25;
  const maxTasks = opts.maxTasks ?? 60;
  const L = [];
  L.push('# Active tasks — dogfood supply signal');
  L.push('');
  L.push(`**Schema:** \`${scan.schema}\` · **Generated:** ${scan.generatedAt} · **Window:** ${scan.windowMinutes} min · **One writer: rewritten every scan, never appended.**`);
  L.push('');
  L.push(`**Counts:** ${scan.counts.sessions} sessions · ${scan.counts.tasks} open tasks (${scan.counts.blocked} blocked) · ${scan.counts.learnings} learnings · ${scan.counts.qeue} qeue rows (${scan.counts.recon} recon receipts) · ${scan.counts.defects} defects.`);
  L.push('');
  L.push('Every row cites the exact conversation words, receipt id or bus message that produced it. A row without proof is not a task.');
  L.push('');
  L.push(`## Tasks (${scan.active.length})`);
  L.push('');
  L.push('| # | Conversation | Seat | Task | File/thread | Proof |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  const rows = scan.active.slice(0, maxTasks);
  rows.forEach((t, i) => {
    L.push(`| ${i + 1} | ${cell(t.conversation)} | ${cell(t.seat)} | ${cell(t.task)} | ${t.file ? `\`${cell(t.file)}\`` : '—'} | ${t.proof} |`);
  });
  if (!rows.length) L.push('| — | — | — | No open task in the read turns. | — | — |');
  if (scan.active.length > rows.length) L.push(`| … | | | ${scan.active.length - rows.length} more in the machine form | | |`);
  L.push('');
  L.push(`## Blocked (${scan.blocked.length})`);
  L.push('');
  L.push('| Conversation | Blocker | Owner action needed | Proof |');
  L.push('| --- | --- | --- | --- |');
  for (const t of scan.blocked.slice(0, 40)) {
    L.push(`| ${cell(t.conversation)} | ${cell(t.task)} | ${cell(t.seat)} | ${t.proof} |`);
  }
  if (!scan.blocked.length) L.push('| — | No blocked row in the read turns. | — | — |');
  L.push('');
  L.push(`## Scanned / clear (${scan.clear.length})`);
  L.push('');
  L.push('| Conversation | Age | Why clear |');
  L.push('| --- | --- | --- |');
  for (const c of scan.clear.slice(0, 40)) L.push(`| ${cell(c.title)} \`${c.id}\` | ${c.ageMinutes}m | ${cell(c.why)} |`);
  if (!scan.clear.length) L.push('| — | — | every read session produced at least one signal |');
  L.push('');
  L.push(`## Learnings from owner corrections (${scan.learnings.length})`);
  L.push('');
  L.push('A rule enters here only when an owner turn carries a correction or preference marker. Count = independent turns that repeated it.');
  L.push('');
  L.push('| Count | Kind | Rule | Evidence |');
  L.push('| --- | --- | --- | --- |');
  for (const l of scan.learnings.slice(0, 30)) {
    const ev = l.evidence.slice(0, 3).map((e) => `\`${e.session}\``).join(', ');
    L.push(`| ${l.count} | ${cell(l.kind)} | ${cell(l.rule)} | ${ev} |`);
  }
  if (!scan.learnings.length) L.push('| — | — | No correction or preference in the read owner turns. | — |');
  L.push('');
  L.push(`## Leapfrog queue — top ${Math.min(topQueue, scan.queue.length)} of ${scan.counts.qeue}`);
  L.push('');
  L.push('`score = criticality × how-open-the-gap-is × release weight × repetition lift`. A `qeue:*` basis is still a hypothesis; only `recon:*` is checked evidence. Proven rows stay listed and sink.');
  L.push('');
  L.push('| Score | Task | Criticality | Complexity | Release | Basis | Hits |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const q of scan.queue.slice(0, topQueue)) {
    L.push(`| ${q.score} | \`${q.id}\` ${cell(q.task)} | ${q.criticality_rank} | ${q.complexity_score} | ${q.primary_release} | ${q.basis} | ${q.hits} |`);
  }
  L.push('');
  if (scan.defects.length) {
    L.push(`## Defects (${scan.defects.length})`);
    L.push('');
    L.push('| Source | Detail |');
    L.push('| --- | --- |');
    for (const d of scan.defects.slice(0, 40)) L.push(`| ${cell(d.source)} | ${cell(d.detail)} |`);
    L.push('');
  }
  return L.join('\n');
}

/* ------------------------------------------------------------------ */
/* writer                                                              */
/* ------------------------------------------------------------------ */

/**
 * Write atomically: a reader never sees half a document, and a failed write leaves the previous
 * scan intact.
 * @param {string} file
 * @param {string} text
 */
export function atomicWrite(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, file);
}

/**
 * Read the learnings file if it exists. A broken line is a defect, not a fatal error: one bad
 * line must not stop the loop, and it must not cost the ledger the good rows around it either.
 * @param {string} file
 * @returns {{ rows: any[], defects: {source:string,detail:string}[], lines: {text:string,row:any,parsed:boolean}[] }}
 */
export function readLearnings(file) {
  if (!existsSync(file)) return { rows: [], defects: [], lines: [] };
  try {
    const text = readFileSync(file, 'utf8');
    /** @type {any[]} */
    const rows = [];
    /** @type {{text:string,row:any,parsed:boolean}[]} */
    const lines = [];
    /** @type {{source:string,detail:string}[]} */
    const defects = [];
    for (const raw of text.split(/\r?\n/)) {
      if (!raw.trim()) continue;
      let row = null;
      let parsed = false;
      try {
        row = JSON.parse(raw);
        parsed = true;
      } catch (err) {
        defects.push({ source: 'dogfood:learnings', detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` });
      }
      lines.push({ text: raw, row, parsed });
      if (parsed) rows.push(row);
    }
    return { rows, defects, lines };
  } catch (err) {
    return { rows: [], defects: [{ source: 'dogfood:learnings', detail: `unreadable: ${err instanceof Error ? err.message : String(err)}` }], lines: [] };
  }
}

/**
 * Write the learnings ledger. This loop's own rows replace its previous rows, so counts cannot
 * drift from their evidence — but the file is shared with other producers (the dogfood execution
 * runner appends `dfe_*` rows), and those rows are evidence this loop did not write. They are
 * carried byte for byte, never clobbered. A merge, not a rewrite: collected evidence survives.
 * @param {string} file
 * @param {any[]} rows
 */
export function writeLearnings(file, rows) {
  const existing = readLearnings(file);
  /** @type {Map<string, any>} */
  const mine = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.id ?? '');
    if (!mine.has(id)) mine.set(id, row);
  }
  /** @type {Map<string, {id:string,text:string}>} */
  const foreign = new Map();
  /** @type {string[]} */
  const broken = [];
  for (const line of existing.lines) {
    // A line that is not JSON stays as it is: the bytes are still evidence.
    if (!line.parsed) { broken.push(line.text); continue; }
    // Our own row: the new scan replaces it (a stale echo must be able to fall out).
    if (isOwnedLearning(line.row)) continue;
    // Another producer's row is carried byte for byte, exactly as it was written.
    const id = String(line.row?.id ?? '');
    const key = id || `raw:${line.text}`;
    if (mine.has(key) || foreign.has(key)) continue;
    foreign.set(key, { id, text: line.text });
  }
  const out = [...mine.entries()].map(([id, row]) => ({ id, text: JSON.stringify(row) }))
    .concat([...foreign.values()])
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((entry) => entry.text)
    .concat(broken);
  atomicWrite(file, out.length ? out.join('\n') + '\n' : '');
}

/* ------------------------------------------------------------------ */
/* test-evidence probes (read-only)                                   */
/* ------------------------------------------------------------------ */

/**
 * The test-evidence state of one feature id: whether a 'proven' recon row
 * exists for it (passing evidence) and which receipts name it. Read-only
 * probe: reads the recon dir and a receipts array, writes nothing.
 *
 * @param {string} featureId
 * @param {{ reconDir?: string, receipts?: any[] }} [opts]
 * @returns {{ featureId: string, proven: boolean, recon: any|null, receipts: any[], sources: string[] }}
 */
export function featureTestEvidence(featureId, { reconDir = 'dogfood/recon', receipts = [] } = {}) {
  const { byId } = loadRecon(reconDir);
  const recon = byId.get(String(featureId)) ?? null;
  const proven = recon != null && recon.status === 'proven';
  const named = Array.isArray(receipts) ? receipts.filter((r) => {
    const text = JSON.stringify(r);
    return text.includes(String(featureId));
  }) : [];
  const sources = [...new Set([
    ...(recon?.evidence ?? []),
    ...named.map((r) => String(r.receiptId ?? r.id ?? '')).filter(Boolean),
  ])];
  return { featureId: String(featureId), proven, recon, receipts: named, sources };
}

/**
 * Reproduction-consistency probe: for each receipt that carries a test id,
 * compare the original effect to any re-run effect. Receipts without a
 * re-run effect are reported as not reproducible. Read-only probe: reads a
 * receipts array, writes nothing.
 *
 * @param {any[]} receipts
 * @returns {Array<{testId: string, original: string|null, rerun: string|null, consistent: boolean}>}
 */
export function reproductionOutcomes(receipts = []) {
  /** @type {Map<string, {original: string|null, rerun: string|null}>} */
  const byTest = new Map();
  for (const r of Array.isArray(receipts) ? receipts : []) {
    if (!r || r.testId == null) continue;
    const id = String(r.testId);
    const cur = byTest.get(id) ?? { original: null, rerun: null };
    if (r.effect != null && cur.original === null) cur.original = String(r.effect);
    if (r.rerunEffect != null && cur.rerun === null) cur.rerun = String(r.rerunEffect);
    byTest.set(id, cur);
  }
  const out = [];
  for (const [testId, { original, rerun }] of byTest) {
    out.push({ testId, original, rerun, consistent: rerun !== null && original === rerun });
  }
  return out;
}
