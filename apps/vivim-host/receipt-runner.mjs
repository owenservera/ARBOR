// Prototype acceptance receipt runner — lane L5 (device-free local portion).
//
// Executes the part of the P1 receipt chain that does not need a phone:
//   Host -> SQLite -> projection -> revision/Undo
//
// Each hop carries a command id and an elapsed-ms timing. The paired-phone and
// on-device-repaint hops are recorded as not_run: device_unavailable — they are
// never simulated as measured. The owner runs the full chain (including a paired
// device) to produce P1 evidence; this run is an agent_dry_run only.
//
// Importable (buildReceipt / writeReceipt) and runnable directly:
//   node apps/vivim-host/receipt-runner.mjs [--out <dir>] [--label <name>] [--date <YYYY-MM-DD>]
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBootstrapRuntime } from './bootstrap/runtime.mjs';
import { createSurface } from '../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../mobile-relay/generative-ui/compiler.mjs';

export const RECEIPT_SCHEMA = 'vivim.receipt/1';
const LABEL_DEFAULT = 'agent_dry_run';
const DATE_DEFAULT = new Date().toISOString().slice(0, 10);
const WORLD_DEFAULT = 'world-local';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'docs', 'receipts');

function id() { return 'rcp-' + randomBytes(8).toString('hex'); }
function cmdId() { return 'cmd-' + randomBytes(8).toString('hex'); }

function card(componentId) {
  return { id: componentId, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] };
}

function surface() {
  return createSurface({ surfaceId: 'receipt-chain-space' });
}

// Mirror the UI-revision test: derive the committed surface from the service
// outcome, stamping the real committed revision so the next compare-and-swap
// runs against the revision the Host actually holds.
function committed(out, prior, body, approvedRefs) {
  const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface;
  return { ...next, revision: out.revision };
}

function proposal(surface, component, { opId, baseRevision = surface.revision } = {}) {
  return {
    schema: 'vivim.ui-proposal/1', surfaceId: surface.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }],
    explanation: 'Receipt chain surface revision', assumptions: [], unknowns: []
  };
}

// Time one hop: ISO bookends plus real elapsed milliseconds from hrtime.
function time(fn) {
  const startedAt = new Date().toISOString();
  const t0 = process.hrtime.bigint();
  const result = fn();
  const finishedAt = new Date().toISOString();
  const elapsedMs = Number(process.hrtime.bigint() - t0) / 1_000_000;
  return { result, startedAt, finishedAt, elapsedMs: Math.round(elapsedMs * 100) / 100 };
}

function hop(n, name, domain, fields) {
  return { hop: n, name, domain, measured: fields.measured !== false, ...fields };
}

function notRunHop(n, name, domain, reason) {
  return hop(n, name, domain, { measured: false, status: 'not_run', reason, elapsedMs: null, commandId: null, requestId: null, revision: null });
}

