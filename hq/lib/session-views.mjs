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

  return sessions.map((session) => {
    const count = counts.get(session.id) ?? emptyCounts();
    const toolMap = tools.get(session.id) ?? new Map();
    return {
      id: session.id,
      title: session.title ?? 'Session',
      project: session.project ?? null,
      agent: session.agent ?? null,
      model: session.model ?? null,
      status: session.status ?? null,
      cost: session.cost ?? 0,
      tokens: session.tokens,
      createdAt: session.createdAt ?? null,
      updatedAt: session.updatedAt ?? null,
      source: session.source ?? null,
      messages: count.messages,
      userMessages: count.user,
      assistantMessages: count.assistant,
      toolCalls: count.tools,
      tools: [...toolMap.entries()].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0])).map(([name, n]) => ({ name, count: n })),
      ask: clip(asks.get(session.id) ?? '', DEFAULT_ASK_CHARS),
      reply: clip(replies.get(session.id) ?? '', DEFAULT_REPLY_CHARS),
    };
  });
}

/** One session in full: metadata, messages, tools, files and the two anchor texts. */
export function sessionDetail(db, { id = null, askChars = DEFAULT_ASK_CHARS, replyChars = DEFAULT_REPLY_CHARS } = {}) {
  if (!id) return null;
  const data = getSession(db, { id });
  if (!data.session) return null;
  const rows = sessionRows(db, { limit: 500 });
  const row = rows.find((r) => r.id === id) ?? null;
  const users = data.messages.filter((m) => m.role === 'user' && m.text && m.text.trim());
  const assistants = data.messages.filter((m) => m.role === 'assistant' && m.text && m.text.trim());
  const toolCalls = data.parts.filter((p) => p.type === 'tool');
  const toolNames = [...new Set(toolCalls.map((p) => p.toolName).filter(Boolean))].sort();
  return {
    id: data.session.id,
    title: data.session.title ?? 'Session',
    project: data.session.project ?? null,
    directory: data.session.directory ?? null,
    agent: data.session.agent ?? null,
    model: data.session.model ?? null,
    status: data.session.status ?? null,
    outcome: data.session.outcome ?? null,
    cost: data.session.cost ?? 0,
    tokens: data.session.tokens,
    createdAt: data.session.createdAt ?? null,
    updatedAt: data.session.updatedAt ?? null,
    source: data.session.source ?? null,
    messageCount: data.messages.length,
    partCount: data.parts.length,
    toolCallCount: toolCalls.length,
    tools: toolNames,
    files: data.files.map((f) => ({ path: f.path, action: f.action })),
    todos: data.todos,
    ask: clip(users[0]?.text ?? '', askChars),
    lastReply: clip(assistants[assistants.length - 1]?.text ?? '', replyChars),
    messages: data.messages.map((m) => ({
      id: m.id,
      role: m.role,
      seq: m.seq,
      createdAt: m.createdAt,
      text: clip(m.text, 600),
    })),
    row,
  };
}

/** Daily buckets: how many sessions, messages, tool calls and cost each day carried. */
export function sessionTimeline(db, { limit = 30 } = {}) {
  const rows = sessionRows(db, { limit: 500 });
  const days = new Map();
  for (const row of rows) {
    const day = String(row.updatedAt ?? row.createdAt ?? 'unknown').slice(0, 10);
    const bucket = days.get(day) ?? { day, sessions: 0, messages: 0, toolCalls: 0, cost: 0, titles: [] };
    bucket.sessions += 1;
    bucket.messages += row.messages;
    bucket.toolCalls += row.toolCalls;
    bucket.cost += row.cost ?? 0;
    bucket.titles.push(row.title);
    days.set(day, bucket);
  }
  return [...days.values()]
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, limit)
    .map((bucket) => ({ ...bucket, cost: Number(bucket.cost.toFixed(6)) }));
}

/** Tool usage across every session: name, call count and sessions touched. */
export function toolUsage(db) {
  return db.prepare(`
    SELECT tool_name AS name, count(*) AS calls, count(DISTINCT session_id) AS sessions
    FROM session_parts WHERE type = 'tool' AND tool_name IS NOT NULL
    GROUP BY tool_name ORDER BY calls DESC, name ASC
  `).all().map((r) => ({ name: r.name, calls: r.calls, sessions: r.sessions }));
}

/** Plain text for the CLI: one line per session, then the anchor texts. */
export function renderSessionsText(rows, { showAsks = false } = {}) {
  if (!rows.length) return 'No sessions ingested yet. Run: hq sessions import <dir>';
  const lines = rows.map((row) => {
    const when = String(row.updatedAt ?? row.createdAt ?? '-').slice(0, 16).replace('T', ' ');
    const tools = row.tools.map((t) => t.name).join(', ') || 'none';
    return `${when}  ${String(row.messages).padStart(4)}msg  $${(row.cost ?? 0).toFixed(3)}  ${row.agent ?? '-'}  ${row.title}\n`
      + `        id ${row.id} · tools: ${tools}`;
  });
  if (showAsks) {
    rows.forEach((row) => {
      if (row.ask) lines.push(`\n— ${row.title}\n  ask: ${row.ask.replace(/\n/g, '\n        ')}`);
      if (row.reply) lines.push(`  reply: ${row.reply.replace(/\n/g, '\n         ')}`);
    });
  }
  return lines.join('\n');
}

/** Markdown table for the wiki. Deterministic: rows arrive pre-sorted. */
export function renderSessionsMarkdown(rows, { title = 'Sessions', generatedAt = null } = {}) {
  const lines = [`# ${title}`, ''];
  if (!rows.length) {
    lines.push('No sessions ingested yet. Run `hq sessions import <dir>` to absorb an OpenCode session export.', '');
    return lines.join('\n');
  }
  const totalCost = rows.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const totalMessages = rows.reduce((sum, row) => sum + row.messages, 0);
  const totalTools = rows.reduce((sum, row) => sum + row.toolCalls, 0);
  lines.push(`Sessions ${rows.length} · messages ${totalMessages} · tool calls ${totalTools} · cost $${totalCost.toFixed(3)}`, '');
  if (generatedAt) lines.push(`_Generated ${generatedAt}._`, '');
  lines.push('| When (UTC) | Session | Title | Messages | Tools | Cost | Ask |');
  lines.push('| --- | --- | --- | ---: | ---: | ---: | --- |');
  const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
  for (const row of rows) {
    const when = String(row.updatedAt ?? row.createdAt ?? '-').slice(0, 16).replace('T', ' ');
    const tools = row.tools.map((t) => t.name).join(', ');
    lines.push(`| ${when} | \`${cell(row.id)}\` | ${cell(row.title)} | ${row.messages} | ${tools} | ${(row.cost ?? 0).toFixed(3)} | ${cell(clip(row.ask, 180))} |`);
  }
  lines.push('');
  return lines.join('\n');
}
