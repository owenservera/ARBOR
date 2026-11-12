/**
 * @hq:context The 20 procedural blockers every agent on this machine obeys, with the evidence that produced each.
 * @hq:owner hq-agent
 * @hq:task team-protocol
 * @hq:invariant data only — it never wakes, sends, or edits an agent file.
 * @hq:see docs/AGENT-BUS.md
 * @hq:see .work/blockers/records.jsonl
 */
/**
 * The single source of truth for the team's procedural blockers.
 *
 * Every rule here was mined from one measured window of real machine conversations:
 *   - `.work/blockers/records.jsonl`  3,321 structured records, 63 live sessions, last 5 hours
 *   - `sync/ledger.jsonl`              the sync bus ledger (delivery / movement / proof round, 2026-11-04)
 *   - `C:/VIVIM/channel/tasks/active-tasks.md`  the task queue written from the same conversations
 *   - `.work/blockers/qualitative.md`  a qualitative read of the same corpus
 *
 * A rule is only present when a concrete failure in that window produced it, and every rule
 * carries the exact error string or verbatim quote that produced it. Nothing in this file wakes a
 * seat, sends a bus message, or edits an agent definition: it is data, and the caller decides.
 */

/** The kinds a blocker may be filed under. */
export const PROTOCOL_KINDS = ['TOOL', 'PROTOCOL', 'CONTEXT', 'REPORTING', 'COORDINATION', 'SPEED'];

/** The audiences a blocker may bind. */
export const PROTOCOL_AUDIENCES = ['all', 'workers', 'manager'];

/** Maximum length of a blocker rule, in characters. */
export const RULE_MAX_LENGTH = 150;

/**
 * The 20 blockers, in the order they are published: grouped by kind, ids contiguous B01..B20.
 * @type {Array<{id:string,kind:string,rule:string,why:string,evidence:Array<{session?:string,error?:string,quote?:string,count?:number}>,appliesTo:string}>}
 */