// Build the receipt in memory (device-free local portion only).
export function buildReceipt({ date = DATE_DEFAULT, label = LABEL_DEFAULT, worldId = WORLD_DEFAULT } = {}) {
  const receiptId = id();
  const chain = 'paired phone -> Host -> SQLite -> projection -> on-device repaint -> Undo';
  const dir = mkdtempSync(path.join(tmpdir(), 'vivim-receipt-'));
  const ledgerFile = path.join(dir, 'ledger.db');
  const runtime = createBootstrapRuntime({ dataRoot: dir, worldId, file: ledgerFile });
  const hops = [];
  let rev1ChangeId = null;

  try {
    // Prerequisite: owner grant of the visual scope (no device, no provider).
    runtime.grantBootstrap({ scope: 'full-bootstrap' });

    const start = surface();
    const first = proposal(start, card('item1'), { opId: 'op.insert.item1' });

    // Hop 1 (chain position): paired phone -> Host — not present in a device-free run.
    hops.push(notRunHop(1, 'paired phone -> Host (relay command channel)', 'phone', 'device_unavailable'));

    // Hop 2: Host.commit revision 1 -> SQLite ledger (ui_revisions row).
    const h2 = time(() => runtime.applyUiProposal({
      proposal: first, surface: start, approvedRefs: [], requestId: 'req-receipt-1', actor: 'owner'
    }));
    const r1 = h2.result;
    rev1ChangeId = r1.changeId;
    hops.push(hop(2, 'Host.applyUiProposal (vivim.ui-proposal/1) -> SQLite ledger', 'Host+SQLite', {
      measured: true, status: r1.status, revision: r1.revision, parentRevision: r1.parentRevision,
      commandId: r1.changeId, requestId: 'req-receipt-1',
      startedAt: h2.startedAt, finishedAt: h2.finishedAt, elapsedMs: h2.elapsedMs,
      detail: { changeId: r1.changeId, surfaceId: r1.surfaceId, persisted: r1.persisted, projectionDigest: r1.projectionDigest }
    }));

    // Hop 3: Host.commit revision 2 -> SQLite ledger (compare-and-swap on revision 1).
    const rev1Surface = committed(r1, start, first, []);
    const second = proposal(rev1Surface, card('item2'), { opId: 'op.insert.item2', baseRevision: 1 });
    const h3 = time(() => runtime.applyUiProposal({
      proposal: second, surface: rev1Surface, approvedRefs: [], requestId: 'req-receipt-2', actor: 'owner'
    }));
    const r2 = h3.result;
    hops.push(hop(3, 'Host.applyUiProposal (vivim.ui-proposal/1) -> SQLite ledger', 'Host+SQLite', {
      measured: true, status: r2.status, revision: r2.revision, parentRevision: r2.parentRevision,
      commandId: r2.changeId, requestId: 'req-receipt-2',
      startedAt: h3.startedAt, finishedAt: h3.finishedAt, elapsedMs: h3.elapsedMs,
      detail: { changeId: r2.changeId, surfaceId: r2.surfaceId, persisted: r2.persisted, projectionDigest: r2.projectionDigest }
    }));

    // Hop 4: SQLite ledger read (ui_revisions row at revision 2).
    const h4 = time(() => {
      const row = runtime.ledger.uiRevisions.byRevision(worldId, r2.revision);
      return row ? { revision: row.revision, changeId: row.change_id, status: row.status, active: row.active } : null;
    });
    const row2 = h4.result;
    hops.push(hop(4, 'SQLite ledger read (ui_revisions row at revision 2)', 'SQLite', {
      measured: true, status: row2 ? row2.status : null, revision: row2 ? row2.revision : null,
      commandId: row2 ? row2.changeId : cmdId(), requestId: 'req-receipt-2',
      startedAt: h4.startedAt, finishedAt: h4.finishedAt, elapsedMs: h4.elapsedMs,
      detail: { table: 'ui_revisions', worldId, readByRevision: r2.revision, row: row2 }
    }));

    // Hop 5: Host projection() read before Undo.
    const h5 = time(() => runtime.projection());
    const pre = h5.result;
    hops.push(hop(5, 'Host.projection() (phone-safe read model, pre-Undo)', 'projection', {
      measured: true, status: pre.uiRevision ? pre.uiRevision.status : null, revision: pre.uiRevision ? pre.uiRevision.revision : null,
      commandId: pre.uiRevision ? pre.uiRevision.changeId : cmdId(), requestId: 'req-receipt-2',
      startedAt: h5.startedAt, finishedAt: h5.finishedAt, elapsedMs: h5.elapsedMs,
      detail: { state: pre.state, phase: pre.phase, uiRevision: pre.uiRevision }
    }));

    // Hop 6 (chain position): on-device repaint — not present in a device-free run.
    hops.push(notRunHop(6, 'on-device repaint', 'on-device', 'device_unavailable'));

    // Hop 7: Host.Undo -> SQLite ledger (restores revision 1, keeps history).
    const h7 = time(() => runtime.undoUiRevision({ requestId: 'req-receipt-undo', actor: 'owner' }));
    const undone = h7.result;
    hops.push(hop(7, 'Host.undoUiRevision -> SQLite ledger', 'Host+SQLite', {
      measured: true, status: undone.status, revision: undone.active, parentRevision: r2.revision,
      commandId: 'req-receipt-undo', requestId: 'req-receipt-undo',
      startedAt: h7.startedAt, finishedAt: h7.finishedAt, elapsedMs: h7.elapsedMs,
      detail: { undone: undone.undone, active: undone.active, persisted: undone.persisted }
    }));

    // Hop 8: Host projection() read after Undo.
    const h8 = time(() => runtime.projection());
    const post = h8.result;
    hops.push(hop(8, 'Host.projection() (phone-safe read model, post-Undo)', 'projection', {
      measured: true, status: post.uiRevision ? post.uiRevision.status : null, revision: post.uiRevision ? post.uiRevision.revision : null,
      commandId: post.uiRevision ? post.uiRevision.changeId : cmdId(), requestId: 'req-receipt-undo',
      startedAt: h8.startedAt, finishedAt: h8.finishedAt, elapsedMs: h8.elapsedMs,
      detail: { state: post.state, phase: post.phase, uiRevision: post.uiRevision }
    }));

    const measured = hops.filter(h => h.measured);
    const notRun = hops.filter(h => !h.measured);
    const elapsedMs = Math.round(measured.reduce((sum, h) => sum + (h.elapsedMs ?? 0), 0) * 100) / 100;

    return {
      schema: RECEIPT_SCHEMA, receiptId, label,
      kind: label.toLowerCase().includes('agent') ? 'dry_run' : 'owner_run',
      date, chain,
      scope: 'device-free local portion (Host -> SQLite -> projection -> revision/Undo)',
      worldId, ledger: 'node:sqlite (bootstrap ledger, file-backed)',
      hops,
      totals: { hops: hops.length, measured: measured.length, notRun: notRun.length, elapsedMs },
      result: {
        activeRevision: post.uiRevision ? post.uiRevision.revision : null,
        surfaceId: post.uiRevision ? post.uiRevision.surfaceId : null,
        changeId: post.uiRevision ? post.uiRevision.changeId : rev1ChangeId,
        committedBeforeUndo: r2 ? r2.changeId : null,
        projectionReady: post.state === 'ready'
      },
      notRun: notRun.map(h => ({ hop: h.hop, name: h.name, reason: h.reason })),
      evidence: { runtime: 'vivim.bootstrap-runtime/1', service: 'vivim.bootstrap-service/1', ledger: 'vivim.bootstrap-ledger/1' },
      notes: label === LABEL_DEFAULT
        ? 'agent_dry_run — not P1 evidence. Produced by an agent from the device-free local portion only. '
          + 'P1 evidence requires the owner to run the full chain (paired phone + on-device repaint) and '
          + 'produce a dated receipt labelled accordingly. No on-device repaint is simulated as measured.'
        : 'Owner-produced P1 receipt candidate.',
      createdAt: new Date().toISOString()
    };
  } finally {
    try { runtime.close(); } catch { /* already closed */ }
    rmSync(dir, { recursive: true, force: true });
  }
}

