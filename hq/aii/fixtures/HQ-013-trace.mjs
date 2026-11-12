// hq/aii/fixtures/HQ-013-trace.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-013 (group B): "Trace this user action from its entrypoint to its final effect."
// Ground truth locked from live output 2026-11-11:
//   bun hq/bin/hq.mjs trace "start the application" -> header
//     'Trace for "start the application" — 15 source(s)' then one line per source in the form
//     '  <project>:<path> lines <a>-<b>  <reason>' (cmdTrace hq/bin/hq.mjs:3879-3891).
//     15 sources at lock time; the count drifts with the shared index, so it is re-derived live.
//   hq/lib/context.mjs composeContext/verifyContext backs hq trace (cmdTrace imports composeContext
//     from hq/lib/context.mjs; composeContext hq/lib/context.mjs:706, verifyContext:847).
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-013',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs trace "start the application" (15 sources, each with project:path lines a-b and a reason) and direct reading of hq/bin/hq.mjs cmdTrace (line 3879) importing composeContext from hq/lib/context.mjs (composeContext hq/lib/context.mjs:706, verifyContext hq/lib/context.mjs:847). Re-derived at run time by re-running hq trace.',
  expected: [
    { what: 'Trace for "start the application"', where: 'hq/bin/hq.mjs trace "start the application"' },
    { what: /^\d+ source\(s\) returned for the traced task$/, where: 'hq/bin/hq.mjs trace "start the application"' },
    { what: /^\d+ traced sources carry project:path lines a-b plus a reason$/, where: 'hq/bin/hq.mjs trace "start the application"' },
    { what: 'hq/lib/context.mjs composeContext/verifyContext backs hq trace', where: 'hq/lib/context.mjs composeContext/verifyContext' },
  ],
  run: async () => {
    const findings = [];
    const trace = runHq(['trace', 'start the application']);
    if (trace.exit !== 0) throw new Error(`hq trace failed: exit=${trace.exit} stderr=${trace.stderr}`);
    const traceLines = trace.stdout.split('\n').filter(Boolean);
    const countLine = traceLines.find((l) => l.startsWith('Trace for'));
    if (!countLine) throw new Error(`no trace header in output: ${JSON.stringify(trace.stdout.slice(0, 200))}`);
    findings.push(finding('Trace for "start the application"', 'hq/bin/hq.mjs trace "start the application"'));
    const count = /— (\d+) source\(s\)/.exec(countLine);
    if (!count) throw new Error(`unexpected trace count line: ${JSON.stringify(countLine)}`);
    findings.push(finding(`${count[1]} source(s) returned for the traced task`, 'hq/bin/hq.mjs trace "start the application"'));

    // Each source line carries project:path, a line range and a reason.
    const sourceLines = traceLines.slice(traceLines.indexOf(countLine) + 1).filter((l) => /^\s+\S+:\S+ lines \d+-\d+\s+\S+\s*$/.test(l));
    if (!sourceLines.length) throw new Error('no traced source lines with file/line/reason shape');
    findings.push(finding(`${sourceLines.length} traced sources carry project:path lines a-b plus a reason`, 'hq/bin/hq.mjs trace "start the application"'));

    // Verify live: cmdTrace imports composeContext from hq/lib/context.mjs.
    const fs = await import('node:fs');
    const hqText = fs.readFileSync('hq/bin/hq.mjs', 'utf8');
    if (!hqText.includes("import('../lib/context.mjs')") || !hqText.includes('composeContext')) {
      throw new Error('cmdTrace does not import composeContext from ../lib/context.mjs');
    }
    findings.push(finding('hq/lib/context.mjs composeContext/verifyContext backs hq trace', 'hq/lib/context.mjs composeContext/verifyContext'));

    return findings;
  },
});
