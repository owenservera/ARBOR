// hq/aii/fixtures/HQ-070-agent-instruction-conflicts.mjs
// AII scenario HQ-070 (Group H): "Which agent instructions conflict, and which instructions take precedence?"
// Engine: hq/lib/team-panel.mjs -> auditAgentConflicts
//
// Ground truth LOCKED 2026-11-11 from the live agent definition roster:
//   bun hq/bin/hq.mjs team  -> 64 agent definitions (refresh 2026-11-11T19:56Z)
//   plus a direct run of auditAgentConflicts against C:/Users/VIVIM.inc/.zcode/agents/*.md
//
// Locked findings:
//   Conflicts: 2
//     skill agent-bootstrap: 61 definitions disagree on model pin / thoughtLevel
//     skill team-protocol: 62 definitions disagree on model pin / thoughtLevel
//   Precedence: 3
//     skill agent-bootstrap: winner agent-platform-ceo (explicit model pin +
//       thoughtLevel high), shadowed 60
//     skill session-ops: winner atlas (explicit model pin + thoughtLevel enabled),
//       shadowed 10
//     skill team-protocol: winner agent-platform-ceo (explicit model pin +
//       thoughtLevel high), shadowed 61
//
// The fixture reads the real agent definition directory (read-only probe) and re-derives
// conflicts and precedence live. No private session content or credentials are surfaced.

import { defineFixture, finding } from './harness.mjs';
import { auditAgentConflicts } from '../../lib/team-panel.mjs';
import { collectAgentFiles } from '../../lib/team-panel.mjs';

const EXPECTED = [
  { what: 'conflict skill agent-bootstrap: 61 definitions disagree on model pin / thoughtLevel', where: 'hq/lib/team-panel.mjs' },
  { what: 'conflict skill team-protocol: 62 definitions disagree on model pin / thoughtLevel', where: 'hq/lib/team-panel.mjs' },
  { what: 'precedence skill agent-bootstrap winner agent-platform-ceo shadowed 60', where: 'hq/lib/team-panel.mjs' },
  { what: 'precedence skill session-ops winner atlas shadowed 10', where: 'hq/lib/team-panel.mjs' },
  { what: 'precedence skill team-protocol winner agent-platform-ceo shadowed 61', where: 'hq/lib/team-panel.mjs' },
];

export default defineFixture({
  id: 'HQ-070',
  provenance:
    '2026-11-11: locked from live agent definitions at C:/Users/VIVIM.inc/.zcode/agents by running ' +
    'auditAgentConflicts (hq/lib/team-panel.mjs) against the real .md roster; 2 skills conflict ' +
    '(agent-bootstrap with 59 definitions, team-protocol with 60) and 3 precedence entries are computed. ' +
    'REFRESH 2026-11-11T19:56Z: the live roster grew from 60 to 64 .md definitions (newest file ' +
    'workflow-keeper.md mtime 2026-11-11T19:56:17Z) since the morning lock; conflict counts moved ' +
    'agent-bootstrap 59 -> 61 and team-protocol 60 -> 62, precedence shadowed counts 58 -> 60 and ' +
    '59 -> 61; winners unchanged (agent-platform-ceo for agent-bootstrap and team-protocol, atlas for ' +
    'session-ops with shadowed 10). Re-locked by re-running auditAgentConflicts against the live roster.',
  expected: EXPECTED,
  run: async () => {
    const files = collectAgentFiles('C:/Users/VIVIM.inc/.zcode/agents');
    const { conflicts, precedence } = auditAgentConflicts(files);
    const findings = [];
    for (const c of conflicts) {
      findings.push(finding(`conflict skill ${c.skill}: ${c.agents.length} definitions disagree on model pin / thoughtLevel`, 'hq/lib/team-panel.mjs'));
    }
    for (const p of precedence) {
      findings.push(finding(`precedence skill ${p.skill} winner ${p.winner} shadowed ${p.shadowed.length}`, 'hq/lib/team-panel.mjs'));
    }
    return findings;
  },
});