export const PROTOCOL_BLOCKERS = [
  {
    id: 'B01',
    kind: 'TOOL',
    rule: 'Resolve every path before you read or edit it; a path quoted in a mandate is a guess, not a fact.',
    why: 'Sixty Read calls in eleven sessions failed on paths nobody had listed, so the edit that followed aimed at a file that was never there.',
    evidence: [
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'File does not exist. Note: your current working directory is C:\\0-BlackBoxProject-0\\repos_hq.', count: 60 },
      { session: 'sess_subagent_agent_382a7ddf-660e-4063-a4a9-7bc92847b7eb', quote: "The anchors live at `hq/lib/action-registry.mjs` and `hq/lib/action-router.mjs` (the mandate's paths were slightly off).", count: 11 },
      { session: 'sess_subagent_agent_ad41be72-5597-4c70-8456-ecca65c83d50', error: 'Cannot read directory as text file: C:\\0-BlackBoxProject-0\\repos_hq\\research\\personal-intelligence\\evidence-protocol\\adapters', count: 4 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B02',
    kind: 'TOOL',
    rule: 'Use forward slashes in every tool path; a backslash inside JSON escapes into a null byte.',
    why: 'Windows backslash paths were mangled into null bytes, so the tool then reported the real file as missing and the turn was spent re-reading the same error.',
    evidence: [
      { session: 'sess_37ad528c-e871-4d48-8dfd-2dfae0f3a9c1', quote: 'The backslash paths are being mangled (`\\0` is being interpreted as a null byte). Let me use forward slashes.', count: 10 },
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'File does not exist. Note: your current working directory is C:\\0-BlackBoxProject-0\\repos_hq.', count: 60 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B03',
    kind: 'TOOL',
    rule: 'Read the file immediately before editing it, and re-read when the edit is rejected as modified.',
    why: 'Nineteen edits in two sessions were rejected because a second writer or a linter had changed the file since it was read, wasting a full write cycle each time.',
    evidence: [
      { session: 'sess_67ea68c3-d4e7-4386-b0bd-cb9f538ffad5', error: 'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.', count: 19 },
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'File has not been read yet. Read it first before writing to it.', count: 7 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B04',
    kind: 'TOOL',
    rule: 'Name only the tools this build exposes; Glob and Grep are not top-level tools here.',
    why: 'Six calls named tools that do not exist in this build and failed outright, so the search they were meant to perform never ran at all.',
    evidence: [
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'Tool not found: Glob', count: 3 },
      { session: 'sess_157c19b9-bc48-4245-95dd-8b8fa8e2dda6', error: 'Tool not found: Grep', count: 2 },
      { session: 'sess_3497f765-66c7-4b57-94e8-79ed4de8d67a', error: 'Tool not found: Bbox', count: 1 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B05',
    kind: 'TOOL',
    rule: 'Match a tool call to that tool\'s schema and to the Provider Registry; an unlisted model or a provider parameter is rejected.',
    why: 'Eight calls failed input-schema validation and three more named a model or a parameter the runtime does not accept, so nothing executed and the turn was spent on a resend.',
    evidence: [
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'Tool input failed inputSchema validation', count: 8 },
      { session: 'sess_6351b3ec-0af6-4639-9a76-23bd5aae2f01', error: 'Validation: Unsupported parameter(s): `enable_thinking`', count: 1 },
      { session: 'sess_fcb68575-4a50-4d7a-a342-bb8a315177f3', error: 'Provider Registry 中不存在 Model: minimax-m-plan/MiniMax-M3.1-Flash-Preview', count: 1 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B06',
    kind: 'TOOL',
    rule: 'Write a .mjs script file for anything with quotes, JSON or nested backticks.',
    why: 'Inline node and shell heredocs were mangled by quote escaping, so the probe ran a different program than the one that was written.',
    evidence: [
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', quote: 'Quote escaping is mangling inline node. Let me write a probe script file instead.', count: 4 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B07',
    kind: 'PROTOCOL',
    rule: 'Do exactly the instruction, count and scope you were given; extra tool calls are a defect.',
    why: 'The owner repeated one instruction in six sessions because the first attempt did more than asked, and the repeat was then read as a new task.',
    evidence: [
      { session: 'sess_b2d53b06-b609-4eef-acd1-d5c6bec47050', quote: 'DO ONLY THIS - NOTHIN ELSE - NO TOOL CALL - NO JASON - NADA DE DATA - PRINT HERE YOUR FULL CONTEXT - SKIP LEGALLY RESTRICTED - NO SYSTEM PROMPT', count: 4 },
      { session: 'sess_1ee89f83-46a7-4776-be44-b74ff9129e5b', quote: 'DO ONLY THIS - NOTHIN ELSE - NO TOOL CALL - NO JASON - NADA DE DATA - PRINT HERE YOUR FULL CONTEXT', count: 3 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'no - only the 8 most recent', count: 2 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B08',
    kind: 'PROTOCOL',
    rule: 'The moment the owner says stop, halt every lane and background task, report state, and wait.',
    why: 'Three sessions kept working after the owner said stop, so the stop had to be repeated before the lanes actually halted.',
    evidence: [
      { session: 'sess_bf0a6639-f1ce-4eb6-adb3-d07d3c407ca6', quote: 'STOP ALL WORK DO NOTHING - I AM TRYING TO INVESTIGATE DYNAMIC CONTEXT IN OUR AGENTIC SYSTEM HERE - TELL ME WHAT YOU SEE', count: 3 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'ok then stop all work', count: 1 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B09',
    kind: 'PROTOCOL',
    rule: 'Never put a secret in the transcript; read the key from config and name it by fingerprint.',
    why: 'The owner pasted a provider key into chat to unblock a probe, and the transcript copy outlived the config cleanup it prompted.',
    evidence: [
      { session: 'sess_67ea68c3-d4e7-4386-b0bd-cb9f538ffad5', quote: 'sorry its this key', count: 2 },
      { session: 'sess_67ea68c3-d4e7-4386-b0bd-cb9f538ffad5', quote: 'trying to setup my minimax M plan as a provider - tried multipel tiems not working', count: 1 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B10',
    kind: 'CONTEXT',
    rule: 'Before you re-derive or rebuild, read the decision log, canon, the bus and the transport that already ships.',
    why: 'One lane built a parallel transport the runtime already had and another re-derived a setup the owner had to point back at, both from memory instead of from the record.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: "That's a shipped tool. I built an ACP bridge to do what the runtime already does.", count: 2 },
      { session: 'sess_157c19b9-bc48-4245-95dd-8b8fa8e2dda6', quote: 'remember how we had set it up look through the zcode-setup and VOMEGA memory files', count: 4 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B11',
    kind: 'REPORTING',
    rule: 'Report DONE, BLOCKED or RUNNING with the reason in the first line of every report.',
    why: 'The owner asked whether the integration was done and the verdict was buried in prose, which reads exactly like unfinished work.',
    evidence: [
      { session: 'sess_5609dac1-aef8-4bf2-bd58-15261e282f9e', quote: 'is the integration done or not?', count: 3 },
      { session: 'sess_9dad7291-cd97-43da-9fa1-76cb7b0d0424', quote: 'No — the goal is not complete. Phase 1 context research is ~60% in (10 lanes still running)', count: 1 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B12',
    kind: 'REPORTING',
    rule: 'On a crash, resume from the session file, not from memory; count surviving artifacts first.',
    why: 'Twenty crashed agent sessions left two artifacts on disk, so a recovery plan built from recollection would have re-done work that had already landed.',
    evidence: [
      { session: 'sess_9dad7291-cd97-43da-9fa1-76cb7b0d0424', quote: '20 crashed agent sessions on disk, only 2 artifacts written.', count: 1 },
      { session: 'sess_9dad7291-cd97-43da-9fa1-76cb7b0d0424', quote: 'zcode crashed you need to recover from their sessions', count: 1 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B13',
    kind: 'COORDINATION',
    rule: 'Before you fan out N lanes, prove one lane runs on a registered agent type and a live budget.',
    why: 'Five lanes were dispatched onto one pinned free model and all five died before writing a file, forcing a full re-plan and a second fan-out request from the owner.',
    evidence: [
      { session: 'sess_5609dac1-aef8-4bf2-bd58-15261e282f9e', quote: 'All 5 subagents died on the same free-model daily cap — **none wrote any files**.', count: 5 },
      { session: 'sess_f1317e32-8424-42a2-aae2-82caa9eac790', error: "Agent type 'nvidia-probe' not found. Available agents: general-purpose, Explore, active-task-scanner, ...", count: 4 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', error: 'Cannot start subagent: Reasoning level unsupported / 不支持所选思考档位 [reason=reasoning-level-not-supported; selection=deepseek/deepseek-flash]', count: 2 },
    ],
    appliesTo: 'manager',
  },
  {
    id: 'B14',
    kind: 'COORDINATION',
    rule: 'Run the bus check as your own identity as the first act of every turn; exit 3 means read the inbox first.',
    why: 'A session that had not checked since it started called the bus empty while thirty unread messages were already waiting behind it.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: "'check --as zcode-data-workstream' was exit 3 with 30 unread when I looked at 01:05. That is my first check since I started this session, so the bus did deliver to me.", count: 1 },
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', quote: 'FIRST ACT OF EVERY TURN: `bun scripts/sync.mjs check --as <your identity>` — exit 3 means unread, read the inbox before searching or re-deriving anything.', count: 36 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B15',
    kind: 'COORDINATION',
    rule: 'A bus send delivers text and starts nothing; only a wake moves an agent.',
    why: 'A broadcast was sent to the bus and counted as done while no agent had actually started a turn, so the work it described sat still.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'a bus send is delivery, never movement — to make a seat actually act I must wake it (`hq seat wake`) or `SendMessage` it', count: 2 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'DEFERRED WAKE_PENDING — the bridge did not answer inside the wait; the send continues detached — confirm with `hq seat verify`', count: 9 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B16',
    kind: 'COORDINATION',
    rule: 'The proof of a wake is the seat\'s own reply; an acknowledgement is not a receipt.',
    why: 'A wake reported ACCEPTED with an empty result file and was nearly counted as done, and a seat with no running turn could never answer at all.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'No seat has replied — because no seat is running. You\'re right that delivery isn\'t verification.', count: 1 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'chatgpt — `BUS-ACK` in transcript (result file empty — the back-fill defect, again)', count: 1 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'you need a way to verify - it should have sent you a repsonse', count: 1 },
    ],
    appliesTo: 'all',
  },
  {
    id: 'B17',
    kind: 'COORDINATION',
    rule: 'A standing rule delivered by wake must also go to the bus as `*` with topic agent-bus.',
    why: 'Nine sessions answered a rule that existed only inside their own wake prompts, so a session that was idle at the time searched the disk for a rule that was never written there.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: "grep -c 'BUS-ACK' sync/ledger.jsonl → 0", count: 9 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'the whole nine sessions answered in their own transcripts', count: 9 },
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'The greps that returned **0** now return: `BUS-ACK` → 2, `AGENT-BUS` → 3, `agent-bus` topic → 3.', count: 1 },
    ],
    appliesTo: 'manager',
  },
  {
    id: 'B18',
    kind: 'COORDINATION',
    rule: 'Claim a shared file before editing it and give each lane a disjoint write scope.',
    why: 'A lane rewrote a test file after another lane had edited it, so the change silently reverted and the next agent inherited the old mapping.',
    evidence: [
      { session: 'sess_ae7c3121-d370-4072-85cb-3f949827c20d', quote: 'The test file reverted to the old mapping (a lane rewrote it after my edit).', count: 6 },
      { session: 'sess_67ea68c3-d4e7-4386-b0bd-cb9f538ffad5', error: 'File has been modified since read, either by the user or by a linter. Read it again before attempting to write it.', count: 19 },
      { session: 'sess_3497f765-66c7-4b57-94e8-79ed4de8d67a', quote: 'Let me set the write scopes first so they don\'t collide.', count: 3 },
    ],
    appliesTo: 'workers',
  },
  {
    id: 'B19',
    kind: 'SPEED',
    rule: 'Send research and audits to background subagents and steer every three minutes; never run a long task inline.',
    why: 'Thirteen background agents were cancelled before they returned, in three sessions, and each cancellation cost the turn its whole lane.',
    evidence: [
      { session: 'sess_5609dac1-aef8-4bf2-bd58-15261e282f9e', error: 'Agent was cancelled before the subagent returned findings or background launch completed', count: 13 },
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'Tool execution timed out after 186000ms', count: 8 },
    ],
    appliesTo: 'manager',
  },
  {
    id: 'B20',
    kind: 'SPEED',
    rule: 'Register the recurring job with the scheduler yourself; never wait for the owner to re-issue it.',
    why: 'The owner re-issued the same five-minute scan eighteen times because the job was never registered, so the owner had become the scheduler.',
    evidence: [
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', quote: 'Run the deterministic dogfood scan once every 5 minutes.', count: 18 },
      { session: 'sess_72ac8355-9fa3-4518-9887-7985b17ed0b9', error: 'Tool execution timed out after 186000ms', count: 8 },
    ],
    appliesTo: 'manager',
  },
];

/**
 * Validate a blocker set against the protocol contract.
 * @param {any} blockers the array to check
 * @returns {{ok:boolean, problems:Array<{id:string,problem:string}>}}
 */
export function validateProtocol(blockers) {
  const problems = [];
  const push = (id, problem) => problems.push({ id, problem });

  if (!Array.isArray(blockers)) {
    push('B00', 'blockers must be an array');
    return { ok: false, problems };
  }

  if (blockers.length !== 20) {
    push('B00', `expected exactly 20 blockers, found ${blockers.length}`);
  }

  const seen = new Set();
  blockers.forEach((b, i) => {
    const id = b && typeof b.id === 'string' ? b.id : `index-${i}`;
    if (!b || typeof b !== 'object') {
      push(id, 'blocker must be an object');
      return;
    }
    if (typeof b.id !== 'string' || !/^B\d{2}$/.test(b.id)) {
      push(id, `id must match B01..B20, found ${JSON.stringify(b.id)}`);
    }
    if (seen.has(b.id)) {
      push(id, `duplicate id ${b.id}`);
    }
    seen.add(b.id);

    const expected = `B${String(i + 1).padStart(2, '0')}`;
    if (b.id !== expected) {
      push(id, `ids must be contiguous: expected ${expected}, found ${b.id}`);
    }

    if (typeof b.rule !== 'string' || b.rule.trim() === '') {
      push(id, 'rule must be a non-empty string');
    } else if (b.rule.length > RULE_MAX_LENGTH) {
      push(id, `rule is ${b.rule.length} characters, limit is ${RULE_MAX_LENGTH}`);
    }

    if (typeof b.kind !== 'string' || !PROTOCOL_KINDS.includes(b.kind)) {
      push(id, `kind must be one of ${PROTOCOL_KINDS.join(', ')}, found ${JSON.stringify(b.kind)}`);
    }

    if (typeof b.appliesTo !== 'string' || !PROTOCOL_AUDIENCES.includes(b.appliesTo)) {
      push(id, `appliesTo must be one of ${PROTOCOL_AUDIENCES.join(', ')}, found ${JSON.stringify(b.appliesTo)}`);
    }

    if (!Array.isArray(b.evidence) || b.evidence.length === 0) {
      push(id, 'blocker needs at least one evidence entry');
    } else {
      b.evidence.forEach((e, j) => {
        const ok = e && typeof e === 'object'
          && (typeof e.session === 'string' && e.session.trim() !== ''
            || typeof e.error === 'string' && e.error.trim() !== ''
            || typeof e.quote === 'string' && e.quote.trim() !== '');
        if (!ok) {
          push(id, `evidence[${j}] needs a non-empty session, error or quote`);
        }
      });
    }
  });

  for (let n = 1; n <= 20; n += 1) {
    const id = `B${String(n).padStart(2, '0')}`;
    if (!seen.has(id)) push(id, `missing blocker ${id}`);
  }

  return { ok: problems.length === 0, problems };
}

/**
 * Render the shared skill body: title, evidence preamble, the 20 rules grouped by kind, and how to report.
 * @param {Array} blockers the blocker set to render
 * @returns {string} a self-contained markdown body
 */
export function renderSkillBody(blockers = PROTOCOL_BLOCKERS) {
  const list = Array.isArray(blockers) ? blockers : [];
  const lines = [];

  lines.push('# Team protocol — 20 procedural blockers');
  lines.push('');
  lines.push(
    'Every rule below was mined from one measured window of real conversations on this machine: '
    + '3,321 structured records from 63 live sessions over the last five hours '
    + '(`.work/blockers/records.jsonl`), the sync bus ledger (`sync/ledger.jsonl`), the task queue '
    + 'written from the same conversations (`C:/VIVIM/channel/tasks/active-tasks.md`), and a qualitative '
    + 'read of the same corpus (`.work/blockers/qualitative.md`). Each rule cites the exact error string '
    + 'or verbatim quote it was derived from, so any agent can check the claim instead of taking it on '
    + 'trust. A rule is here only because that failure actually happened in that window. This file is data: '
    + 'it wakes nobody, sends nothing, and grants no authority.',
  );
  lines.push('');

  let n = 0;
  for (const kind of PROTOCOL_KINDS) {
    const group = list.filter((b) => b && b.kind === kind);
    if (!group.length) continue;
    lines.push(`## ${kind}`);
    lines.push('');
    for (const b of group) {
      n += 1;
      lines.push(`${n}. **${b.id}** ${b.rule}`);
    }
    lines.push('');
  }

  lines.push('## How to report a blocker');
  lines.push('');
  lines.push(
    'When a rule stops you, report it in one line and move on: the rule id, what you tried, the exact '
    + 'error string, and whether the block is still in your way. Lead with `DONE`, `BLOCKED` or `RUNNING` '
    + 'and the reason. Never ask for plan approval in text — act on the instruction you were given, '
    + 'then say what you did. A rule you could not follow is a defect report about the rule, not a '
    + 'reason to abandon the task.',
  );
  lines.push('');

  return lines.join('\n');
}

/**
 * The single YAML frontmatter line every agent definition carries to load this skill.
 * @param {Array} blockers the blocker set this line binds (accepted for symmetry; the line is constant)
 * @returns {string} one line of YAML
 */
export function renderGrantLine(blockers = PROTOCOL_BLOCKERS) {
  void blockers;
  return 'skills: [team-protocol]';
}

/**
 * Look up one blocker by id.
 * @param {string} id the blocker id, e.g. "B07"
 * @returns {object|undefined} the blocker, or undefined when the id is unknown
 */
export function blockerById(id) {
  return PROTOCOL_BLOCKERS.find((b) => b.id === id);
}
