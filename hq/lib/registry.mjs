// hq/lib/registry.mjs — workspace project registry.
// projects.json is versioned and human-editable; paths may be relative to the
// workspace root (preferred) or absolute for external repositories.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, isAbsolute, basename } from 'node:path';
import { toPosix, canonicalJson, nowISO, safeJsonParse } from './util.mjs';

export const PROJECTS_FILE = 'projects.json';
export const HQ_DIR = '.hq';
export const CONFIG_FILE = '.hq/config.json';

export function defaultProjects() {
  return { version: 1, projects: [] };
}

export function defaultConfig() {
  return {
    version: 1,
    db: '.hq/index.db',
    maxFileBytes: 1_500_000,
    lakeCommits: 500,
    ignores: [],
    mcp: { enabled: true },
    performance: {
      profile: 'balanced',
      weights: { speed: 1, quality: 1, recency: 0.5, cost: 1 },
      priorities: {
        search: 5, find: 5, context: 5, brief: 3, index: 3,
        wiki: 2, lint: 1, mcp: 5, ask: 4, verify: 3,
      },
      budgets: {
        search: 250, find: 250, context: 600, brief: 300,
        index: 15000, wiki: 20000, lint: 1000, mcp: 600, ask: 800, verify: 2000,
      },
      candidates: {
        contextFiles: 40, contextSymbols: 40, contextPaths: 20, contextRecent: 10,
      },
      limits: {
        search: 20, find: 30, contextMaxFiles: 24, contextBudgetTokens: 6000,
        wikiMaxFilePages: 5000, briefMaxBytes: 6000, lintMaxFindings: 200,
      },
    },
  };
}

export function loadProjects(root) {
  const p = join(root, PROJECTS_FILE);
  if (!existsSync(p)) return defaultProjects();
  const parsed = safeJsonParse(readFileSync(p, 'utf8'), null);
  if (!parsed || !Array.isArray(parsed.projects)) return defaultProjects();
  return { version: 1, projects: parsed.projects };
}

export function saveProjects(root, data) {
  const p = join(root, PROJECTS_FILE);
  writeFileSync(p, canonicalJson({ version: 1, projects: data.projects || [] }), 'utf8');
}

export function deepMerge(target, source) {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[k] = deepMerge(tv, sv);
    } else {
      out[k] = sv;
    }
  }
  return out;
}

export function loadConfig(root) {
  const p = join(root, CONFIG_FILE);
  if (!existsSync(p)) return defaultConfig();
  const parsed = safeJsonParse(readFileSync(p, 'utf8'), null);
  return deepMerge(defaultConfig(), parsed || {});
}

export function saveConfig(root, config) {
  mkdirSync(join(root, HQ_DIR), { recursive: true });
  writeFileSync(join(root, CONFIG_FILE), canonicalJson({ ...defaultConfig(), ...config }), 'utf8');
}

export function dbPath(root, config = null) {
  const cfg = config || loadConfig(root);
  const rel = cfg.db || '.hq/index.db';
  return isAbsolute(rel) ? rel : join(root, rel);
}

// Paths inside the workspace are stored relative; external paths absolute.
export function storedPath(root, absPath) {
  const abs = resolve(absPath);
  const rootPosix = toPosix(resolve(root));
  const absPosix = toPosix(abs);
  if (absPosix.toLowerCase() === rootPosix.toLowerCase()) return '.';
  if (absPosix.toLowerCase().startsWith(rootPosix.toLowerCase() + '/'))
    return absPosix.slice(rootPosix.length + 1);
  return abs;
}

export function resolveProjectPath(root, stored) {
  return isAbsolute(stored) ? stored : resolve(root, stored);
}

export function findProject(projects, nameOrPath) {
  const needle = String(nameOrPath).toLowerCase();
  return projects.projects.find((p) => p.name.toLowerCase() === needle)
    || projects.projects.find((p) => p.path.toLowerCase() === needle)
    || projects.projects.find((p) => p.name.toLowerCase().includes(needle))
    || null;
}

