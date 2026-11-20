# File: hq/lib/team-protocol.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/team-protocol.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 22490 B |
| Lines | 408 |
| Hash | 1392af83d0be |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROTOCOL_KINDS | const | 24 | yes | export const PROTOCOL_KINDS = [&#39;TOOL&#39;, &#39;PROTOCOL&#39;, &#39;CONTEXT&#39;, &#39;REPORTING&#39;, &#39;COORDINATION&#39;, &#39;SPEED&#39;]; |
| PROTOCOL_AUDIENCES | const | 27 | yes | export const PROTOCOL_AUDIENCES = [&#39;all&#39;, &#39;workers&#39;, &#39;manager&#39;]; |
| RULE_MAX_LENGTH | const | 30 | yes | export const RULE_MAX_LENGTH = 150; |
| PROTOCOL_BLOCKERS | const | 36 | yes | export const PROTOCOL_BLOCKERS = [ |
| validateProtocol | function | 271 | yes | export function validateProtocol(blockers) { |
| problems | const | 272 | no | const problems = []; |
| push | function | 273 | no | const push = (id, problem) =&gt; problems.push({ id, problem }); |
| seen | const | 284 | no | const seen = new Set(); |
| id | const | 286 | no | const id = b &amp;&amp; typeof b.id === &#39;string&#39; ? b.id : `index-${i}`; |
| expected | const | 299 | no | const expected = `B${String(i + 1).padStart(2, &#39;0&#39;)}`; |
| ok | const | 322 | no | const ok = e &amp;&amp; typeof e === &#39;object&#39; |
| id | const | 334 | no | const id = `B${String(n).padStart(2, &#39;0&#39;)}`; |
| renderSkillBody | function | 346 | yes | export function renderSkillBody(blockers = PROTOCOL_BLOCKERS) { |
| list | const | 347 | no | const list = Array.isArray(blockers) ? blockers : []; |
| lines | const | 348 | no | const lines = []; |
| n | variable | 364 | no | let n = 0; |
| group | const | 366 | no | const group = list.filter((b) =&gt; b &amp;&amp; b.kind === kind); |
| renderGrantLine | function | 396 | yes | export function renderGrantLine(blockers = PROTOCOL_BLOCKERS) { |
| blockerById | function | 406 | yes | export function blockerById(id) { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The 20 procedural blockers every agent on this machine obeys, with the evidence that produced each. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | team-protocol |
| 5 | invariant | — | — | data only — it never wakes, sends, or edits an agent file. |
| 6 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |
| 7 | see | — | .work/blockers/records.jsonl | .work/blockers/records.jsonl |

## Excerpt

```javascript
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
```

_First 80 of 409 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
