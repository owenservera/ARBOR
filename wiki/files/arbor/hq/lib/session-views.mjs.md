# File: hq/lib/session-views.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/session-views.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9851 B |
| Lines | 221 |
| Hash | 219dee6872eb |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SESSION_VIEWS_SCHEMA | const | 15 | yes | export const SESSION_VIEWS_SCHEMA = &#39;hq.session-views/1&#39;; |
| DEFAULT_ASK_CHARS | const | 17 | no | const DEFAULT_ASK_CHARS = 900; |
| DEFAULT_REPLY_CHARS | const | 18 | no | const DEFAULT_REPLY_CHARS = 1200; |
| clip | function | 20 | no | function clip(text, chars) { |
| value | const | 21 | no | const value = String(text ?? &#39;&#39;).replace(/\\r/g, &#39;&#39;).replace(/\\n{3,}/g, &#39;\\n\\n&#39;).trim(); |
| placeholders | function | 26 | no | function placeholders(count) { |
| emptyCounts | function | 30 | no | function emptyCounts() { |
| sessionRows | function | 38 | yes | export function sessionRows(db, { project = null, query = null, limit = 50 } = {}) { |
| sessions | const | 39 | no | const sessions = listSessions(db, { project, query, limit }); |
| ids | const | 41 | no | const ids = sessions.map((s) =&gt; s.id); |
| marks | const | 42 | no | const marks = placeholders(ids.length); |
| counts | const | 44 | no | const counts = new Map(ids.map((id) =&gt; [id, emptyCounts()])); |
| entry | const | 48 | no | const entry = counts.get(row.session_id); |
| tools | const | 55 | no | const tools = new Map(ids.map((id) =&gt; [id, new Map()])); |
| entry | const | 59 | no | const entry = tools.get(row.session_id); |
| count | const | 62 | no | const count = counts.get(row.session_id); |
| asks | const | 66 | no | const asks = new Map(); |
| replies | const | 74 | no | const replies = new Map(); |
| count | const | 83 | no | const count = counts.get(session.id) ?? emptyCounts(); |
| toolMap | const | 84 | no | const toolMap = tools.get(session.id) ?? new Map(); |
| sessionDetail | function | 109 | yes | export function sessionDetail(db, { id = null, askChars = DEFAULT_ASK_CHARS, replyChars = DEFAULT_REPLY_CHARS } = {}) { |
| data | const | 111 | no | const data = getSession(db, { id }); |
| rows | const | 113 | no | const rows = sessionRows(db, { limit: 500 }); |
| row | const | 114 | no | const row = rows.find((r) =&gt; r.id === id) ?? null; |
| users | const | 115 | no | const users = data.messages.filter((m) =&gt; m.role === &#39;user&#39; &amp;&amp; m.text &amp;&amp; m.text.trim()); |
| assistants | const | 116 | no | const assistants = data.messages.filter((m) =&gt; m.role === &#39;assistant&#39; &amp;&amp; m.text &amp;&amp; m.text.trim()); |
| toolCalls | const | 117 | no | const toolCalls = data.parts.filter((p) =&gt; p.type === &#39;tool&#39;); |
| toolNames | const | 118 | no | const toolNames = [...new Set(toolCalls.map((p) =&gt; p.toolName).filter(Boolean))].sort(); |
| sessionTimeline | function | 153 | yes | export function sessionTimeline(db, { limit = 30 } = {}) { |
| rows | const | 154 | no | const rows = sessionRows(db, { limit: 500 }); |
| days | const | 155 | no | const days = new Map(); |
| day | const | 157 | no | const day = String(row.updatedAt ?? row.createdAt ?? &#39;unknown&#39;).slice(0, 10); |
| bucket | const | 158 | no | const bucket = days.get(day) ?? { day, sessions: 0, messages: 0, toolCalls: 0, cost: 0, titles: [] }; |
| toolUsage | function | 173 | yes | export function toolUsage(db) { |
| renderSessionsText | function | 182 | yes | export function renderSessionsText(rows, { showAsks = false } = {}) { |
| lines | const | 184 | no | const lines = rows.map((row) =&gt; { const when = String(row.updatedAt ?? row.createdAt ?? &#39;-&#39;).slice(0, 16).replace(&#39;T&#39;, &#39; &#39;); const tools = row.tools.map((t) =&gt; t.name).join(&#39;, &#39;) \|\| &#39;none&#39;; return `$… |
| when | const | 185 | no | const when = String(row.updatedAt ?? row.createdAt ?? &#39;-&#39;).slice(0, 16).replace(&#39;T&#39;, &#39; &#39;); |
| tools | const | 186 | no | const tools = row.tools.map((t) =&gt; t.name).join(&#39;, &#39;) \|\| &#39;none&#39;; |
| renderSessionsMarkdown | function | 200 | yes | export function renderSessionsMarkdown(rows, { title = &#39;Sessions&#39;, generatedAt = null } = {}) { |
| lines | const | 201 | no | const lines = [`# ${title}`, &#39;&#39;]; |
| totalCost | const | 206 | no | const totalCost = rows.reduce((sum, row) =&gt; sum + (row.cost ?? 0), 0); |
| totalMessages | const | 207 | no | const totalMessages = rows.reduce((sum, row) =&gt; sum + row.messages, 0); |
| totalTools | const | 208 | no | const totalTools = rows.reduce((sum, row) =&gt; sum + row.toolCalls, 0); |
| cell | function | 213 | no | const cell = (value) =&gt; String(value ?? &#39;&#39;).replace(/\\\|/g, &#39;\\\\\|&#39;).replace(/\\r?\\n/g, &#39; &#39;).trim(); |
| when | const | 215 | no | const when = String(row.updatedAt ?? row.createdAt ?? &#39;-&#39;).slice(0, 16).replace(&#39;T&#39;, &#39; &#39;); |
| tools | const | 216 | no | const tools = row.tools.map((t) =&gt; t.name).join(&#39;, &#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./sessions.mjs | import | 13 | [hq/lib/sessions.mjs](./sessions.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/session-views.mjs |
| [hq/lib/wiki.mjs](./wiki.mjs.md) | ./session-views.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Read models over HQ&#39;s session tables: enriched session rows, one |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | session-absorb-views |
| 6 | why | — | — | The session dump is the rawest evidence HQ can hold; the views are what |
| 9 | invariant | — | — | Read-only. This module never writes to the database. |
| 10 | see | — | hq/lib/sessions.mjs | hq/lib/sessions.mjs |
| 11 | see | — | hq/lib/session-import.mjs | hq/lib/session-import.mjs |

## Excerpt

```javascript
/**
 * @hq:context Read models over HQ's session tables: enriched session rows, one
 *   session detail, a daily timeline and Markdown/text renderings for CLI + wiki.
 * @hq:owner hq
 * @hq:task session-absorb-views
 * @hq:why The session dump is the rawest evidence HQ can hold; the views are what
 *   an owner or an agent actually reads: what was asked, what was answered, which
 *   tools ran and what it cost.
 * @hq:invariant Read-only. This module never writes to the database.
 * @hq:see hq/lib/sessions.mjs
 * @hq:see hq/lib/session-import.mjs
 */
import { listSessions, getSession } from './sessions.mjs';

export const SESSION_VIEWS_SCHEMA = 'hq.session-views/1';

const DEFAULT_ASK_CHARS = 900;
const DEFAULT_REPLY_CHARS = 1200;

function clip(text, chars) {
  const value = String(text ?? '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (value.length <= chars) return value;
  return `${value.slice(0, chars)} …`;
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(',');
}

function emptyCounts() {
  return { messages: 0, user: 0, assistant: 0, tools: 0 };
}

/**
 * Enriched session rows: the same signals a session digest carries - title, time,
 * message counts, cost, agent, tools used, the first ask and the last reply.
 */
export function sessionRows(db, { project = null, query = null, limit = 50 } = {}) {
  const sessions = listSessions(db, { project, query, limit });
  if (!sessions.length) return [];
  const ids = sessions.map((s) => s.id);
  const marks = placeholders(ids.length);

  const counts = new Map(ids.map((id) => [id, emptyCounts()]));
  for (const row of db.prepare(
    `SELECT session_id, role, count(*) AS c FROM session_messages WHERE session_id IN (${marks}) GROUP BY session_id, role`,
  ).all(...ids)) {
    const entry = counts.get(row.session_id);
    if (!entry) continue;
    entry.messages += row.c;
    if (row.role === 'user') entry.user += row.c;
    else if (row.role === 'assistant') entry.assistant += row.c;
  }

  const tools = new Map(ids.map((id) => [id, new Map()]));
  for (const row of db.prepare(
    `SELECT session_id, tool_name, count(*) AS c FROM session_parts WHERE type = 'tool' AND session_id IN (${marks}) GROUP BY session_id, tool_name`,
  ).all(...ids)) {
    const entry = tools.get(row.session_id);
    if (!entry || !row.tool_name) continue;
    entry.set(row.tool_name, row.c);
    const count = counts.get(row.session_id);
    if (count) count.tools += row.c;
  }

  const asks = new Map();
  for (const row of db.prepare(
    `SELECT session_id, text FROM session_messages WHERE role = 'user' AND text IS NOT NULL AND text <> '' ORDER BY session_id ASC, seq ASC, created_at ASC, id ASC`,
  ).all()) {
    if (!ids.includes(row.session_id) || asks.has(row.session_id)) continue;
    asks.set(row.session_id, row.text);
  }

  const replies = new Map();
  for (const row of db.prepare(
    `SELECT session_id, text FROM session_messages WHERE role = 'assistant' AND text IS NOT NULL AND text <> '' ORDER BY session_id ASC, seq DESC, created_at DESC, id DESC`,
  ).all()) {
    if (!ids.includes(row.session_id) || replies.has(row.session_id)) continue;
    replies.set(row.session_id, row.text);
  }
```

_First 80 of 222 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
