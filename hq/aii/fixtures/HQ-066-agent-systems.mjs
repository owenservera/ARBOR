// hq/aii/fixtures/HQ-066-agent-systems.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-066 (group H): "Which agent systems are installed, and which are actually active?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs team --json
//     -> {"agents":[{file,name,model,thoughtLevel,tools,skills,requiredMcpServers,hasFrontmatter}],
//          "seats":[{id,state,site,title,session,scopes,ageMinutes}], ...}
//        (cmdTeam hq/bin/hq.mjs:1940; hq/lib/team-panel.mjs:327 buildTeamSnapshot -> :414 renderPanel;
//        hq/lib/channel-seats.mjs:47 loadSeats, :91 classifySeat; hq/lib/team-panel.mjs:273 readLiveSessions).
//        At lock time 62 agents installed and 4 seats, all 4 seats IDLE (chatgpt, gemini, claude,
//        channel-manager). The AGENT COUNT and seat states drift as agents are registered and
//        seats run, so both are re-derived live and pinned by shape.
//   The distinction the scenario asks for: agents are INSTALLED (agent definition files on disk,
//     each with a model pin, thoughtLevel, tools and skills) while seats carry the LIVE state.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-066',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs team --json (62 installed agent definitions each with file/name/model/thoughtLevel/tools/skills, and 4 seats chatgpt, gemini, claude, channel-manager all in state IDLE at lock time) and bun hq/bin/hq.mjs seat list (the same four seats). Re-derived at run time by re-running both commands; the agent count and seat states drift as agents are registered and seats run, so they are re-derived live and pinned by shape.',
  expected: [
    { what: /^\d+ agent systems are installed with model pin, thoughtLevel, tools and skills$/, where: 'hq/lib/team-panel.mjs buildTeamSnapshot' },
    { what: 'installed agent definitions are read from agent definition files with frontmatter', where: 'hq/lib/team-panel.mjs buildTeamSnapshot' },
    { what: /^\d+ seats report a live state$/, where: 'hq/lib/channel-seats.mjs loadSeats' },
    { what: /^seat states are classified from live sessions as (ACTIVE|IDLE|STALE|UNKNOWN)(\|(ACTIVE|IDLE|STALE|UNKNOWN))*$/, where: 'hq/lib/channel-seats.mjs classifySeat' },
    { what: /^seat chatgpt reports state (ACTIVE|IDLE|STALE|UNKNOWN)$/, where: 'hq/bin/hq.mjs seat list' },
    { what: /^seat gemini reports state (ACTIVE|IDLE|STALE|UNKNOWN)$/, where: 'hq/bin/hq.mjs seat list' },
    { what: /^seat claude reports state (ACTIVE|IDLE|STALE|UNKNOWN)$/, where: 'hq/bin/hq.mjs seat list' },
    { what: /^seat channel-manager reports state (ACTIVE|IDLE|STALE|UNKNOWN)$/, where: 'hq/bin/hq.mjs seat list' },
  ],
  run: async () => {
    const findings = [];

    // Installed agent systems.
    const team = runHq(['team', '--json']);
    if (team.exit !== 0) throw new Error(`hq team failed: exit=${team.exit} stderr=${team.stderr}`);
    const j = JSON.parse(team.stdout);
    if (!Array.isArray(j.agents)) throw new Error('hq team --json has no agents array');
    findings.push(finding(`${j.agents.length} agent systems are installed with model pin, thoughtLevel, tools and skills`, 'hq/lib/team-panel.mjs buildTeamSnapshot'));
    const wellFormed = j.agents.every((a) => typeof a.name === 'string' && typeof a.file === 'string'
      && typeof a.model === 'string' && typeof a.thoughtLevel === 'string'
      && Array.isArray(a.tools) && Array.isArray(a.skills));
    if (!wellFormed) throw new Error('an agent definition lacks name/file/model/thoughtLevel/tools/skills');
    findings.push(finding('installed agent definitions are read from agent definition files with frontmatter', 'hq/lib/team-panel.mjs buildTeamSnapshot'));

    // Seats and their live state.
    if (!Array.isArray(j.seats)) throw new Error('hq team --json has no seats array');
    findings.push(finding(`${j.seats.length} seats report a live state`, 'hq/lib/channel-seats.mjs loadSeats'));

    const seatList = runHq(['seat', 'list']);
    if (seatList.exit !== 0) throw new Error(`hq seat list failed: exit=${seatList.exit} stderr=${seatList.stderr}`);
    const seatRows = seatList.stdout.split('\n').filter((l) => /^(chatgpt|gemini|claude|channel-manager)\s/.test(l));
    if (seatRows.length !== 4) throw new Error(`expected 4 seat rows, got ${seatRows.length}`);
    const observedStates = new Set();
    for (const row of seatRows) {
      const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/.exec(row);
      if (!m) throw new Error(`unparsable seat row: ${JSON.stringify(row)}`);
      const state = m[2];
      if (!['ACTIVE', 'IDLE', 'STALE', 'UNKNOWN'].includes(state)) throw new Error(`unexpected seat state ${state} for ${m[1]}`);
      observedStates.add(state);
      findings.push(finding(`seat ${m[1]} reports state ${state}`, 'hq/bin/hq.mjs seat list'));
    }
    findings.push(finding(`seat states are classified from live sessions as ${[...observedStates].sort().join('|')}`, 'hq/lib/channel-seats.mjs classifySeat'));

    return findings;
  },
});
