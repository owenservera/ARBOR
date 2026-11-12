// hq/lib/nomenclature.mjs — VIVIM taxonomy bridge.
// User surfaces speak VIVIM. Engineering surfaces keep precise internal terms.
// Source of truth: vivim-web-harness/docs/VIVIM-CONCEPT.md (glossary + invariants).
export const VIVIM_TAXONOMY = Object.freeze({
  version: 1,
  source: 'vivim-web-harness/docs/VIVIM-CONCEPT.md',
  userTerms: {
    world: 'My World',
    space: 'Space',
    personalAgent: 'My Agent',
    fleet: 'My AI Team',
    swarm: 'Team Session',
    role: 'Specialty',
    genome: 'Agent DNA',
    memory: 'Memory',
    work: 'Task',
    sitrep: 'Progress Report',
    capability: 'Ability',
    authority: 'Permissions',
    evidence: 'Activity Record',
    aperture: 'Discover',
    forge: 'Build',
    host: 'VIVIM on my computer',
    studio: 'Advanced panel',
    bridge: 'Phone Connection',
    context: 'Context',
    index: 'Map',
  },
  engineeringTerms: {
    world: 'workspace registry + local index',
    space: 'registered project',
    personalAgent: 'owner-scoped agent surface',
    fleet: 'registered agent roster',
    swarm: 'parallel agent session',
    role: 'agent specialty',
    genome: 'agent manifest (references only, never credentials)',
    memory: 'notes table with tiers + provenance',
    work: 'task / handoff bundle',
    sitrep: 'brief',
    capability: 'CLI command or MCP tool',
    authority: 'scope + approval boundary',
    evidence: 'receipts ledger',
    aperture: 'context bundle',
    forge: 'wiki generation',
    host: 'local HQ runtime',
    studio: 'CLI',
    bridge: 'MCP / CLI transport',
  },
  memoryTiers: {
    now: 'Recent',
    later: 'Saved Knowledge',
    canon: 'Core Memory',
  },
  annotationLabels: {
    context: 'Purpose',
    why: 'Why this exists',
    invariant: 'Invariant',
    see: 'See also',
    todo: 'Open task',
    owner: 'Owner',
    task: 'Task link',
    risk: 'Risk',
    deprecated: 'Deprecated',
  },
  invariants: [
    'Memory is not authority.',
    'Capability is not authorization.',
    'Evidence is not inference.',
    'One effect owner.',
    'No silent sends.',
    'Journal before effect.',
    'Owner confirmation for Core Memory.',
  ],
});

export function userTerm(key) {
  return VIVIM_TAXONOMY.userTerms[key] || key;
}

export function engineeringTerm(key) {
  return VIVIM_TAXONOMY.engineeringTerms[key] || key;
}

export function memoryTierLabel(tier) {
  return VIVIM_TAXONOMY.memoryTiers[tier] || tier;
}

export function annotationLabel(kind) {
  return VIVIM_TAXONOMY.annotationLabels[kind] || kind;
}

export function sitrepHeading(audience = 'owner') {
  return audience === 'owner' ? VIVIM_TAXONOMY.userTerms.sitrep : 'SITREP';
}

export function apertureHeading(audience = 'owner') {
  return audience === 'owner' ? VIVIM_TAXONOMY.userTerms.aperture : 'Aperture bundle';
}

export function glossaryMarkdown() {
  const lines = [
    '# VIVIM + HQ glossary',
    '',
    'HQ uses the VIVIM vocabulary on every owner-facing surface. Engineering',
    'documents keep the precise internal term. Both are listed here.',
    '',
    '| You see | Internal | Meaning |',
    '| --- | --- | --- |',
  ];
  for (const key of Object.keys(VIVIM_TAXONOMY.userTerms)) {
    lines.push(`| ${VIVIM_TAXONOMY.userTerms[key]} | ${key} — ${VIVIM_TAXONOMY.engineeringTerms[key] || key} | ${VIVIM_TAXONOMY.engineeringTerms[key] || key} |`);
  }
  lines.push('', '## Memory tiers', '', '| You see | Internal | Promotion |', '| --- | --- | --- |');
  lines.push('| Recent | now | free to add |');
  lines.push('| Saved Knowledge | later | reviewed |');
  lines.push('| Core Memory | canon | owner confirmation required |');
  lines.push('', '## Invariants', '');
  for (const rule of VIVIM_TAXONOMY.invariants) lines.push(`- ${rule}`);
  lines.push('');
  return lines.join('\n');
}

export function authorityNotice() {
  return 'HQ is a read-only projection. It never sends, approves, or executes provider actions.';
}