export function registerProject(root, { name, path, tags = [] }) {
  const data = loadProjects(root);
  const abs = resolve(root, path);
  if (!existsSync(abs)) throw new Error(`hq: project path does not exist: ${abs}`);
  const existing = data.projects.find((p) => p.name === name || resolveProjectPath(root, p.path) === abs);
  if (existing) {
    existing.name = name || existing.name;
    existing.path = storedPath(root, abs);
    if (tags.length) existing.tags = [...new Set([...(existing.tags || []), ...tags])].sort();
    saveProjects(root, data);
    return existing;
  }
  const entry = { name, path: storedPath(root, abs), tags: [...tags].sort(), addedAt: nowISO() };
  data.projects.push(entry);
  data.projects.sort((a, b) => a.name.localeCompare(b.name));
  saveProjects(root, data);
  return entry;
}

export function unregisterProject(root, name) {
  const data = loadProjects(root);
  const before = data.projects.length;
  data.projects = data.projects.filter((p) => p.name !== name);
  saveProjects(root, data);
  return data.projects.length !== before;
}

// discoverHarvest — direct children of harvest/ that look like projects.
export function discoverHarvest(root, harvestDir = 'harvest') {
  const dir = join(root, harvestDir);
  if (!existsSync(dir)) return [];
  const markers = ['.git', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle'];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const abs = join(dir, entry.name);
    if (markers.some((m) => existsSync(join(abs, m)))) {
      found.push({ name: entry.name, path: storedPath(root, abs) });
    }
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

export function projectSummary(root, entry) {
  const abs = resolveProjectPath(root, entry.path);
  return { ...entry, abs, exists: existsSync(abs) };
}

export function projectsForIndex(root) {
  const { projects } = loadProjects(root);
  return projects.map((p) => projectSummary(root, p)).filter((p) => p.exists);
}

// ---------------------------------------------------------------- classification (HQ-004)

/**
 * classifyProjects — classify each registered project as product code,
 * development tooling, research or archives.
 *
 * Classification sources, in precedence order:
 *   1. projects.json `tags` array (explicit owner tag: product/tooling/research/archives).
 *   2. AGENTS.md four-repo identity table (repos.md table lines 7-12 of AGENTS.md).
 *   3. README/docs keyword hints per project (product/host/roadmap => product;
 *      harness/cli/tooling => tooling; research/evidence/archives => research;
 *      archive/historical => archives).
 *
 * Returns { projects: [{ name, path, tags, classification, rationale, anchors: [file:line] }] }.
 * Read-only: reads projects.json + AGENTS.md + README.md only; never writes.
 */
export function classifyProjects(root, { agiTable = null } = {}) {
  const data = loadProjects(root);
  const agentsPath = join(root, 'AGENTS.md');
  const agentsText = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : '';

  const known = agiTable ?? parseAgentsTable(agentsText);

  const productKeywords = new Set(['host', 'roadmap', 'product', 'android', 'windows']);
  const toolingKeywords = new Set(['harness', 'cli', 'tooling', 'orchestration', 'index']);
  const researchKeywords = new Set(['research', 'evidence', 'campaign', 'experiment']);
  const archivesKeywords = new Set(['archive', 'historical', 'orphaned', 'legacy']);

  const AGENTS_FILE = 'AGENTS.md';

  const classifyOne = (entry) => {
    const tags = Array.isArray(entry.tags) ? entry.tags.map(String).map((t) => t.toLowerCase()) : [];
    const anchors = [];
    let classification = null;
    let rationale = '';

    const identity = known.find((k) => {
      const local = k.local.toLowerCase();
      const path = entry.path.toLowerCase();
      return local === path
        || (local === 'repos_hq' && path === '.' && entry.name === 'repos-hq')
        || (local === '.' && path === 'repos_hq' && entry.name === 'repos-hq');
    });

    // 1) Explicit owner tags take precedence. projects.json has no stable line
    //    numbers from this module, so anchors cite the file only.
    for (const t of tags) {
      if (t === 'product') { classification = 'product code'; rationale = `owner tag '${t}' in ${PROJECTS_FILE}`; anchors.push(`${PROJECTS_FILE}`); break; }
      if (t === 'tooling') { classification = 'development tooling'; rationale = `owner tag '${t}' in ${PROJECTS_FILE}`; anchors.push(`${PROJECTS_FILE}`); break; }
      if (t === 'research') { classification = 'research'; rationale = `owner tag '${t}' in ${PROJECTS_FILE}`; anchors.push(`${PROJECTS_FILE}`); break; }
      if (t === 'archives') { classification = 'archives'; rationale = `owner tag '${t}' in ${PROJECTS_FILE}`; anchors.push(`${PROJECTS_FILE}`); break; }
    }

    // 2) AGENTS.md four-repo identity table.
    if (!classification && identity) {
      const auth = String(identity.authority || '');
      if (/shared.*index|graph|semantic|context|orchestration|wiki|work orders|development headquarters/i.test(auth)) {
        classification = 'development tooling';
        rationale = `AGENTS.md four-repo table (${AGENTS_FILE}:${identity.line}) classifies ${entry.name} as shared development tooling: ${auth}`;
        anchors.push(`${AGENTS_FILE}:${identity.line}`);
      } else if (/host|android|product|roadmap|current product/i.test(auth)) {
        classification = 'product code';
        rationale = `AGENTS.md four-repo table (${AGENTS_FILE}:${identity.line}) classifies ${entry.name} as product code: ${auth}`;
        anchors.push(`${AGENTS_FILE}:${identity.line}`);
      } else if (/research|evidence|archive|historical/i.test(auth)) {
        classification = 'research';
        rationale = `AGENTS.md four-repo table (${AGENTS_FILE}:${identity.line}) classifies ${entry.name} as research: ${auth}`;
        anchors.push(`${AGENTS_FILE}:${identity.line}`);
      }
    }

    // 3) README keyword hints.
    if (!classification) {
      const readme = readmeText(root, entry);
      const lower = readme.toLowerCase();
      if (someKeyword(lower, productKeywords)) {
        classification = 'product code';
        rationale = `README keyword hints (host/roadmap/product/Android/Windows) in ${readmePath(root, entry)}`;
        anchors.push(`${readmePath(root, entry)}`);
      } else if (someKeyword(lower, toolingKeywords)) {
        classification = 'development tooling';
        rationale = `README keyword hints (harness/cli/tooling/index) in ${readmePath(root, entry)}`;
        anchors.push(`${readmePath(root, entry)}`);
      } else if (someKeyword(lower, researchKeywords)) {
        classification = 'research';
        rationale = `README keyword hints (research/evidence/campaign/experiment) in ${readmePath(root, entry)}`;
        anchors.push(`${readmePath(root, entry)}`);
      } else if (someKeyword(lower, archivesKeywords)) {
        classification = 'archives';
        rationale = `README keyword hints (archive/historical/orphaned/legacy) in ${readmePath(root, entry)}`;
        anchors.push(`${readmePath(root, entry)}`);
      }
    }

    if (!classification) {
      classification = 'unclassified';
      rationale = `no explicit tag, AGENTS.md identity signal or README keyword match for ${entry.name}`;
    }

    return { name: entry.name, path: entry.path, tags: entry.tags || [], classification, rationale, anchors };
  };

  return { projects: data.projects.map(classifyOne) };
}

function someKeyword(lower, set) { return [...set].some((k) => lower.includes(k)); }

function parseAgentsTable(text) {
  const rows = [];
  const lines = String(text).split(/\r?\n/);
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\|/.test(line) && /repository/i.test(line)) { inTable = true; continue; }
    if (inTable && /^\s*\|/.test(line) && /^\s*\|[\s]*-/.test(line)) continue;
    if (inTable && /^\s*\|/.test(line)) {
      const cells = line.split('|').map((c) => c.trim().replace(/`/g, '')).filter(Boolean);
      if (cells.length >= 3) {
        rows.push({ repo: cells[0], local: cells[1], authority: cells[2], line: i + 1 });
      }
      continue;
    }
    if (inTable && !/^\s*\|/.test(line)) break;
  }
  return rows;
}

function readmeText(root, entry) {
  const abs = resolveProjectPath(root, entry.path);
  for (const cand of ['README.md', 'README', 'readme.md']) {
    const p = join(abs, cand);
    if (existsSync(p)) {
      try { return readFileSync(p, 'utf8'); } catch { return ''; }
    }
  }
  return '';
}

function readmePath(root, entry) {
  const abs = resolveProjectPath(root, entry.path);
  return relativeRootPath(root, join(abs, 'README.md'));
}

function relativeRootPath(root, abs) {
  const r = toPosix(resolve(root));
  const a = toPosix(abs);
  if (a.startsWith(r + '/')) return a.slice(r.length + 1);
  return a;
}
