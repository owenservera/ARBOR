// hq/aii/fixtures/HQ-050-evidence-needed.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-050 (group F): "What evidence would be needed to verify this capability?"
// Ground truth locked from live outputs 2026-11-11:
//   bun hq/bin/hq.mjs receipts --json
//     -> {"schema":"hq.receipts/1","receipts":[{id,kind,task,project,sources:[{ref,sha256}],
//        digest,bytes,createdAt,created_at}]} (cmdReceipts hq/bin/hq.mjs:4348-4356 ->
//        receipts.mjs:98 listReceipts). 20 receipts at lock time (18 kind aii-fixture, 2 context);
//        the newest is this lane's own HQ-040 fixture receipt.
//   The receipts table (hq/lib/schema.mjs:153-162) records id/kind/task/project/sources/digest/
//   bytes/created_at, and receipts.mjs:62 recordReceipt writes it — the "evidence that exists"
//   ledger; each source carries a sha256 so the evidence is pinned to content.
//   bun hq/bin/hq.mjs capabilities status --json
//     -> {"schema":"hq.capability-registry/1","counts":{...},"sources":[]} with 0 sources and
//        0 contracts at lock time (capability-schema.mjs:160-177 capability_contract carries a
//        `verification TEXT` column; the capability registry is EMPTY, so no capability has been
//        evidenced yet). An explicit zero is the evidence: nothing is verified.
//   bun hq/bin/hq.mjs docs health --json -> staleDocs show evidence that has gone stale and would
//        need re-verification (canon.mjs:1955-1980).
// Counts drift as concurrent lanes record receipts, so they are re-derived live and pinned by
// shape; the empty capability registry and the receipt schema are the stable ground truth.
import { defineFixture, finding, runHq } from './harness.mjs';

