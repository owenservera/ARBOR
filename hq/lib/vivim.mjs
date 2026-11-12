// hq/lib/vivim.mjs — VIVIM feed alignment (hq.vivim-alignment/1).
// Read-only projection of a registered VIVIM space into HQ. Never writes to the
// space, never touches the network, never performs provider actions.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { sha256 } from './util.mjs';
import { userTerm } from './nomenclature.mjs';
import { transaction, getMeta, setMeta } from './schema.mjs';

const SCHEMA = 'hq.vivim-alignment/1';
const MAX_STRING = 2000;
// Only real credential shapes are redacted. Plain words such as "cookie" or
// "token" in policy prose must survive: over-redaction destroys the feed.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\b(?:api[_-]?key|password|passwd|secret|token|cookie|authorization)\s*[:=]\s*\S{8,}/i,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
];
const GOALS_CAP = 12;
const DRIFT_MAX_REASONS = 40;
const MARKDOWN_MAX_BYTES = 4000;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'for',
  'from', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'may', 'might', 'must', 'my', 'no', 'not',
  'of', 'on', 'or', 'our', 'ours', 'over', 'she', 'should', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'under', 'until', 'up', 'us', 'was', 'we', 'were', 'will', 'with', 'would',
  'you', 'your', 'yours',
]);

const JSON_ROLES = [
  { role: 'roadmap', rel: 'docs/roadmap.json', required: true },
  { role: 'capabilities', rel: 'docs/capabilities/atomic-registry.json', required: true },
  { role: 'crosswalk', rel: 'docs/capabilities/journey-capability-crosswalk.v1.json', required: false },
  { role: 'criticality', rel: 'docs/capabilities/criticality.json', required: false },
  { role: 'routes', rel: 'docs/capabilities/context-routes.json', required: false },
  { role: 'journey', rel: 'docs/ux/USER-JOURNEY-ACTIVATION-GRAPH.v1.json', required: false },
  { role: 'gaps', rel: 'docs/ux/ACTIVATION-GAPS.v1.json', required: false },
  { role: 'catalog', rel: 'docs/capabilities/source-file-catalog.json', required: false },
];

function cleanString(value) {
  let s = String(value ?? '');
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(s)) { s = '[redacted]'; break; }
  }
  if (s.length > MAX_STRING) s = s.slice(0, MAX_STRING);
  return s;
}

function projectAbsPath(root, project) {
  if (project && project.abs) return resolve(String(project.abs));
  const path = project && project.path ? String(project.path) : '';
  if (!path) return resolve(root || '.', String(project && project.name));
  return isAbsolute(path) ? resolve(path) : resolve(root || '.', path);
}

function readJsonFile(abs) {
  const text = readFileSync(abs, 'utf8');
  return JSON.parse(text);
}export function findVivimSpace({ root = '.', projects = [] } = {}) {
  const qualifiers = [];
  for (const project of projects) {
    if (!project || !project.name) continue;
    const abs = projectAbsPath(root, project);
    const roadmap = existsSync(join(abs, 'docs', 'roadmap.json'));
    const capabilities = existsSync(join(abs, 'docs', 'capabilities', 'atomic-registry.json'));
    if (roadmap && capabilities) qualifiers.push({ name: String(project.name), abs });
  }
  if (!qualifiers.length) return null;
  qualifiers.sort((a, b) => a.name.localeCompare(b.name));
  return qualifiers[0];
}

function boundPayload(obj) {
  // Fixed literal key order; JSON.stringify preserves insertion order.
  return JSON.stringify(obj);
}

