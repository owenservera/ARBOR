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
  },
  {
    name: 'hq_impact',
    description: 'Transitive reverse dependencies: what breaks if this file changes.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string' },
        depth: { type: 'number', default: 3 },
        limit: { type: 'number', default: 500 },
      },
      required: ['target'],
    },
  },
  {
    name: 'hq_context',
    description: 'Compose a deterministic, token-budgeted context bundle for a task. Read-only projection with provenance and omissions.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        project: { type: 'string' },
        budgetTokens: { type: 'number', default: 6000 },
        maxFiles: { type: 'number', default: 24 },
      },
      required: ['task'],
    },
  },
  {
    name: 'hq_route',
    description: 'Route a task to the mandatory instructions, skills, and boundary rules that apply.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        project: { type: 'string' },
      },
      required: ['task'],
    },
  },
  {
    name: 'hq_brief',
    description: 'Workspace or space progress report: state, recent activity, attention items, and next actions.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        audience: { type: 'string', enum: ['agent', 'owner'], default: 'agent' },
        maxBytes: { type: 'number', default: 6000 },
      },
    },
  },
  {
    name: 'hq_recent',
    description: 'Recent commits, optionally scoped to a space.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'hq_wiki_page',
    description: 'Read one generated wiki page by its relative id (for example projects/name.md).',
    inputSchema: {
      type: 'object',
      properties: { page: { type: 'string' } },
      required: ['page'],
    },
  },
  {
    name: 'hq_status',
    description: 'Index status: spaces, files, symbols, annotations, commits, and freshness.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'hq_release_status',
    description: 'Read-only release readiness: package version, last tag, pending semver bump, bundle digest, last quality-gate result and workflow presence.',
    inputSchema: { type: 'object', properties: {} },
  },
  ...TEAM_TOOLS,
];

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message, data = undefined) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id ?? null, error };
}

function textResult(value) {
  let text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (text.length > 100_000) text = text.slice(0, 100_000) + '\n… truncated';
  return { content: [{ type: 'text', text }] };
}

function count(db, table, where = '', params = []) {
  const row = db.prepare(`SELECT count(*) AS c FROM ${table}${where ? ' WHERE ' + where : ''}`).get(...params);
  return row ? row.c : 0;
}

