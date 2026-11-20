# File: studio/src/intel/learner-journal.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/learner-journal.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6602 B |
| Lines | 116 |
| Hash | 8cd2ead7705f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LearnerWriteConflict | class | 8 | yes | export class LearnerWriteConflict extends Error { |
| constructor | method | 9 | yes | constructor(message, code = &#39;LEARNER_REVISION_CONFLICT&#39;) { super(message); this.name = &#39;LearnerWriteConflict&#39;; this.code = code; } |
| digest | function | 12 | no | const digest = (data) =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(data)).digest(&#39;hex&#39;); |
| revisionOf | function | 13 | no | const revisionOf = (state) =&gt; Number.isSafeInteger(state?.revision) &amp;&amp; state.revision &gt;= 0 ? state.revision : 0; |
| snapshotFile | function | 14 | no | const snapshotFile = (dir, revision) =&gt; path.join(dir, &#39;history&#39;, `rev-${String(revision).padStart(9, &#39;0&#39;)}.json`); |
| atomicJson | function | 17 | no | function atomicJson(file, obj) { |
| tmp | const | 18 | no | const tmp = `${file}.${process.pid}.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`; |
| fd | const | 19 | no | const fd = openSync(tmp, &#39;wx&#39;, 0o600); |
| LearnerJournal | class | 28 | yes | export class LearnerJournal { |
| constructor | method | 29 | yes | constructor(dir) { |
| read | method | 35 | yes | read() { |
| data | const | 37 | no | const data = JSON.parse(readFileSync(this.file, &#39;utf8&#39;)); |
| version | method | 44 | yes | version() { return revisionOf(this.read()); } |
| versions | method | 45 | yes | versions() { |
| at | method | 50 | yes | at(revision) { |
| current | const | 52 | no | const current = this.read(); |
| file | const | 54 | no | const file = snapshotFile(this.dir, revision); |
| snap | const | 56 | no | const snap = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| diff | method | 61 | yes | diff(fromRevision, toRevision = this.version()) { |
| lineage | method | 64 | yes | lineage({ limit = 50 } = {}) { |
| revisions | const | 65 | no | const revisions = this.versions().slice().reverse().slice(0, Number.isInteger(limit) &amp;&amp; limit &gt; 0 ? limit : 50); |
| state | const | 67 | no | const state = this.at(revision); |
| commit | method | 74 | yes | commit(state, expectedRevision) { |
| previous | const | 83 | no | const previous = this.read(); |
| actual | const | 84 | no | const actual = revisionOf(previous); |
| revision | const | 86 | no | const revision = actual + 1; |
| body | const | 87 | no | const body = { ...state, version: 2, revision, parentRevision: actual, savedAt: new Date().toISOString() }; |
| next | const | 89 | no | const next = { ...body, integrity: digest(body) }; |
| target | const | 93 | no | const target = snapshotFile(this.dir, revision); |
| diffLearnerStates | function | 103 | yes | export function diffLearnerStates(before = {}, after = {}) { |
| oldIds | const | 104 | no | const oldIds = new Map((before.corrections ?? []).map((c) =&gt; [c.id, c])); |
| newIds | const | 105 | no | const newIds = new Map((after.corrections ?? []).map((c) =&gt; [c.id, c])); |
| oldModels | const | 106 | no | const oldModels = new Set(Object.keys(before.models ?? {})), newModels = new Set(Object.keys(after.models ?? {})); |
| calibrationCount | function | 107 | no | const calibrationCount = (state) =&gt; Object.values(state.calibrator?.bins ?? {}).reduce((sum, bins) =&gt; sum + bins.reduce((n, bin) =&gt; n + bin.n, 0), 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 4 | external |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/learn.mjs](./learn.mjs.md) | ./learner-journal.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Durable, optimistic-concurrency journal for the existing ScopedLearner JSON state.
// Only the holder of the exclusive directory lock may compare+write a revision.
// Prior immutable revisions remain addressable; rollback is another revision.
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, rmSync, readdirSync, openSync, closeSync, fsyncSync } from 'node:fs';

export class LearnerWriteConflict extends Error {
  constructor(message, code = 'LEARNER_REVISION_CONFLICT') { super(message); this.name = 'LearnerWriteConflict'; this.code = code; }
}

const digest = (data) => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const revisionOf = (state) => Number.isSafeInteger(state?.revision) && state.revision >= 0 ? state.revision : 0;
const snapshotFile = (dir, revision) => path.join(dir, 'history', `rev-${String(revision).padStart(9, '0')}.json`);

// Unique temporary files prevent racing writers from overwriting each other's .tmp.
function atomicJson(file, obj) {
  const tmp = `${file}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
  const fd = openSync(tmp, 'wx', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(obj, null, 2) + '\n');
    fsyncSync(fd);
  } finally { closeSync(fd); }
  try { renameSync(tmp, file); }
  catch (e) { try { rmSync(tmp, { force: true }); } catch {} throw e; }
}

export class LearnerJournal {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'learner.json');
    this.historyDir = path.join(dir, 'history');
    this.lockDir = path.join(dir, '.learner-write-lock');
  }
  read() {
    if (!existsSync(this.file)) return null;
    const data = JSON.parse(readFileSync(this.file, 'utf8'));
    if (data.integrity) {
      const { integrity, ...body } = data;
      if (digest(body) !== integrity) throw new Error('Learner state integrity mismatch: refusing to use corrupted data');
    }
    return data;
  }
  version() { return revisionOf(this.read()); }
  versions() {
    if (!existsSync(this.historyDir)) return [];
    return readdirSync(this.historyDir).filter((n) => /^rev-\d{9}\.json$/.test(n))
      .map((n) => Number(n.slice(4, 13))).sort((a, b) => a - b);
  }
  at(revision) {
    if (!Number.isSafeInteger(revision) || revision < 0) throw new RangeError('Invalid learner revision');
    const current = this.read();
    if (current && revisionOf(current) === revision) return current;
    const file = snapshotFile(this.dir, revision);
    if (!existsSync(file)) throw new Error(`Learner revision ${revision} not found`);
    const snap = JSON.parse(readFileSync(file, 'utf8'));
    if (revisionOf(snap) !== revision) throw new Error('Learner snapshot revision mismatch');
    if (snap.integrity) { const { integrity, ...body } = snap; if (digest(body) !== integrity) throw new Error('Learner snapshot integrity mismatch'); }
    return snap;
  }
  diff(fromRevision, toRevision = this.version()) {
    return diffLearnerStates(this.at(fromRevision), this.at(toRevision));
  }
  lineage({ limit = 50 } = {}) {
    const revisions = this.versions().slice().reverse().slice(0, Number.isInteger(limit) && limit > 0 ? limit : 50);
    return revisions.map((revision) => {
      const state = this.at(revision);
      return { revision, parentRevision: state.parentRevision ?? null, savedAt: state.savedAt ?? null,
        integrityRecorded: !!state.integrity, models: Object.keys(state.models ?? {}).length,
        acceptedCorrections: (state.corrections ?? []).filter((c) => !c.reverted && c.status !== 'rejected').length,
        pendingProposals: (state.proposals ?? []).filter((p) => p.status === 'proposed').length };
    });
  }
  commit(state, expectedRevision) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new RangeError('Invalid expected revision');
    mkdirSync(this.dir, { recursive: true });
    try { mkdirSync(this.lockDir); }
    catch (e) {
      if (e.code === 'EEXIST') throw new LearnerWriteConflict('Another writer holds the learner lock; retry after it releases', 'LEARNER_LOCKED');
      throw e;
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