function elapsedCell(h) { return h.measured ? String(h.elapsedMs) + ' ms' : '—'; }
function revisionCell(h) { return h.revision === null ? '—' : String(h.revision); }
function boolCell(h) { return h.measured ? 'yes' : 'no (' + h.reason + ')'; }

function receiptMarkdown(receipt) {
  const lines = [];
  lines.push('# Acceptance receipt — ' + receipt.label);
  lines.push('');
  lines.push('Schema: ' + receipt.schema + ' · Label: ' + receipt.label + ' · Date: ' + receipt.date);
  lines.push('Receipt id: ' + receipt.receiptId + ' · Kind: ' + receipt.kind);
  lines.push('Chain: ' + receipt.chain);
  lines.push('Scope: ' + receipt.scope);
  lines.push('World: ' + receipt.worldId + ' · Ledger: ' + receipt.ledger);
  lines.push('');
  lines.push('## Result');
  lines.push('- Active revision: ' + (receipt.result.activeRevision ?? '—'));
  lines.push('- Surface id: ' + (receipt.result.surfaceId ?? '—'));
  lines.push('- Active change id: ' + (receipt.result.changeId ?? '—'));
  lines.push('- Committed before Undo: ' + (receipt.result.committedBeforeUndo ?? '—'));
  lines.push('- Projection ready: ' + receipt.result.projectionReady);
  lines.push('- Measured hops: ' + receipt.totals.measured + ' · not_run hops: ' + receipt.totals.notRun + ' · total elapsed: ' + receipt.totals.elapsedMs + ' ms');
  lines.push('');
  lines.push('## Hops (command id and elapsed ms per hop)');
  lines.push('');
  lines.push('| Hop | Domain | Command id | Request id | Elapsed ms | Status | Revision | Measured |');
  lines.push('|-----|--------|------------|------------|------------|--------|----------|----------|');
  for (const h of receipt.hops) {
    lines.push('| ' + h.hop + ' | ' + h.domain + ' | ' + (h.commandId ?? '—') + ' | ' + (h.requestId ?? '—') + ' | '
      + elapsedCell(h) + ' | ' + h.status + ' | ' + revisionCell(h) + ' | ' + boolCell(h) + ' |');
  }
  lines.push('');
  lines.push('## Not run');
  for (const n of receipt.notRun) {
    lines.push('- Hop ' + n.hop + ' ' + n.name + ': not_run — ' + n.reason + '.');
  }
  lines.push('');
  lines.push('## Distinction');
  lines.push('- **measured**: the hop executed in this run; elapsed ms is real instrumentation, not a placeholder.');
  lines.push('- **not_run: device_unavailable**: the hop needs a paired phone/device that is absent in this device-free run.');
  lines.push('- **not_run: owner_required**: the final on-device P1 run must be produced by the owner; an agent cannot fabricate it.');
  lines.push('- An on-device repaint is never simulated and never labelled measured.');
  lines.push('');
  lines.push('## Notes');
  lines.push(receipt.notes);
  lines.push('');
  lines.push('Generated by apps/vivim-host/receipt-runner.mjs (lane L5, device-free local portion).');
  return lines.join('\n') + '\n';
}

// Write the dated receipt JSON + human-readable markdown into outDir.
export function writeReceipt(receipt, outDir) {
  mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, receipt.date + '-' + receipt.label);
  writeFileSync(base + '.json', JSON.stringify(receipt, null, 2) + '\n', { encoding: 'utf8' });
  writeFileSync(base + '.md', receiptMarkdown(receipt), { encoding: 'utf8' });
  return { json: base + '.json', markdown: base + '.md' };
}

// Parse --out / --label / --date from argv.
function parseArgs(argv) {
  const out = { out: DEFAULT_OUT, label: LABEL_DEFAULT, date: DATE_DEFAULT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') out.out = argv[++i];
    else if (a === '--label') out.label = argv[++i];
    else if (a === '--date') out.date = argv[++i];
  }
  return out;
}

// Runnable entry point.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const receipt = buildReceipt({ label: args.label, date: args.date });
  const written = writeReceipt(receipt, args.out);
  console.log('receipt written: ' + written.json);
  console.log('receipt written: ' + written.markdown);
  console.log('hops: ' + receipt.totals.hops + ' (measured ' + receipt.totals.measured + ', not_run ' + receipt.totals.notRun + ')');
}
