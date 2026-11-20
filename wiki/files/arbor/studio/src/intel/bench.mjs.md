# File: studio/src/intel/bench.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/bench.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9738 B |
| Lines | 202 |
| Hash | 64f7ece8476f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| round4 | function | 7 | no | const round4 = (value) =&gt; { |
| n | const | 8 | no | const n = Number(value); |
| SEARCH_DOCS | const | 13 | no | const SEARCH_DOCS = [ |
| SEARCH_QUERIES | const | 29 | no | const SEARCH_QUERIES = [ |
| benchSearch | function | 40 | no | async function benchSearch() { |
| index | const | 41 | no | const index = new CorpusSearchIndex(); |
| bm25Hits | variable | 44 | no | let bm25Hits = 0; |
| baselineHits | variable | 45 | no | let baselineHits = 0; |
| fuzzy | const | 47 | no | const fuzzy = index.search(query.query, { limit: 3, fuzzy: true }); |
| exact | const | 48 | no | const exact = index.search(query.query, { limit: 3, fuzzy: false }); |
| total | const | 52 | no | const total = SEARCH_QUERIES.length; |
| AUTODETECT_SAMPLES | const | 61 | no | const AUTODETECT_SAMPLES = [ |
| benchAutodetect | function | 76 | no | function benchAutodetect() { |
| perFormat | const | 77 | no | const perFormat = {}; |
| correct | variable | 78 | no | let correct = 0; |
| detected | const | 80 | no | const detected = detectContent(sample.input); |
| ok | const | 81 | no | const ok = detected.kind === sample.kind; |
| total | const | 86 | no | const total = AUTODETECT_SAMPLES.length; |
| DEDUP_GROUP_BASES | const | 91 | no | const DEDUP_GROUP_BASES = [ |
| benchDedup | function | 99 | no | function benchDedup() { |
| items | const | 100 | no | const items = []; |
| truthGroups | const | 101 | no | const truthGroups = []; |
| ids | const | 103 | no | const ids = [`g${index}-a`, `g${index}-b`, `g${index}-c`]; |
| clusters | const | 116 | no | const clusters = lshClusters(items, { threshold: 0.6 }); |
| key | function | 117 | no | const key = (a, b) =&gt; (a &lt; b ? `${a}\|${b}` : `${b}\|${a}`); |
| truthPairs | const | 118 | no | const truthPairs = new Set(); |
| predictedPairs | const | 124 | no | const predictedPairs = new Set(); |
| truePositive | variable | 130 | no | let truePositive = 0; |
| falsePositive | const | 132 | no | const falsePositive = predictedPairs.size - truePositive; |
| falseNegative | const | 133 | no | const falseNegative = truthPairs.size - truePositive; |
| SECRET_CASES | const | 142 | no | const SECRET_CASES = [ |
| benchSecrets | function | 167 | no | function benchSecrets() { |
| truePositive | variable | 168 | no | let truePositive = 0; |
| falsePositive | variable | 169 | no | let falsePositive = 0; |
| falseNegative | variable | 170 | no | let falseNegative = 0; |
| found | const | 172 | no | const found = detectSecrets(testCase.text, { extended: false, pii: true }).length &gt; 0; |
| predicted | const | 177 | no | const predicted = truePositive + falsePositive; |
| actual | const | 178 | no | const actual = truePositive + falseNegative; |
| section | function | 186 | no | async function section(run) { |
| runBench | function | 195 | yes | export async function runBench() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./search.mjs | import | 2 | [studio/src/intel/search.mjs](./search.mjs.md) |
| ./autodetect.mjs | import | 3 | [studio/src/intel/autodetect.mjs](./autodetect.mjs.md) |
| ./rank.mjs | import | 4 | [studio/src/intel/rank.mjs](./rank.mjs.md) |
| ../security/patterns.mjs | import | 5 | [studio/src/security/patterns.mjs](../security/patterns.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/platform-x.mjs](../studio/platform-x.mjs.md) | ../intel/bench.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic in-memory benchmark harness. Pure: no disk, no network, no clock, no randomness.
import { CorpusSearchIndex, primeFuzzySearch } from './search.mjs';
import { detectContent } from './autodetect.mjs';
import { lshClusters } from './rank.mjs';
import { detectSecrets } from '../security/patterns.mjs';

const round4 = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 1e4) / 1e4 : 0;
};

// --- search fixtures: 12 short docs, 8 typo queries whose target doc is known ---
const SEARCH_DOCS = [
  { id: 'd-kube', text: 'kubernetes autoscaling deployment replicas rolling update' },
  { id: 'd-pg', text: 'postgres vacuum analyze index bloat statistics planner' },
  { id: 'd-redis', text: 'redis eviction maxmemory policy allkeys lru' },
  { id: 'd-elastic', text: 'elasticsearch shard allocation rebalance cluster green yellow' },
  { id: 'd-tf', text: 'terraform provider registry module pinning workspace' },
  { id: 'd-grafana', text: 'grafana dashboard datasource annotation panels alert' },
  { id: 'd-prom', text: 'prometheus alertmanager routing inhibition silences' },
  { id: 'd-nginx', text: 'nginx ingress tls termination upstream keepalive' },
  { id: 'd-rabbit', text: 'rabbitmq quorum queue prefetch delivery acknowledgement' },
  { id: 'd-kafka', text: 'kafka consumer rebalance partition offset commit group' },
  { id: 'd-docker', text: 'docker layer cache multistage build context registry' },
  { id: 'd-git', text: 'git rebase interactive squash cherry pick revert' }
];

// Each query carries one typo in the discriminative term plus a decoy term owned by another doc.
const SEARCH_QUERIES = [
  { id: 'd-kube', query: 'autoscalng grafana' },
  { id: 'd-pg', query: 'postgrs redis' },
  { id: 'd-redis', query: 'maxmory terraform' },
  { id: 'd-elastic', query: 'alocation prometheus' },
  { id: 'd-tf', query: 'pinng rabbitmq' },
  { id: 'd-grafana', query: 'datasorce elasticsearch' },
  { id: 'd-prom', query: 'alertmanagr docker' },
  { id: 'd-nginx', query: 'terminaton kubernetes' }
];

async function benchSearch() {
  const index = new CorpusSearchIndex();
  for (const doc of SEARCH_DOCS) index.add(doc.id, { source: 'bench' }, { text: doc.text });
  await primeFuzzySearch();
  let bm25Hits = 0;
  let baselineHits = 0;
  for (const query of SEARCH_QUERIES) {
    const fuzzy = index.search(query.query, { limit: 3, fuzzy: true });
    const exact = index.search(query.query, { limit: 3, fuzzy: false });
    if (fuzzy.some((hit) => hit.id === query.id)) bm25Hits += 1;
    if (exact.some((hit) => hit.id === query.id)) baselineHits += 1;
  }
  const total = SEARCH_QUERIES.length;
  return {
    bm25: round4(bm25Hits / total),
    baseline: round4(baselineHits / total),
    metric: `hit@3 over ${total} typo queries`
  };
}

// --- autodetect fixtures: one sample per expected kind ---
const AUTODETECT_SAMPLES = [
  { kind: 'json', input: '{"id":42,"name":"bench","tags":["a","b"]}' },
  { kind: 'ndjson', input: '{"seq":1,"value":"x"}\n{"seq":2,"value":"y"}\n{"seq":3,"value":"z"}' },
  { kind: 'sse', input: 'event: message\ndata: {"a":1}\n\nevent: ping\ndata: {"b":2}\n' },
  { kind: 'csv', input: 'id,name,score\n1,alpha,0.5\n2,beta,0.75\n3,gamma,0.25\n' },
  { kind: 'html', input: '<!doctype html>\n<html lang="en">\n<head><title>Bench</title></head>\n<body><h1>Hello</h1><p>Text</p></body>\n</html>\n' },
  { kind: 'xml', input: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <item id="1">alpha</item>\n  <item id="2">beta</item>\n</catalog>\n' },
  { kind: 'yaml', input: 'name: bench\nversion: 1\nenabled: true\n' },
  { kind: 'logfmt', input: 'level=info msg=started requestId=abc123 durationMs=12\nlevel=warn msg=slow requestId=def456 durationMs=900\n' },
  { kind: 'ini', input: '[server]\nhost=localhost\nport=8080\n\n[client]\ntimeout=30\n' },
  { kind: 'gzip', input: Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x4b, 0x4c, 0x4a, 0x06, 0x00, 0xf2, 0xec, 0x36]) },
  { kind: 'png', input: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]) },
  { kind: 'text', input: 'The quick brown fox jumps over the lazy dog.\nNothing structured lives on these two lines.\n' }
];

function benchAutodetect() {
  const perFormat = {};
  let correct = 0;
  for (const sample of AUTODETECT_SAMPLES) {
    const detected = detectContent(sample.input);
```

_First 80 of 203 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
