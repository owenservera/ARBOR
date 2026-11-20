# File: hq/aii/fixtures/HQ-040-contradicting-docs.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-040-contradicting-docs.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5730 B |
| Lines | 69 |
| Hash | 3dbf47a312df |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| findings | const | 35 | no | const findings = []; |
| conflicts | const | 37 | no | const conflicts = runHq([&#39;conflicts&#39;, &#39;--json&#39;]); |
| j | const | 39 | no | const j = JSON.parse(conflicts.stdout); |
| wellFormed | const | 44 | no | const wellFormed = j.conflicts.every((c) =&gt; typeof c.kind === &#39;string&#39; &amp;&amp; typeof c.a === &#39;string&#39; &amp;&amp; typeof c.b === &#39;string&#39; &amp;&amp; typeof c.message === &#39;string&#39;); |
| findConflict | function | 49 | no | const findConflict = (term) =&gt; j.conflicts.find((c) =&gt; c.a === term); |
| broker | const | 50 | no | const broker = findConflict(&#39;every case asserts the transport was NOT called where the policy refuses&#39;); |
| pure | const | 56 | no | const pure = findConflict(&#39;pure: no fs, no childprocess, no clock read. now is an argument and is required&#39;); |
| msg | const | 63 | no | const msg = /^CANON term &quot;.+&quot; is defined in (\\d+) sources and was not merged$/.exec(broker.message); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 20 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-040-contradicting-docs.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-040 (group E): "Which documents contradict one another?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs conflicts --json
//     -> {"schema":"hq.conflicts/1","conflicts":[{kind,a,b,message}], "health":{...}}
//        (cmdConflicts hq/bin/hq.mjs:4032-4046 -> canon.mjs:1922 documentHealth, conflicts built
//        at canon.mjs:2033). At lock time 4 conflicts, all kind duplicate_term:
//          a="every case asserts the transport was NOT called where the policy refuses"
//            b="hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs"
//          a="pure: no fs, no childprocess, no clock read. now is an argument and is required"
//            b="hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs"
//          a="read-only; never writes providerconfig.json, the depot catalog, or any agent file"
//            b="hq/test/nvidia-provider-fix.test.mjs, hq/test/nvidia-provider-fix.test.mjs.bak-wo031"
//          a="tests always override HQSUPERVISORSTATE to a temp dir; the real .hq/supervisor"
//            b="hq/test/supervisor-backpressure.test.mjs, hq/test/supervisor.test.mjs"
//        message shape: CANON term "<a>" is defined in 2 sources and was not merged.
//   The conflict COUNT drifts with the shared index, so it is re-derived live and pinned by shape;
//   the four duplicate_term pairs above are the stable ground truth because they are read out of
//   real source files.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-040',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs conflicts --json (4 conflicts at lock time, all kind duplicate_term, each with a=term, b=source pair and message CANON term ... is defined in 2 sources and was not merged). Re-derived at run time by re-running the command; the conflict count is re-derived live because concurrent lanes reindex the shared workspace.',
  expected: [
    { what: /^\d+ documents contradict one another$/, where: 'hq/bin/hq.mjs cmdConflicts' },
    { what: 'every conflict names the contradicting pair as a term and its source files', where: 'hq/lib/canon.mjs documentHealth conflicts' },
    { what: 'conflict kind duplicate_term: every case asserts the transport was NOT called where the policy refuses', where: 'hq/lib/canon.mjs documentHealth conflicts' },
    { what: 'conflict sources hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs', where: 'hq/lib/canon.mjs documentHealth conflicts' },
    { what: 'conflict kind duplicate_term: pure: no fs, no childprocess, no clock read. now is an argument and is required', where: 'hq/lib/canon.mjs documentHealth conflicts' },
    { what: 'conflict sources hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs', where: 'hq/lib/canon.mjs documentHealth conflicts' },
    { what: /^conflict message states the term is defined in \d+ sources and was not merged$/, where: 'hq/lib/hq.mjs cmdConflicts' },
  ],
  run: async () => {
    const findings = [];

    const conflicts = runHq(['conflicts', '--json']);
    if (conflicts.exit !== 0) throw new Error(`hq conflicts failed: exit=${conflicts.exit} stderr=${conflicts.stderr}`);
    const j = JSON.parse(conflicts.stdout);
    if (!Array.isArray(j.conflicts)) throw new Error('hq conflicts --json has no conflicts array');
    findings.push(finding(`${j.conflicts.length} documents contradict one another`, 'hq/bin/hq.mjs cmdConflicts'));

    // Each conflict names the term and the source pair that disagree.
    const wellFormed = j.conflicts.every((c) => typeof c.kind === 'string' && typeof c.a === 'string' && typeof c.b === 'string' && typeof c.message === 'string');
    if (!wellFormed) throw new Error('a conflict lacks kind/a/b/message');
    findings.push(finding('every conflict names the contradicting pair as a term and its source files', 'hq/lib/canon.mjs documentHealth conflicts'));

    // The two stable duplicate_term pairs read out of real source files.
    const findConflict = (term) => j.conflicts.find((c) => c.a === term);
    const broker = findConflict('every case asserts the transport was NOT called where the policy refuses');
    if (!broker) throw new Error('missing duplicate_term conflict for the transport-not-called policy');
    if (broker.kind !== 'duplicate_term') throw new Error(`unexpected kind: ${broker.kind}`);
    findings.push(finding(`conflict kind ${broker.kind}: ${broker.a}`, 'hq/lib/canon.mjs documentHealth conflicts'));
    findings.push(finding(`conflict sources ${broker.b}`, 'hq/lib/canon.mjs documentHealth conflicts'));

    const pure = findConflict('pure: no fs, no childprocess, no clock read. now is an argument and is required');
    if (!pure) throw new Error('missing duplicate_term conflict for the purity term');
    if (pure.kind !== 'duplicate_term') throw new Error(`unexpected kind: ${pure.kind}`);
    findings.push(finding(`conflict kind ${pure.kind}: ${pure.a}`, 'hq/lib/canon.mjs documentHealth conflicts'));
    findings.push(finding(`conflict sources ${pure.b}`, 'hq/lib/canon.mjs documentHealth conflicts'));

    // The message explains the contradiction.
    const msg = /^CANON term ".+" is defined in (\d+) sources and was not merged$/.exec(broker.message);
    if (!msg) throw new Error(`unexpected conflict message: ${JSON.stringify(broker.message)}`);
    findings.push(finding(`conflict message states the term is defined in ${msg[1]} sources and was not merged`, 'hq/lib/hq.mjs cmdConflicts'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