export function createMcpServer({ root, db }) {
  function projectIdFor(name) {
    if (!name) return null;
    const row = db.prepare('SELECT id FROM projects WHERE name = ?').get(name);
    return row ? row.id : null;
  }

  async function callTool(name, args = {}) {
    switch (name) {
      case 'hq_search': {
        const { searchContent } = await import('./search.mjs');
        return searchContent(db, {
          query: args.query, project: args.project, lang: args.lang, kind: args.kind,
          limit: args.limit ?? 20,
        });
      }
      case 'hq_find_symbol': {
        const { searchSymbols } = await import('./search.mjs');
        return searchSymbols(db, {
          query: args.query, kind: args.kind, project: args.project,
          exact: args.exact === true, limit: args.limit ?? 30,
        });
      }
      case 'hq_file': {
        const row = findFileRow(db, args.path, args.project);
        if (!row) return { error: 'file_not_found', path: args.path };
        const symbols = db.prepare('SELECT name, kind, line, end_line, signature, exported FROM symbols WHERE file_id = ? ORDER BY line').all(row.id);
        const imports = db.prepare('SELECT specifier, kind, line, resolved_file_id FROM imports WHERE file_id = ? ORDER BY line').all(row.id);
        const dependents = db.prepare('SELECT f.path AS path, p.name AS project FROM imports i JOIN files f ON f.id = i.file_id JOIN projects p ON p.id = i.project_id WHERE i.resolved_file_id = ? ORDER BY path').all(row.id);
        const annotations = db.prepare('SELECT line, kind, text, owner, ref FROM annotations WHERE file_id = ? ORDER BY line').all(row.id);
        return { schema: 'hq.file/1', file: row, symbols, imports, dependents, annotations };
      }
      case 'hq_deps': {
        const { deps } = await import('./graph.mjs');
        return deps(db, {
          target: args.target, project: args.project, depth: args.depth ?? 2,
          reverse: args.reverse === true, limit: args.limit ?? 200,
        });
      }
      case 'hq_impact': {
        const { impact } = await import('./graph.mjs');
        return impact(db, { target: args.target, depth: args.depth ?? 3, limit: args.limit ?? 500 });
      }
      case 'hq_context': {
        const { composeContext } = await import('./context.mjs');
        const { recordReceipt } = await import('./receipts.mjs');
        const bundle = await composeContext(db, {
          task: args.task, project: args.project, budgetTokens: args.budgetTokens ?? 6000,
          maxFiles: args.maxFiles ?? 24,
        });
        recordReceipt(db, {
          kind: 'context', task: args.task, project: args.project,
          sources: bundle.sources.map((s) => ({ ref: s.ref, sha256: s.sha256 })),
          digest: bundle.digest, bytes: Buffer.byteLength(bundle.fragment ?? '', 'utf8'),
        });
        return bundle;
      }
      case 'hq_route': {
        const { routeTask } = await import('./skills.mjs');
        return routeTask(db, { task: args.task, project: args.project });
      }
      case 'hq_brief': {
        const { brief } = await import('./lake.mjs');
        const { projectsForIndex } = await import('./registry.mjs');
        const projects = args.project
          ? projectsForIndex(root).filter((p) => p.name === args.project)
          : projectsForIndex(root);
        const result = brief(db, { root, projects, audience: args.audience ?? 'agent', maxBytes: args.maxBytes ?? 6000 });
        return result;
      }
      case 'hq_recent': {
        const { queryCommits } = await import('./lake.mjs');
        return queryCommits(db, { project: args.project, limit: args.limit ?? 20 });
      }
      case 'hq_wiki_page': {
        const page = normalize(String(args.page ?? '')).replace(/\\/g, '/');
        if (!page || page.startsWith('../') || page.includes('/../') || page.startsWith('/')) {
          return { error: 'invalid_page' };
        }
        const full = join(root, 'wiki', page);
        if (!full.startsWith(join(root, 'wiki'))) return { error: 'invalid_page' };
        if (!existsSync(full)) return { error: 'page_not_found', page };
        return { schema: 'hq.wiki-page/1', page, text: readFileSync(full, 'utf8') };
      }
      case 'hq_status': {
        return {
          schema: 'hq.status/1',
          projects: count(db, 'projects'),
          files: count(db, 'files'),
          symbols: count(db, 'symbols'),
          imports: count(db, 'imports'),
          annotations: count(db, 'annotations'),
          commits: count(db, 'commits'),
          notes: count(db, 'notes', "status = 'active'"),
          receipts: count(db, 'receipts'),
          indexedAt: db.prepare("SELECT value FROM meta WHERE key = 'last_index_at'").get()?.value ?? null,
        };
      }
      case 'hq_release_status': {
        const { releaseStatus } = await import('./release-status.mjs');
        return releaseStatus({ root });
      }
      case 'team_state':
      case 'route_model':
      case 'wake_seat': {
        return await callTeamToolFn(name, args);
      }
      default:
        throw Object.assign(new Error(`unknown tool: ${name}`), { code: -32602 });
    }
  }

  async function handle(message) {
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      return rpcError(message?.id ?? null, -32600, 'Invalid Request');
    }
    const { id, method, params } = message;
    if (method === 'initialize') {
      const requested = params?.protocolVersion;
      const protocolVersion = MCP_SUPPORTED_VERSIONS.includes(requested)
        ? requested
        : MCP_PROTOCOL_VERSION;
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: MCP_SERVER_INFO,
        instructions: MCP_INSTRUCTIONS,
      });
    }
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') return null;
    if (method === 'ping') return rpcResult(id, {});
    if (method === 'tools/list') return rpcResult(id, { tools: TOOLS });
    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments ?? {};
      if (!name) return rpcError(id, -32602, 'Missing tool name');
      try {
        const result = await callTool(name, args);
        return rpcResult(id, textResult(result));
      } catch (error) {
        return rpcResult(id, {
          content: [{ type: 'text', text: `hq: ${error.message}` }],
          isError: true,
        });
      }
    }
    return rpcError(id, -32601, `Method not found: ${method}`);
  }

  return { handle, tools: TOOLS };
}

function findFileRow(db, target, project) {
  const p = String(target ?? '').replace(/\\/g, '/');
  const projectRow = project ? db.prepare('SELECT id FROM projects WHERE name = ?').get(project) : null;
  if (projectRow) {
    const exact = db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND f.path = ?').get(projectRow.id, p);
    if (exact) return exact;
    return db.prepare("SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.project_id = ? AND (f.path LIKE ? OR f.path LIKE ?) ORDER BY length(f.path) LIMIT 1").get(projectRow.id, `%/${p}`, `%${p}`);
  }
  const exact = db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path = ?').get(p);
  if (exact) return exact;
  return db.prepare('SELECT f.*, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE f.path LIKE ? OR f.path LIKE ? ORDER BY length(f.path) LIMIT 1').get(`%/${p}`, `%${p}`);
}

export async function serveStdio({ root, db, input = process.stdin, output = process.stdout }) {
  const server = createMcpServer({ root, db });
  let buffer = '';
  input.setEncoding('utf8');
  for await (const chunk of input) {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        output.write(JSON.stringify(rpcError(null, -32700, 'Parse error')) + '\n');
        continue;
      }
      const response = await server.handle(message);
      if (response) output.write(JSON.stringify(response) + '\n');
    }
  }
  return 0;
}
