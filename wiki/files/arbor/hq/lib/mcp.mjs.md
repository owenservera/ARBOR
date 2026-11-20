# File: hq/lib/mcp.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/mcp.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17976 B |
| Lines | 419 |
| Hash | 8c656c9bdabf |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MCP_PROTOCOL_VERSION | const | 7 | yes | export const MCP_PROTOCOL_VERSION = &#39;2025-11-25&#39;; |
| MCP_SUPPORTED_VERSIONS | const | 8 | yes | export const MCP_SUPPORTED_VERSIONS = Object.freeze([ &#39;2025-11-25&#39;, &#39;2025-06-18&#39;, &#39;2025-03-26&#39;, &#39;2024-11-05&#39;, ]); |
| MCP_SERVER_INFO | const | 11 | yes | export const MCP_SERVER_INFO = { name: &#39;hq&#39;, title: &#39;HQ&#39;, version: &#39;1.0.0&#39; }; |
| MCP_INSTRUCTIONS | const | 12 | yes | export const MCP_INSTRUCTIONS = [ |
| TOOLS | const | 24 | no | const TOOLS = [ |
| rpcResult | function | 182 | no | function rpcResult(id, result) { |
| rpcError | function | 186 | no | function rpcError(id, code, message, data = undefined) { |
| error | const | 187 | no | const error = { code, message }; |
| textResult | function | 192 | no | function textResult(value) { |
| text | variable | 193 | no | let text = typeof value === &#39;string&#39; ? value : JSON.stringify(value, null, 2); |
| count | function | 198 | no | function count(db, table, where = &#39;&#39;, params = []) { |
| row | const | 199 | no | const row = db.prepare(`SELECT count(*) AS c FROM ${table}${where ? &#39; WHERE &#39; + where : &#39;&#39;}`).get(...params); |
| createMcpServer | function | 203 | yes | export function createMcpServer({ root, db }) { |
| projectIdFor | function | 204 | no | function projectIdFor(name) { |
| row | const | 206 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(name); |
| callTool | function | 210 | no | async function callTool(name, args = {}) { |
| row | const | 227 | no | const row = findFileRow(db, args.path, args.project); |
| symbols | const | 229 | no | const symbols = db.prepare(&#39;SELECT name, kind, line, end_line, signature, exported FROM symbols WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| imports | const | 230 | no | const imports = db.prepare(&#39;SELECT specifier, kind, line, resolved_file_id FROM imports WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| dependents | const | 231 | no | const dependents = db.prepare(&#39;SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = i.project_id WHERE i.resolved_file_id = ? ORDER BY pa… |
| annotations | const | 232 | no | const annotations = db.prepare(&#39;SELECT line, kind, text, owner, ref FROM annotations WHERE file_id = ? ORDER BY line&#39;).all(row.id); |
| bundle | const | 249 | no | const bundle = await composeContext(db, { task: args.task, project: args.project, budgetTokens: args.budgetTokens ?? 6000, maxFiles: args.maxFiles ?? 24, }); |
| projects | const | 267 | no | const projects = args.project |
| result | const | 270 | no | const result = brief(db, { root, projects, audience: args.audience ?? &#39;agent&#39;, maxBytes: args.maxBytes ?? 6000 }); |
| page | const | 278 | no | const page = normalize(String(args.page ?? &#39;&#39;)).replace(/\\\\/g, &#39;/&#39;); |
| full | const | 282 | no | const full = join(root, &#39;wiki&#39;, page); |
| manifests | const | 308 | no | const manifests = Array.isArray(args.sourceManifests) ? args.sourceManifests : []; |
| synthetic | const | 313 | no | const synthetic = manifests.length &gt; 0 &amp;&amp; manifests.every(m =&gt; typeof m?.pin?.repoIdentity === &#39;string&#39; &amp;&amp; m.pin.repoIdentity.startsWith(&#39;synthetic/&#39;)); |
| request | const | 320 | no | const request = { |
| result | const | 329 | no | const result = await runHviTool(request, { authorize: async () =&gt; true }); |
| handle | function | 343 | no | async function handle(message) { |
| requested | const | 349 | no | const requested = params?.protocolVersion; |
| protocolVersion | const | 350 | no | const protocolVersion = MCP_SUPPORTED_VERSIONS.includes(requested) |
| name | const | 364 | no | const name = params?.name; |
| args | const | 365 | no | const args = params?.arguments ?? {}; |
| result | const | 368 | no | const result = await callTool(name, args); |
| findFileRow | function | 383 | no | function findFileRow(db, target, project) { |
| p | const | 384 | no | const p = String(target ?? &#39;&#39;).replace(/\\\\/g, &#39;/&#39;); |
| projectRow | const | 385 | no | const projectRow = project ? db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project) : null; |
| exact | const | 387 | no | const exact = db.prepare(&#39;SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND f.path = ?&#39;).get(projectRow.id, p); |
| exact | const | 391 | no | const exact = db.prepare(&#39;SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path = ?&#39;).get(p); |
| serveStdio | function | 396 | yes | export async function serveStdio({ root, db, input = process.stdin, output = process.stdout }) { |
| server | const | 397 | no | const server = createMcpServer({ root, db }); |
| buffer | variable | 398 | no | let buffer = &#39;&#39;; |
| newline | variable | 402 | no | let newline; |
| line | const | 404 | no | const line = buffer.slice(0, newline).trim(); |
| message | variable | 407 | no | let message; |
| response | const | 414 | no | const response = await server.handle(message); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| ./mcp-team-tools.mjs | import | 5 | [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) |
| ./search.mjs | dynamic | 213 | [hq/lib/search.mjs](./search.mjs.md) |
| ./search.mjs | dynamic | 220 | [hq/lib/search.mjs](./search.mjs.md) |
| ./graph.mjs | dynamic | 236 | [hq/lib/graph.mjs](./graph.mjs.md) |
| ./graph.mjs | dynamic | 243 | [hq/lib/graph.mjs](./graph.mjs.md) |
| ./context.mjs | dynamic | 247 | [hq/lib/context.mjs](./context.mjs.md) |
| ./receipts.mjs | dynamic | 248 | [hq/lib/receipts.mjs](./receipts.mjs.md) |
| ./skills.mjs | dynamic | 261 | [hq/lib/skills.mjs](./skills.mjs.md) |
| ./lake.mjs | dynamic | 265 | [hq/lib/lake.mjs](./lake.mjs.md) |
| ./registry.mjs | dynamic | 266 | [hq/lib/registry.mjs](./registry.mjs.md) |
| ./lake.mjs | dynamic | 274 | [hq/lib/lake.mjs](./lake.mjs.md) |
| ./release-status.mjs | dynamic | 302 | [hq/lib/release-status.mjs](./release-status.mjs.md) |
| ../version-intelligence/integration/index.mjs | dynamic | 307 | [hq/version-intelligence/integration/index.mjs](../version-intelligence/integration/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/mcp.mjs |
| [hq/test/hvi-mcp-tool.test.mjs](../test/hvi-mcp-tool.test.mjs.md) | ../lib/mcp.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/mcp.mjs — Model Context Protocol server (stdio, JSON-RPC 2.0).
// Read-only: every tool queries the local index. Nothing is sent anywhere.
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { TEAM_TOOLS, callTeamTool as callTeamToolFn } from './mcp-team-tools.mjs';

export const MCP_PROTOCOL_VERSION = '2025-11-25';
export const MCP_SUPPORTED_VERSIONS = Object.freeze([
  '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05',
]);
export const MCP_SERVER_INFO = { name: 'hq', title: 'HQ', version: '1.0.0' };
export const MCP_INSTRUCTIONS = [
  'HQ is a local-only code intelligence and context service.',
  'Use hq_search / hq_find_symbol to locate code, hq_file and hq_deps to understand it,',
  'hq_impact before changing a signature, hq_context for a token-budgeted task bundle,',
  'hq_route for mandatory instructions and skills, hq_brief for workspace state,',
  'and hq_wiki_page for generated documentation. All tools are read-only.',
  'hq_release_status reports version, pending bump, bundle digest and the last quality-gate result.',
  'hvi_compare_pinned compares 2..N pinned source manifests and reports source facts only;',
  'it is never runtime proof, and accepts synthetic/ fixtures only until a Host grant is accepted.',
  'Memory is not authority; evidence is not inference. Nothing is sent anywhere.',
].join(' ');

const TOOLS = [
  {
    name: 'hq_search',
    description: 'Search code and documentation across every indexed space. Returns ranked snippets with path and project.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text. Supports project:<name>, lang:<lang>, kind:<kind> filters.' },
        project: { type: 'string' },
        lang: { type: 'string' },
        kind: { type: 'string', enum: ['source', 'doc', 'config', 'data', 'other'] },
        limit: { type: 'number', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'hq_find_symbol',
    description: 'Find a symbol (function, class, method, type, route) by exact, prefix, or substring name.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        kind: { type: 'string' },
        project: { type: 'string' },
        exact: { type: 'boolean', default: false },
        limit: { type: 'number', default: 30 },
      },
      required: ['query'],
    },
  },
  {
    name: 'hq_file',
    description: 'Explain one file: language, size, symbols, imports, dependents, and annotations.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Workspace-relative or project-relative path, or a unique suffix.' },
        project: { type: 'string' },
      },
      required: ['path'],
    },
  },
  {
    name: 'hq_deps',
    description: 'Dependency edges for a file, forward (what it imports) or reverse (who imports it).',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string' },
        project: { type: 'string' },
        depth: { type: 'number', default: 2 },
        reverse: { type: 'boolean', default: false },
        limit: { type: 'number', default: 200 },
      },
      required: ['target'],
    },
```

_First 80 of 420 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