export default defineFixture({
  id: 'HQ-050',
  provenance: 'Locked at authoring time 2026-11-11 from live command output: bun hq/bin/hq.mjs receipts --json (schema hq.receipts/1, 20 receipts at lock time - 18 kind aii-fixture and 2 context - each with sources[{ref,sha256}], digest and bytes), bun hq/bin/hq.mjs capabilities status --json (schema hq.capability-registry/1, 0 sources and 0 contracts), and direct reading of hq/lib/schema.mjs:153-162 (receipts table DDL) and hq/lib/capability-schema.mjs:160-177 (capability_contract with a verification TEXT column). Re-derived at run time by re-running the commands and re-reading the live receipts table.',
  expected: [
    { what: 'schema hq.receipts/1', where: 'hq/bin/hq.mjs cmdReceipts' },
    { what: /^\d+ evidence receipts are recorded in the ledger$/, where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'every receipt names its kind, task and sha256-anchored sources', where: 'hq/lib/receipts.mjs recordReceipt' },
    { what: 'receipts table records id, kind, task, project, sources, digest, bytes and created_at', where: 'hq/lib/schema.mjs:153 receipts' },
    { what: 'schema hq.capability-registry/1', where: 'hq/lib/capability-schema.mjs capability_contract' },
    { what: 'capability_contract carries a verification column for the evidence a capability needs', where: 'hq/lib/capability-schema.mjs capability_contract' },
    { what: '0 capability sources and 0 contracts are registered, so no capability is evidenced yet', where: 'hq/bin/hq.mjs capabilities status' },
    { what: /^\d+ documents have gone stale and need re-verification$/, where: 'hq/lib/canon.mjs documentHealth staleDocs' },
  ],
  run: async () => {
    const findings = [];

    // The evidence ledger: hq receipts --json.
    const receipts = runHq(['receipts', '--json']);
    if (receipts.exit !== 0) throw new Error(`hq receipts failed: exit=${receipts.exit} stderr=${receipts.stderr}`);
    const rj = JSON.parse(receipts.stdout);
    if (rj.schema !== 'hq.receipts/1') throw new Error(`unexpected receipts schema: ${rj.schema}`);
    findings.push(finding('schema hq.receipts/1', 'hq/bin/hq.mjs cmdReceipts'));
    if (!Array.isArray(rj.receipts)) throw new Error('hq receipts --json has no receipts array');
    findings.push(finding(`${rj.receipts.length} evidence receipts are recorded in the ledger`, 'hq/lib/receipts.mjs recordReceipt'));

    const wellFormed = rj.receipts.every((x) => typeof x.kind === 'string' && typeof x.digest === 'string'
      && typeof x.bytes === 'number' && Array.isArray(x.sources)
      && x.sources.every((s) => typeof s.ref === 'string' && typeof s.sha256 === 'string'));
    if (!wellFormed) throw new Error('a receipt lacks kind/digest/bytes or sha256-anchored sources');
    findings.push(finding('every receipt names its kind, task and sha256-anchored sources', 'hq/lib/receipts.mjs recordReceipt'));

    // The receipts table shape: the live rows carry these columns, and the canonical DDL in
    // hq/lib/schema.mjs:153-162 declares them.
    const columns = ['id', 'kind', 'task', 'project', 'sources', 'digest', 'bytes', 'created_at'];
    const rowHasColumns = rj.receipts.every((x) => columns.every((c) => x[c] !== undefined));
    if (!rowHasColumns) throw new Error('a live receipt row lacks one of the receipts table columns');
    const fs = await import('node:fs');
    const schemaSrc = fs.readFileSync('hq/lib/schema.mjs', 'utf8');
    const ddl = schemaSrc.slice(schemaSrc.indexOf('CREATE TABLE IF NOT EXISTS receipts ('));
    const ddlBlock = ddl.slice(0, ddl.indexOf(');'));
    for (const col of columns) {
      if (!new RegExp(`\\b${col}\\b`).test(ddlBlock)) throw new Error(`receipts table DDL missing column ${col}`);
    }
    const listed = `${columns.slice(0, -1).join(', ')} and ${columns[columns.length - 1]}`;
    findings.push(finding(`receipts table records ${listed}`, 'hq/lib/schema.mjs:153 receipts'));

    // The capability registry: what evidence a capability needs, and that none is registered.
    const caps = runHq(['capabilities', 'status', '--json']);
    if (caps.exit !== 0) throw new Error(`hq capabilities status failed: exit=${caps.exit} stderr=${caps.stderr}`);
    const cj = JSON.parse(caps.stdout);
    if (cj.schema !== 'hq.capability-registry/1') throw new Error(`unexpected capability registry schema: ${cj.schema}`);
    findings.push(finding('schema hq.capability-registry/1', 'hq/lib/capability-schema.mjs capability_contract'));

    const capSchema = fs.readFileSync('hq/lib/capability-schema.mjs', 'utf8');
    if (!/CREATE TABLE IF NOT EXISTS capability_contract/.test(capSchema) || !/verification\s+TEXT/.test(capSchema)) {
      throw new Error('capability_contract DDL lacks a verification column');
    }
    findings.push(finding('capability_contract carries a verification column for the evidence a capability needs', 'hq/lib/capability-schema.mjs capability_contract'));

    const sourceCount = (cj.sources ?? []).length;
    const contractCount = cj.counts?.contracts ?? 0;
    if (sourceCount !== 0 || contractCount !== 0) {
      throw new Error(`capability registry is no longer empty: sources=${sourceCount} contracts=${contractCount}`);
    }
    findings.push(finding('0 capability sources and 0 contracts are registered, so no capability is evidenced yet', 'hq/bin/hq.mjs capabilities status'));

    // Stale evidence: documents whose bound source hash changed.
    const health = runHq(['docs', 'health', '--json']);
    if (health.exit !== 0) throw new Error(`hq docs health failed: exit=${health.exit} stderr=${health.stderr}`);
    const hj = JSON.parse(health.stdout);
    if (!Array.isArray(hj.staleDocs)) throw new Error('docs health has no staleDocs array');
    findings.push(finding(`${hj.staleDocs.length} documents have gone stale and need re-verification`, 'hq/lib/canon.mjs documentHealth staleDocs'));

    return findings;
  },
});