export function syncVivim(db, { root = '.', projects = [], now = null } = {}) {
  const space = findVivimSpace({ root, projects });
  if (!space) return { ok: false, error: 'No VIVIM space registered.' };

  const abs = space.abs;
  const syncedAt = now ? new Date(now).toISOString() : new Date().toISOString();
  const sources = [];
  const roles = {};
  const counts = { goal: 0, phase: 0, capability: 0, requirement: 0, task: 0, journey: 0, gap: 0, route: 0 };
  let skipped = 0;

  let roadmap = null;
  let capabilities = null;
  let crosswalk = null;
  let criticality = null;
  let routes = null;
  let journey = null;
  let gaps = null;
  let catalog = null;
  let goalsText = null;

  try {
    for (const { role, rel, required } of JSON_ROLES) {
      const absPath = join(abs, rel);
      let text;
      try { text = readFileSync(absPath, 'utf8'); } catch {
        if (required) throw new Error(`missing required registry: ${rel}`);
        continue;
      }
      let parsed;
      try { parsed = JSON.parse(text); } catch {
        if (required) throw new Error(`unparseable required registry: ${rel}`);
        continue;
      }
      roles[role] = parsed;
      sources.push({ role, path: rel, sha256: sha256(text), bytes: Buffer.byteLength(text, 'utf8') });
    }
    roadmap = roles.roadmap;
    capabilities = roles.capabilities;
    crosswalk = roles.crosswalk;
    criticality = roles.criticality;
    routes = roles.routes;
    journey = roles.journey;
    gaps = roles.gaps;
    catalog = roles.catalog;
    const goalsAbs = join(abs, 'GOALS.md');
    if (existsSync(goalsAbs)) goalsText = readFileSync(goalsAbs, 'utf8');
  } catch (error) {
    // Required registry absent or unparseable is fatal: no writes.
    return { ok: false, error: error.message };
  }

  const records = []; // {kind,id,title,status,priority,parent,links,payload}

  const add = (kind, id, title, status, priority, parent, links, payloadObj) => {
    records.push({ kind, id, title, status, priority, parent, links, payload: boundPayload(payloadObj) });
  };

  // ---- phase ----
  try {
    const activePhase = roadmap && roadmap.activePhase;
    if (activePhase && activePhase.id) {
      const id = String(activePhase.id);
      const title = cleanString(activePhase.title || id);
      const payload = {
        id, status: activePhase.status, source: activePhase.source,
        runtimeExecution: activePhase.runtimeExecution,
        allowed: activePhase.allowed, blocked: activePhase.blocked,
        release: activePhase.release,
      };
      add('phase', id, title, activePhase.status, null, null,
        JSON.stringify(Array.isArray(activePhase.roadmap) ? activePhase.roadmap : []), payload);
      counts.phase++;
    }
  } catch { skipped++; }

  // ---- goals from roadmap milestones (array or {id: milestone} object) ----
  const milestoneList = [];
  if (roadmap && Array.isArray(roadmap.milestones)) {
    for (const m of roadmap.milestones) milestoneList.push(m);
  } else if (roadmap && roadmap.milestones && typeof roadmap.milestones === 'object') {
    for (const [key, value] of Object.entries(roadmap.milestones)) {
      milestoneList.push({ id: key, ...(value && typeof value === 'object' ? value : {}) });
    }
  }
  if (milestoneList.length) {
    for (const m of milestoneList) {
      try {
        if (!m || !m.id) { skipped++; continue; }
        const id = `goal-${m.id}`;
        const title = cleanString(m.title || m.id);
        const payload = {
          id: String(m.id), status: m.status, source: 'roadmap',
          entry_criteria: m.entry_criteria, acceptance: m.acceptance,
          required_items: m.required_items,
        };
        add('goal', id, title, m.status, null, null, null, payload);
        counts.goal++;
      } catch { skipped++; }
    }
  }

  // ---- goals from GOALS.md headings ----
  if (goalsText) {
    const glines = goalsText.split(/\r?\n/);
    let goalCount = 0;
    for (let i = 0; i < glines.length && goalCount < GOALS_CAP; i++) {
      const match = glines[i].match(/^##\s+(.+)/);
      if (!match) continue;
      try {
        goalCount++;
        const title = cleanString(match[1]);
        const paras = [];
        let j = i + 1;
        // Skip the blank line(s) that follow a heading, then take the paragraph.
        while (j < glines.length && glines[j].trim() === '') j++;
        while (j < glines.length) {
          const line = glines[j];
          if (line.trim() === '' || /^#{1,6}\s/.test(line)) break;
          paras.push(line.trim());
          j++;
        }
        const payload = { id: `goals-md-${String(goalCount).padStart(2, '0')}`, title, statement: cleanString(paras.join(' ')), source: `GOALS.md:${i + 1}` };
        add('goal', payload.id, title, null, null, null, null, payload);
        counts.goal++;
      } catch { skipped++; }
    }
  }

  // ---- capabilities ----
  const capItems = capabilities && Array.isArray(capabilities.items) ? capabilities.items : [];
  for (const item of capItems) {
    try {
      if (!item || !item.id) { skipped++; continue; }
      const id = String(item.id);
      const title = cleanString(item.title);
      const status = item.decisionState;
      const priority = item.productPriority;
      const links = Array.isArray(item.links && item.links.roadmap)
        ? item.links.roadmap.filter((x) => x != null).map(String).sort()
        : [];
      const acceptance = cleanString(item.acceptance);
      const spec = item.spec != null ? String(item.spec) : null;
      const sourceFiles = Array.isArray(item.links && item.links.existingSourceCandidates)
        ? item.links.existingSourceCandidates.map((c) => c && c.path).filter(Boolean).map(String).sort()
        : [];
      const symbols = Array.isArray(item.links && item.links.verifiedSymbols)
        ? item.links.verifiedSymbols.map((s) => s && s.name).filter(Boolean).map(String).sort()
        : [];
      const payload = {
        id, title, kind: item.kind, productPriority: item.productPriority,
        executionWave: item.executionWave, decisionState: item.decisionState,
        spec, acceptance, requirement: acceptance,
        roadmap: links, sourceFiles, symbols,
        sourceResolution: (item.links && item.links.sourceResolution != null)
          ? String(item.links.sourceResolution) : null,
        runtimeState: 'not_observed',
      };
      add('capability', id, title, status, priority, null, JSON.stringify(links), payload);
      counts.capability++;
    } catch { skipped++; }
  }

  // ---- requirements ----
  for (const item of capItems) {
    try {
      if (!item || !item.id) { skipped++; continue; }
      const acceptance = item.acceptance;
      if (acceptance == null || String(acceptance).trim() === '') { skipped++; continue; }
      const id = `${item.id}#acceptance`;
      const title = cleanString(item.title);
      const spec = item.spec != null ? String(item.spec) : null;
      const payload = { id, parent: String(item.id), spec, acceptance: cleanString(acceptance) };
      add('requirement', id, title, null, null, String(item.id), JSON.stringify([spec].filter(Boolean)), payload);
      counts.requirement++;
    } catch { skipped++; }
  }

  // ---- tasks from roadmap items ----
  const items = roadmap && Array.isArray(roadmap.items) ? roadmap.items : [];
  for (const it of items) {
    try {
      if (!it || !it.id) { skipped++; continue; }
      const id = String(it.id);
      const title = cleanString(it.title);
      const status = it.status;
      const owner = cleanString(it.owner);
      const refs = Array.isArray(it.refs) ? it.refs.filter((x) => x != null).map(String).sort() : [];
      const dependsOn = Array.isArray(it.depends_on) ? it.depends_on.filter((x) => x != null).map(String).sort() : [];
      const notes = cleanString(it.notes);
      const payload = { id, title, status, owner, refs, depends_on: dependsOn, notes };
      if (it.decisionState != null) payload.decisionState = it.decisionState;
      add('task', id, title, status, null, null, JSON.stringify(dependsOn), payload);
      counts.task++;
    } catch { skipped++; }
  }

  // ---- journeys: steps array or {id: step} object, ordered by phases/groups ----
  const stepInfo = {};
  if (journey && Array.isArray(journey.steps)) {
    for (const step of journey.steps) {
      if (step && step.id) stepInfo[String(step.id)] = step;
    }
  } else if (journey && journey.steps && typeof journey.steps === 'object') {
    for (const [key, value] of Object.entries(journey.steps)) stepInfo[key] = value;
  }

  const stepOrder = [];
  const stepSeen = new Set();
  const stepPlacement = new Map();
  const pushStep = (rawId) => {
    const id = String(rawId);
    if (stepSeen.has(id)) return;
    stepSeen.add(id);
    stepOrder.push(id);
  };
  if (journey && Array.isArray(journey.phases)) {
    for (const phase of journey.phases) {
      const phaseId = phase && phase.id;
      if (!phase || !Array.isArray(phase.groups)) continue;
      for (const group of phase.groups) {
        const groupId = group && group.id;
        const stepIds = Array.isArray(group && group.step_ids) ? group.step_ids : [];
        for (const stepId of stepIds) {
          if (!stepId) { skipped++; continue; }
          stepPlacement.set(String(stepId), { phase: phaseId, subphase: groupId });
          pushStep(stepId);
        }
      }
    }
  }
  for (const id of Object.keys(stepInfo).sort()) pushStep(id);

  // Crosswalk edges (journey -> capability / roadmap task). The crosswalk is
  // source-owned discovery evidence (its matchPolicy is lexical, never an
  // execution proof), so native ids land in the journey payload verbatim;
  // nothing is promoted or re-derived here.
  const crosswalkByJourney = new Map();
  if (crosswalk && Array.isArray(crosswalk.entries)) {
    for (const entry of crosswalk.entries) {
      try {
        const journeyId = entry && entry.journeyId ? String(entry.journeyId) : null;
        if (!journeyId || !stepSeen.has(journeyId)) { skipped++; continue; }
        const uniqueSorted = (list) => [...new Set(
          (Array.isArray(list) ? list : []).filter((x) => x != null).map(String),
        )].sort();
        crosswalkByJourney.set(journeyId, {
          capabilities: uniqueSorted(entry.atomicCandidateIds),
          strongerCapabilities: uniqueSorted(entry.strongerSymbolCandidateIds),
          tasks: uniqueSorted(entry.roadmapTaskIds),
        });
      } catch { skipped++; }
    }
  }
  let crosswalkJourneys = 0;
  let crosswalkCapabilityLinks = 0;
  let crosswalkTaskLinks = 0;

  for (const id of stepOrder) {
    try {
      const info = stepInfo[id] || {};
      const place = stepPlacement.get(id) || {};
      const title = cleanString(info.title || id);
      const dependsOn = Array.isArray(info.depends_on) ? info.depends_on.filter((x) => x != null).map(String).sort() : [];
      const enables = Array.isArray(info.enables) ? info.enables.filter((x) => x != null).map(String).sort() : [];
      const phaseId = place.phase ?? info.phase ?? null;
      const payload = {
        id, phase: phaseId, subphase: place.subphase ?? info.subphase ?? null, title,
        status: info.status ?? null, code: info.code ?? null,
        activation_gap: info.activation_gap ?? null,
        depends_on: dependsOn,
        enables,
      };
      const edges = crosswalkByJourney.get(id);
      if (edges && (edges.capabilities.length || edges.strongerCapabilities.length || edges.tasks.length)) {
        // Only non-empty edge lists land in the payload, so a journey without
        // a crosswalk entry (or with an all-empty one) keeps the exact
        // pre-crosswalk payload shape. Only journeys that gained at least one
        // edge are counted as crosswalk-linked.
        if (edges.capabilities.length) payload.capabilities = edges.capabilities;
        if (edges.strongerCapabilities.length) payload.strongerCapabilities = edges.strongerCapabilities;
        if (edges.tasks.length) payload.tasks = edges.tasks;
        crosswalkJourneys++;
        crosswalkCapabilityLinks += edges.capabilities.length + edges.strongerCapabilities.length;
        crosswalkTaskLinks += edges.tasks.length;
      }
      add('journey', id, title, info.status ?? null, null, phaseId, JSON.stringify(dependsOn), payload);
      counts.journey++;
    } catch { skipped++; }
  }

  // ---- gaps ----
  const gapItems = gaps && Array.isArray(gaps.gaps) ? gaps.gaps : [];
  for (const g of gapItems) {
    try {
      if (!g || !g.id) { skipped++; continue; }
      const id = String(g.id);
      const title = cleanString(g.title);
      const priority = g.priority;
      const classification = g.classification;
      const evidence = g.evidence && typeof g.evidence === 'object'
        ? { observation: cleanString(g.evidence.observation), producer: g.evidence.producer, consumer: g.evidence.consumer }
        : { observation: cleanString(g.evidence) };
      const affectedSteps = Array.isArray(g.affected_steps) ? g.affected_steps.filter((x) => x != null).map(String).sort() : [];
      const payload = {
        id, priority, title, classification, evidence,
        recommended_fix: g.recommended_fix,
        affected_steps: affectedSteps, confidence: g.confidence, release_gate: g.release_gate,
      };
      add('gap', id, title, null, priority, affectedSteps.length ? affectedSteps[0] : null, JSON.stringify(affectedSteps), payload);
      counts.gap++;
    } catch { skipped++; }
  }

  // ---- routes ----
  const routesMap = routes && routes.routes ? routes.routes : {};
  for (const [routeId, route] of Object.entries(routesMap)) {
    try {
      if (!routeId) { skipped++; continue; }
      const id = String(routeId);
      const keywords = Array.isArray(route.keywords) ? route.keywords.filter(Boolean).map(String).sort() : [];
      const docs = Array.isArray(route.docs) ? route.docs.filter(Boolean).map(String).sort() : [];
      const skills = Array.isArray(route.skills) ? route.skills.filter(Boolean).map(String).sort() : [];
      const files = Array.isArray(route.files) ? route.files.filter(Boolean).map(String).sort() : [];
      const payload = { id, keywords, docs, skills, files };
      add('route', id, id, null, null, null, JSON.stringify(keywords), payload);
      counts.route++;
    } catch { skipped++; }
  }

  const digest = sourceDigest(sources);

  // The owning space is stamped on every record (project_id) so projections
  // can separate records with colliding native ids across spaces. Best-effort:
  // a space not registered as an HQ project keeps NULL, as before.
  let spaceProjectId = null;
  try {
    const row = db.prepare('SELECT id FROM projects WHERE lower(name) = lower(?)').get(space.name);
    if (row && row.id != null) spaceProjectId = Number(row.id);
  } catch { spaceProjectId = null; }

  // All writes inside a single transaction: full replace for idempotency.
  transaction(db, () => {
    db.prepare('DELETE FROM vivim_records').run();
    const insert = db.prepare(`
      INSERT INTO vivim_records(kind, id, project_id, title, status, priority, parent, links, payload, digest, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of records) {
      insert.run(
        r.kind, r.id, spaceProjectId, String(r.title ?? ''), r.status ?? null, r.priority ?? null,
        r.parent ?? null, r.links ?? null, r.payload, sha256(r.payload), syncedAt,
      );
    }
  });

  setMeta(db, 'vivim_space', space.name);
  setMeta(db, 'vivim_space_root', abs);
  setMeta(db, 'vivim_synced_at', syncedAt);
  setMeta(db, 'vivim_source_digest', digest);
  setMeta(db, 'vivim_source_files', JSON.stringify(sources));
  setMeta(db, 'vivim_counts', JSON.stringify(counts));

  return {
    ok: true,
    space: { name: space.name, root: abs },
    counts,
    crosswalk: { journeys: crosswalkJourneys, capabilityLinks: crosswalkCapabilityLinks, taskLinks: crosswalkTaskLinks },
    digest,
    sources,
  };
}

function sourceDigest(sources) {
  const lines = sources
    .slice()
    .sort((a, b) => a.role.localeCompare(b.role))
    .map((s) => `${s.role}\t${s.sha256}`)
    .join('\n');
  return sha256(lines);
}

export function vivimTablesPresent(db) {
  try {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vivim_records'").get();
    return Boolean(row);
  } catch {
    return false;
  }
}

function readAllRows(db) {
  const rows = db.prepare('SELECT kind, id, title, status, priority, parent, links, payload, digest, synced_at FROM vivim_records ORDER BY kind, id').all();
  const byKind = {};
  for (const row of rows) {
    (byKind[row.kind] = byKind[row.kind] || []).push(row);
  }
  return byKind;
}

function parsePayload(row) {
  try { return JSON.parse(row.payload); } catch { return null; }
}

export function readAlignment(db, { detail = 'summary' } = {}) {
  if (!vivimTablesPresent(db)) return null;
  const syncedAt = getMeta(db, 'vivim_synced_at');
  const digest = getMeta(db, 'vivim_source_digest');
  if (digest == null) return null;
  const spaceName = getMeta(db, 'vivim_space');
  const spaceRoot = getMeta(db, 'vivim_space_root');

  const byKind = readAllRows(db);
  const taskRows = byKind.task || [];
  const capabilityRows = byKind.capability || [];
  const journeyRows = byKind.journey || [];
  const gapRows = byKind.gap || [];
  const phaseRows = byKind.phase || [];
  const goalRows = byKind.goal || [];
  const requirementRows = byKind.requirement || [];
  const routeRows = byKind.route || [];

  const taskIdSet = new Set();
  for (const row of taskRows) taskIdSet.add(row.id);
  const journeyIdSet = new Set();
  for (const row of journeyRows) journeyIdSet.add(row.id);

  // capability links -> tasks
  const capabilityLinks = new Map(); // capId -> taskIds (existing)
  const dangling = []; // {capability, task}
  for (const row of capabilityRows) {
    const payload = parsePayload(row);
    const links = payload && Array.isArray(payload.roadmap) ? payload.roadmap : [];
    const existing = [];
    for (const t of links) {
      if (taskIdSet.has(t)) existing.push(t);
      else dangling.push({ capability: row.id, task: t });
    }
    capabilityLinks.set(row.id, existing);
  }

  const linkedCapabilityIds = new Set();
  for (const [capId, tasks] of capabilityLinks) {
    if (tasks.length) linkedCapabilityIds.add(capId);
  }
  const unlinkedCapabilities = [];
  for (const row of capabilityRows) {
    if (!linkedCapabilityIds.has(row.id)) unlinkedCapabilities.push(row.id);
  }

  const linkedTaskIds = new Set();
  for (const tasks of capabilityLinks.values()) {
    for (const t of tasks) linkedTaskIds.add(t);
  }
  const tasksWithoutCapability = [];
  for (const row of taskRows) {
    if (!linkedTaskIds.has(row.id)) tasksWithoutCapability.push(row.id);
  }

  const p0WithoutTask = [];
  for (const row of capabilityRows) {
    const payload = parsePayload(row);
    const priority = payload && payload.productPriority;
    if (priority === 'P0' && !linkedCapabilityIds.has(row.id)) p0WithoutTask.push(row.id);
  }

  const gapsWithoutSteps = [];
  for (const row of gapRows) {
    const payload = parsePayload(row);
    const steps = payload && Array.isArray(payload.affected_steps) ? payload.affected_steps : [];
    if (steps.length === 0) { gapsWithoutSteps.push(row.id); continue; }
    let hasExisting = false;
    for (const s of steps) { if (journeyIdSet.has(s)) { hasExisting = true; break; } }
    if (!hasExisting) gapsWithoutSteps.push(row.id);
  }

  const sortAsc = (arr) => [...arr].sort((a, b) => String(a).localeCompare(String(b)));

  // coverage from sourceFiles
  let capabilitiesWithSource = 0;
  let capabilitiesWithoutSource = 0;
  for (const row of capabilityRows) {
    const payload = parsePayload(row);
    const files = payload && Array.isArray(payload.sourceFiles) ? payload.sourceFiles : [];
    if (files.length) capabilitiesWithSource++; else capabilitiesWithoutSource++;
  }

  const phaseRow = phaseRows[0] || null;
  const phase = phaseRow
    ? { id: phaseRow.id, status: phaseRow.status, allowed: phaseRow.payload ? (parsePayload(phaseRow) || {}).allowed : null, blocked: (parsePayload(phaseRow) || {}).blocked, release: (parsePayload(phaseRow) || {}).release }
    : null;

  const goals = [];
  for (const row of goalRows) {
    const payload = parsePayload(row) || {};
    goals.push({ id: row.id, title: row.title, statement: payload.statement || '', source: payload.source || '' });
  }

  const alignment = {
    linkedCapabilities: sortAsc([...linkedCapabilityIds]),
    unlinkedCapabilities: sortAsc(unlinkedCapabilities),
    p0WithoutTask: sortAsc(p0WithoutTask),
    danglingRoadmapRefs: dangling.sort((a, b) => a.capability.localeCompare(b.capability) || a.task.localeCompare(b.task)),
    tasksWithoutCapability: sortAsc(tasksWithoutCapability),
    gapsWithoutSteps: sortAsc(gapsWithoutSteps),
    coverage: { capabilitiesWithSource, capabilitiesWithoutSource },
  };

  const result = {
    schema: SCHEMA,
    syncedAt,
    space: { name: spaceName, root: spaceRoot },
    digest,
    phase,
    goals,
    counts: {
      capabilities: {
        total: capabilityRows.length,
        byPriority: groupCount(capabilityRows, (r) => (parsePayload(r) || {}).productPriority),
        byDecisionState: groupCount(capabilityRows, (r) => (parsePayload(r) || {}).decisionState),
        byKind: groupCount(capabilityRows, (r) => (parsePayload(r) || {}).kind),
      },
      tasks: { total: taskRows.length, byStatus: groupCount(taskRows, (r) => r.status) },
      journeys: { total: journeyRows.length, byStatus: groupCount(journeyRows, (r) => r.status) },
      gaps: { total: gapRows.length, byPriority: groupCount(gapRows, (r) => r.priority) },
      requirements: { total: requirementRows.length },
      routes: { total: routeRows.length },
    },
    alignment,
  };

  if (detail === 'full') {
    result.capabilities = capabilityRows.map((r) => parsePayload(r)).filter(Boolean);
    result.tasks = taskRows.map((r) => parsePayload(r)).filter(Boolean);
  }

  return result;
}

function groupCount(rows, keyOf) {
  const out = {};
  for (const row of rows) {
    const key = keyOf(row);
    const k = key == null ? 'unknown' : String(key);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function tokenizeTask(text) {
  const raw = String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return [...new Set(raw)];
}

function scoreCapability(capTokens, taskTokens, acceptance, spec) {
  let score = 0;
  for (const t of taskTokens) {
    if (capTokens.has(t)) score += 3;
  }
  const accTokens = tokenizeSet(acceptance);
  for (const t of taskTokens) {
    if (accTokens.has(t)) score += 1;
  }
  const specTokens = tokenizeSet(spec);
  for (const t of taskTokens) {
    if (specTokens.has(t)) score += 1;
  }
  return score;
}

function tokenizeSet(text) {
  return new Set(tokenizeTask(text));
}

function sharesToken(title, taskTokens) {
  const t = tokenizeSet(title);
  for (const x of taskTokens) if (t.has(x)) return true;
  return false;
}

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };

export function alignmentForTask(db, task, { limit = 8 } = {}) {
  let phase = null;
  if (!vivimTablesPresent(db)) {
    return { phase, capabilities: [], tasks: [], gaps: [] };
  }
  const digest = getMeta(db, 'vivim_source_digest');
  if (digest != null) {
    const phaseRow = db.prepare('SELECT id, status, payload FROM vivim_records WHERE kind = ? ORDER BY id LIMIT 1').get('phase');
    if (phaseRow) {
      const payload = parsePayload({ payload: phaseRow.payload }) || {};
      phase = { id: phaseRow.id, status: phaseRow.status ?? payload.status ?? null, allowed: payload.allowed, blocked: payload.blocked, release: payload.release };
    }
  }

  const tokens = tokenizeTask(task);
  const byKind = readAllRows(db);
  const capabilityRows = byKind.capability || [];
  const gapRows = byKind.gap || [];
  const taskRows = byKind.task || [];

  // capabilities scoring
  const scored = [];
  for (const row of capabilityRows) {
    const payload = parsePayload(row) || {};
    const capTokens = tokenizeSet(payload.title || row.title);
    const score = scoreCapability(capTokens, tokens, payload.acceptance || '', payload.spec || '');
    if (score > 0) scored.push({ id: row.id, score });
  }
  scored.sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
  const capabilities = scored.slice(0, Number(limit) || 8).map((s) => s.id);

  // gaps: 3 highest-priority whose title shares a token
  const gapMatches = [];
  for (const row of gapRows) {
    const payload = parsePayload(row) || {};
    if (sharesToken(payload.title || row.title, tokens)) gapMatches.push(row.id);
  }
  gapMatches.sort((a, b) => {
    const pa = PRIORITY_ORDER[((parsePayload(byKind.gap.find((r) => r.id === a)) || {}).priority)] ?? 99;
    const pb = PRIORITY_ORDER[((parsePayload(byKind.gap.find((r) => r.id === b)) || {}).priority)] ?? 99;
    return pa - pb || String(a).localeCompare(String(b));
  });
  const gaps = gapMatches.slice(0, 3);

  // tasks whose title shares a token (max 5)
  const taskMatches = [];
  for (const row of taskRows) {
    const payload = parsePayload(row) || {};
    if (sharesToken(payload.title || row.title, tokens)) taskMatches.push(row.id);
  }
  taskMatches.sort((a, b) => String(a).localeCompare(String(b)));
  const tasks = taskMatches.slice(0, 5);

  const capById = new Map(capabilityRows.map((row) => [row.id, row]));
  const gapById = new Map(gapRows.map((row) => [row.id, row]));
  const taskById = new Map(taskRows.map((row) => [row.id, row]));
  const detailOf = (map, id) => {
    const row = map.get(id);
    const payload = row ? (parsePayload(row) || {}) : {};
    return {
      id,
      title: row ? (row.title || payload.title || id) : id,
      priority: row ? (row.priority || payload.productPriority || null) : null,
      status: row ? (row.status || payload.status || null) : null,
    };
  };
  const details = {
    capabilities: capabilities.map((id) => detailOf(capById, id)),
    gaps: gaps.map((id) => detailOf(gapById, id)),
    tasks: tasks.map((id) => detailOf(taskById, id)),
  };

  // blank task -> empty arrays
  if (!tokens.length) {
    return { phase, capabilities: [], tasks: [], gaps: [], details: { capabilities: [], gaps: [], tasks: [] } };
  }
  return { phase, capabilities, tasks, gaps, details };
}

// ---------------------------------------------------------------------------
// explain — one native id with its joined relationships (read-only)
// ---------------------------------------------------------------------------

function parsePayloadOf(row) {
  try { return JSON.parse(row.payload); } catch { return {}; }
}

// Capability source candidates -> the HQ code index. Exact path match only:
// a reference either resolves to an indexed file or is reported unresolved,
// never guessed. Verified symbol names are matched inside the resolved files.
function joinCapabilityCode(db, payload) {
  const out = { files: [], symbols: [], unresolved: [] };
  const sourceFiles = payload && Array.isArray(payload.sourceFiles) ? payload.sourceFiles : [];
  const names = payload && Array.isArray(payload.symbols) ? payload.symbols.map(String) : [];
  const fileStmt = db.prepare(
    'SELECT f.id AS fileId, f.path AS path, p.name AS project FROM files f JOIN projects p ON p.id = f.project_id WHERE lower(f.path) = lower(?) ORDER BY p.name ASC',
  );
  const symStmt = db.prepare(
    'SELECT s.name AS name, s.kind AS kind, s.line AS line, f.path AS path, p.name AS project FROM symbols s JOIN files f ON f.id = s.file_id JOIN projects p ON p.id = f.project_id WHERE f.id = ? AND lower(s.name) = lower(?) ORDER BY s.name ASC, s.line ASC',
  );
  for (const raw of sourceFiles) {
    const ref = String(raw ?? '').trim();
    if (!ref) continue;
    let matches = [];
    try { matches = fileStmt.all(ref); } catch { matches = []; }
    if (!matches.length) { out.unresolved.push(ref); continue; }
    for (const match of matches) {
      out.files.push({ path: match.path, project: match.project });
      for (const name of names) {
        let symbols = [];
        try { symbols = symStmt.all(match.fileId, name); } catch { symbols = []; }
        for (const symbol of symbols) {
          out.symbols.push({ name: symbol.name, kind: symbol.kind, line: symbol.line, path: symbol.path, project: symbol.project });
        }
      }
    }
  }
  out.files.sort((a, b) => a.path.localeCompare(b.path) || a.project.localeCompare(b.project));
  out.symbols.sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0));
  return out;
}

function allVivimRows(db, kind) {
  try { return db.prepare('SELECT * FROM vivim_records WHERE kind = ? ORDER BY id ASC').all(kind); } catch { return []; }
}

/**
 * One native VIVIM id with its relationships joined across the HQ store:
 * requirement -> capability, capability -> requirement/task, journey <->
 * capability/task (crosswalk edges), and capability -> indexed code
 * (source files and verified symbol declarations). Read-only; never throws.
 */
export function explainVivimRecord(db, { id } = {}) {
  const target = String(id ?? '').trim();
  const empty = { schema: 'hq.vivim-explain/2', id: target, records: [], relationships: null };
  if (!target || !vivimTablesPresent(db)) return empty;
  try {
    const rows = db.prepare('SELECT * FROM vivim_records WHERE id = ? ORDER BY kind ASC').all(target);
    if (!rows.length) return empty;
    const records = rows.map((row) => ({
      kind: row.kind, id: row.id, title: row.title ?? null, status: row.status ?? null,
      priority: row.priority ?? null, parent: row.parent ?? null,
      links: safeJsonList(row.links), record: parsePayloadOf(row),
    }));
    const kinds = new Set(records.map((record) => record.kind));
    const relationships = {
      requirements: [], capabilities: [], tasks: [], journeys: [], code: null,
    };

    // requirement -> capability (parent) and capability -> requirements
    if (kinds.has('requirement')) {
      const parent = records.find((record) => record.kind === 'requirement')?.parent;
      if (parent) relationships.capabilities.push(parent);
    }
    if (kinds.has('capability')) {
      let children = [];
      try {
        children = db.prepare("SELECT id FROM vivim_records WHERE kind = 'requirement' AND parent = ? ORDER BY id ASC").all(target);
      } catch { children = []; }
      relationships.requirements = children.map((row) => row.id);
      const payload = records.find((record) => record.kind === 'capability')?.record || {};
      relationships.tasks = Array.isArray(payload.roadmap) ? payload.roadmap.map(String).sort() : [];
    }

    // journey <-> capability/task crosswalk edges, both directions
    const journeys = allVivimRows(db, 'journey');
    if (kinds.has('journey')) {
      const payload = records.find((record) => record.kind === 'journey')?.record || {};
      // Push (never assign): if a native id is ever reused across kinds, the
      // joined edges of every record merge instead of replacing each other.
      relationships.capabilities.push(
        ...((Array.isArray(payload.strongerCapabilities) ? payload.strongerCapabilities : []).map(String)),
        ...((Array.isArray(payload.capabilities) ? payload.capabilities : []).map(String)),
      );
      if (Array.isArray(payload.tasks)) relationships.tasks.push(...payload.tasks.map(String));
    }
    // capability/task -> journeys (reverse crosswalk)
    if (kinds.has('capability') || kinds.has('task')) {
      for (const row of journeys) {
        const payload = parsePayloadOf(row);
        const candidates = new Set([
          ...((Array.isArray(payload.capabilities) ? payload.capabilities : []).map(String)),
          ...((Array.isArray(payload.strongerCapabilities) ? payload.strongerCapabilities : []).map(String)),
        ]);
        const taskIds = Array.isArray(payload.tasks) ? payload.tasks.map(String) : [];
        const stronger = new Set((Array.isArray(payload.strongerCapabilities) ? payload.strongerCapabilities : []).map(String));
        if (kinds.has('capability') && candidates.has(target)) {
          relationships.journeys.push({ id: row.id, stronger: stronger.has(target) });
        } else if (kinds.has('task') && taskIds.includes(target)) {
          relationships.journeys.push({ id: row.id, stronger: false });
        }
      }
    }

    // task -> capabilities (roadmap links, reverse of readAlignment's capabilityLinks)
    if (kinds.has('task')) {
      for (const row of allVivimRows(db, 'capability')) {
        const payload = parsePayloadOf(row);
        if (Array.isArray(payload.roadmap) && payload.roadmap.map(String).includes(target)) {
          relationships.capabilities.push(row.id);
        }
      }
    }

    // capability -> indexed code
    if (kinds.has('capability')) {
      const payload = records.find((record) => record.kind === 'capability')?.record || {};
      relationships.code = joinCapabilityCode(db, payload);
    }

    relationships.capabilities = [...new Set(relationships.capabilities)].sort();
    relationships.tasks = [...new Set(relationships.tasks)].sort();
    relationships.journeys.sort((a, b) => a.id.localeCompare(b.id) || (a.stronger === b.stronger ? 0 : a.stronger ? -1 : 1));
    return { schema: 'hq.vivim-explain/2', id: target, records, relationships };
  } catch {
    return empty;
  }
}

function safeJsonList(text) {
  if (text == null) return null;
  try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : null; } catch { return null; }
}

export function alignmentMarkdown(alignment, { audience } = {}) {
  const owner = audience === 'owner';
  const lines = [];

  if (alignment == null) {
    lines.push('No VIVIM space registered.');
    lines.push('VIVIM feed not synced. Run `hq vivim sync`.');
    return clampBytes(lines.join('\n'), MARKDOWN_MAX_BYTES);
  }

  lines.push('## Goals alignment', '');
  const phaseLabel = owner ? userTerm('sitrep') : 'Phase';
  const phaseLine = alignment.phase
    ? `${phaseLabel}: ${alignment.phase.id} — ${alignment.phase.status || 'unknown'}`
    : `${phaseLabel}: none`;
  lines.push(phaseLine, '');

  // counts table
  const c = alignment.counts;
  lines.push(`| Kind | Total |`, '| --- | --- |');
  lines.push(`| ${owner ? userTerm('capability') : 'Capabilities'} | ${c.capabilities.total} |`);
  lines.push(`| Tasks | ${c.tasks.total} |`);
  lines.push(`| Journeys | ${c.journeys.total} |`);
  lines.push(`| Gaps | ${c.gaps.total} |`);
  lines.push(`| Requirements | ${c.requirements.total} |`);
  lines.push(`| Routes | ${c.routes.total} |`, '');

  // drift bullets (max 5)
  const drift = [];
  if (alignment.alignment.danglingRoadmapRefs.length) {
    drift.push(`${alignment.alignment.danglingRoadmapRefs.length} dangling roadmap reference(s)`);
  }
  if (alignment.alignment.p0WithoutTask.length) {
    drift.push(`${alignment.alignment.p0WithoutTask.length} P0 capability(s) without a task`);
  }
  if (alignment.alignment.tasksWithoutCapability.length) {
    drift.push(`${alignment.alignment.tasksWithoutCapability.length} task(s) without a capability`);
  }
  if (alignment.alignment.gapsWithoutSteps.length) {
    drift.push(`${alignment.alignment.gapsWithoutSteps.length} gap(s) without steps`);
  }
  if (alignment.alignment.unlinkedCapabilities.length) {
    drift.push(`${alignment.alignment.unlinkedCapabilities.length} unlinked capability(s)`);
  }
  const driftLines = drift.slice(0, 5).map((d) => `- ${d}`);
  if (driftLines.length) lines.push('', ...driftLines);

  return clampBytes(lines.join('\n'), MARKDOWN_MAX_BYTES);
}

function clampBytes(text, max) {
  let out = String(text);
  const enc = new TextEncoder();
  if (enc.encode(out).length <= max) return out;
  while (out.length > 0 && enc.encode(out).length > max) out = out.slice(0, -1);
  return out;
}

export function alignmentDrift(db, { root = '.', projects = [] } = {}) {
  const space = findVivimSpace({ root, projects });
  if (!space) {
    return { ok: false, stale: true, checked: 0, reasons: ['No VIVIM space registered.'], counts: {} };
  }

  const abs = space.abs;
  const committed = getMeta(db, 'vivim_source_files');
  let committedFiles = [];
  try { committedFiles = JSON.parse(committed || '[]'); } catch { committedFiles = []; }
  const committedByRole = new Map();
  for (const entry of committedFiles) {
    if (entry && entry.role) committedByRole.set(entry.role, entry);
  }

  const reasons = [];
  let stale = false;
  let checked = 0;

  // Recompute per-role hashes and compare.
  const currentByRole = new Map();
  const currentSources = [];
  for (const { role, rel, required } of JSON_ROLES) {
    const absPath = join(abs, rel);
    let text;
    try { text = readFileSync(absPath, 'utf8'); } catch {
      // missing optional role -> missing; missing required role handled by readAlignment/dangling
      continue;
    }
    checked++;
    const sha = sha256(text);
    const entry = { role, path: rel, sha256: sha, bytes: Buffer.byteLength(text, 'utf8') };
    currentByRole.set(role, entry);
    currentSources.push(entry);
    const committedEntry = committedByRole.get(role);
    if (!committedEntry) {
      stale = true;
      reasons.push(`added: ${role} (${rel})`);
    } else if (committedEntry.sha256 !== sha) {
      stale = true;
      reasons.push(`changed: ${role} (${rel})`);
    }
  }
  // missing roles present in committed but not on disk
  for (const role of committedByRole.keys()) {
    if (!currentByRole.has(role)) {
      stale = true;
      checked++;
      reasons.push(`missing: ${role}`);
    }
  }

  // dangling refs and required registry presence via readAlignment
  let alignment = null;
  try { alignment = readAlignment(db, { detail: 'summary' }); } catch { alignment = null; }
  if (alignment == null) {
    // required registry missing / not synced
    stale = true;
    reasons.push('VIVIM feed not synced. Run `hq vivim sync`.');
  } else {
    for (const ref of alignment.alignment.danglingRoadmapRefs) {
      reasons.push(`${ref.capability} links unknown task ${ref.task}`);
    }
  }

  // dedupe, sort, cap
  const seen = new Set();
  const unique = [];
  for (const r of reasons) {
    if (seen.has(r)) continue;
    seen.add(r);
    unique.push(r);
  }
  unique.sort((a, b) => a.localeCompare(b));
  let extra = 0;
  if (unique.length > DRIFT_MAX_REASONS) {
    extra = unique.length - DRIFT_MAX_REASONS;
    unique.length = DRIFT_MAX_REASONS;
  }
  if (extra) unique.push(`+${extra} more`);

  const ok = !stale;
  return { ok, stale, checked, reasons: unique, counts: alignment ? alignment.counts : {} };
}

// Compact, deterministic alignment view for surfaces that must stay small
// (brief, feed, home). Never reads the filesystem.
export function alignmentSummary(db) {
  const al = readAlignment(db, { detail: 'summary' });
  if (!al) return null;
  const findings = {
    unlinkedCapabilities: al.alignment.unlinkedCapabilities.length,
    p0WithoutTask: al.alignment.p0WithoutTask.length,
    danglingRoadmapRefs: al.alignment.danglingRoadmapRefs.length,
    tasksWithoutCapability: al.alignment.tasksWithoutCapability.length,
    gapsWithoutSteps: al.alignment.gapsWithoutSteps.length,
  };
  return {
    syncedAt: al.syncedAt,
    digest: al.digest,
    space: al.space,
    phase: al.phase ? { id: al.phase.id, status: al.phase.status ?? null } : null,
    counts: al.counts,
    goals: al.goals.map((g) => ({ id: g.id, title: g.title })),
    findings,
    coverage: al.alignment.coverage,
  };
}

export function alignmentMeta(db) {  if (!vivimTablesPresent(db)) return null;
  const syncedAt = getMeta(db, 'vivim_synced_at');
  const digest = getMeta(db, 'vivim_source_digest');
  const space = getMeta(db, 'vivim_space');
  if (syncedAt == null && digest == null && space == null) return null;
  return { synced_at: syncedAt, digest, space };
}
