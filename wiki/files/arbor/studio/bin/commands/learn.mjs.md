# File: studio/bin/commands/learn.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/learn.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20315 B |
| Lines | 252 |
| Hash | 2baefe0ab3cd |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCOPE_CONTEXT | const | 14 | no | const SCOPE_CONTEXT = { |
| FEATURE_FLAGS | const | 22 | no | const FEATURE_FLAGS = { |
| describeField | function | 29 | no | function describeField(f) { |
| ctxFromFlags | function | 34 | no | const ctxFromFlags = (f) =&gt; ({ site: f.site, origin: f.origin, account: f.account, family: f.family, page: f.page, typeKey: f[&#39;type-key&#39;] }); |
| requireOne | function | 36 | no | function requireOne(ctx, flag, choices) { |
| v | const | 37 | no | const v = ctx.flags[flag]; |
| persist | function | 42 | no | function persist(ctx, l, what) { |
| rev | const | 43 | no | const rev = l.save(); |
| l | const | 51 | no | const l = ctx.learner(); |
| accepted | const | 52 | no | const accepted = l.corrections.filter((c) =&gt; !c.reverted &amp;&amp; c.status !== &#39;rejected&#39;); |
| byScope | const | 53 | no | const byScope = {}; for (const c of accepted) byScope[c.scope] = (byScope[c.scope] ?? 0) + 1; |
| models | const | 54 | no | const models = Object.entries(l.models).map(([key, m]) =&gt; ({ key, examples: m.examples })); |
| modelScopes | const | 55 | no | const modelScopes = {}; for (const m of models) { const k = m.key.split(&#39;:&#39;)[0]; modelScopes[k] = (modelScopes[k] ?? 0) + 1; } |
| calibration | const | 56 | no | const calibration = Object.keys(l.calibrator.bins).map((kind) =&gt; ({ kind, observations: l.calibrator.bins[kind].reduce((a, b) =&gt; a + b.n, 0), ece: l.calibrator.ece(kind) })); |
| pending | const | 57 | no | const pending = l.proposals.filter((p) =&gt; p.status === &#39;proposed&#39;); |
| sessions | const | 58 | no | const sessions = ctx.listSessions(); |
| health | const | 59 | no | const health = {}; for (const m of sessions) { const st = knowledgeState(Session.open(ctx.paths.sessions, m.id)); health[st] = (health[st] ?? 0) + 1; } |
| lastAudit | const | 60 | no | const lastAudit = l.audit.at(-1) ?? null; |
| data | const | 61 | no | const data = { |
| f | const | 93 | no | const f = ctx.flags; |
| rows | const | 94 | no | const rows = ctx.learner().corrections.filter((c) =&gt; (f.reverted \|\| !c.reverted) &amp;&amp; (!f.scope \|\| c.scope === f.scope) &amp;&amp; (!f.role \|\| c.role === f.role) &amp;&amp; (!f.site \|\| c.ctx?.site === f.site)).slice(-… |
| rows | const | 103 | no | const rows = ctx.learner().proposals.filter((p) =&gt; ctx.flags.all \|\| p.status === &#39;proposed&#39;); |
| rows | const | 115 | no | const rows = ctx.learner().audit.slice(-ctx.flags.limit).reverse(); |
| cal | const | 124 | no | const cal = ctx.learner().calibrator; |
| kinds | const | 125 | no | const kinds = Object.keys(cal.bins).filter((k) =&gt; !ctx.flags.kind \|\| k === ctx.flags.kind); |
| data | const | 126 | no | const data = kinds.map((kind) =&gt; ({ kind, ece: cal.ece(kind), bins: cal.bins[kind].map((b, i) =&gt; ({ range: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`, n: b.n, acceptRate: b.n ? +(b.pos / b… |
| l | const | 143 | no | const l = ctx.learner(); |
| revs | const | 144 | no | const revs = l.versions().slice(-ctx.flags.limit).reverse().map((r) =&gt; { let savedAt = null, actions = null; try { const snap = l.journal.at(r); savedAt = snap.savedAt ?? null; actions = (snap.audit … |
| savedAt | variable | 145 | no | let savedAt = null, actions = null; |
| rows | const | 157 | no | const rows = ctx.learner().promotionCandidates(ctx.flags[&#39;min-sites&#39;]); |
| f | const | 173 | no | const f = ctx.flags; |
| p | const | 175 | no | const p = ctx.learner().predict(f.name, describeField(f), ctxFromFlags(f)); |
| top | const | 176 | no | const top = Object.entries(p.dist).sort((a, b) =&gt; b[1] - a[1]).slice(0, f.top).map(([role, prob]) =&gt; ({ role, probability: +prob.toFixed(3) })); |
| teachFlags | const | 185 | no | const teachFlags = { name: { type: &#39;string&#39;, valueName: &#39;FIELD&#39;, desc: &#39;Field name being corrected&#39; }, role: { type: &#39;string&#39;, choices: ROLES, desc: &#39;Correct role&#39; }, scope: { type: &#39;string&#39;, choices… |
| f | const | 192 | no | const f = ctx.flags; |
| l | const | 194 | no | const l = ctx.learner(); |
| proposal | const | 195 | no | const proposal = l.proposeCorrection({ scope: f.scope, name: f.name, d: describeField(f), ctx: ctxFromFlags(f), role: f.role, weight: f.weight, note: f.note, actor: f.actor, evidence: f.evidence }); |
| saved | const | 196 | no | const saved = persist(ctx, l, &#39;propose&#39;); |
| f | const | 205 | no | const f = ctx.flags; |
| l | const | 207 | no | const l = ctx.learner(); |
| entry | const | 208 | no | const entry = l.learn({ scope: f.scope, name: f.name, d: describeField(f), ctx: ctxFromFlags(f), role: f.role, weight: f.weight, note: f.note, actor: f.actor, evidence: f.evidence }); |
| saved | const | 209 | no | const saved = persist(ctx, l, &#39;teach&#39;); |
| id | const | 218 | no | const id = needArg(ctx, 0, &#39;proposal id&#39;, &#39;studio learn review c3 accept&#39;); |
| action | const | 219 | no | const action = needArg(ctx, 1, &#39;action (accept\|reject)&#39;, &#39;studio learn review c3 accept&#39;); |
| l | const | 221 | no | const l = ctx.learner(); |
| p | const | 222 | no | const p = l.reviewCorrection(id, { action, actor: ctx.flags.actor, note: ctx.flags.note }); |
| saved | const | 223 | no | const saved = persist(ctx, l, &#39;review&#39;); |
| id | const | 232 | no | const id = needArg(ctx, 0, &#39;correction id&#39;, &#39;studio learn revert c3&#39;); |
| l | const | 233 | no | const l = ctx.learner(); |
| saved | const | 235 | no | const saved = persist(ctx, l, &#39;revert&#39;); |
| rev | const | 244 | no | const rev = Number(needArg(ctx, 0, &#39;revision number&#39;, &#39;studio learn rollback 4 --yes&#39;)); |
| l | const | 246 | no | const l = ctx.learner(); |
| newRev | const | 249 | no | const newRev = l.rollbackTo(rev, { actor: ctx.flags.actor, reason: ctx.flags.reason }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../src/intel/learn.mjs | import | 2 | [studio/src/intel/learn.mjs](../../src/intel/learn.mjs.md) |
| ../lib/registry.mjs | import | 3 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 4 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../lib/util.mjs | import | 5 | [studio/bin/lib/util.mjs](../lib/util.mjs.md) |
| ../../src/store/session.mjs | import | 6 | [studio/src/store/session.mjs](../../src/store/session.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/learn.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// learn status|corrections|proposals|audit|calibration|versions|promotions|roles|predict|propose|teach|review|revert|rollback
import { ROLES, SCOPES } from '../../src/intel/learn.mjs';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, notFound, fmtAgo, fmtPct, truncate } from '../lib/ui.mjs';
import { needArg, knowledgeState } from '../lib/util.mjs';
import { Session } from '../../src/store/session.mjs';

defineGroup('learn', {
  summary: 'Inspect and steer the adaptive learner: status, corrections, calibration, history', section: 'Learning', default: 'status', aliases: ['learning'],
  description: 'The learner assigns roles (id, text, timestamp, …) to discovered fields. Models are scoped instance > page > site > account > family > global; every correction is audited and every save is a new immutable revision, so any change can be reviewed, reverted or rolled back.',
  subAliases: { list: 'corrections', history: 'versions' },
});

const SCOPE_CONTEXT = {
  site: { type: 'string', valueName: 'SITE', desc: 'Registrable site (e.g. example.com)' },
  origin: { type: 'string', valueName: 'ORIGIN', desc: 'Exact origin (e.g. https://app.example.com)' },
  account: { type: 'string', valueName: 'ACCOUNT', desc: 'Account label (scope account)' },
  family: { type: 'string', valueName: 'FAMILY', desc: 'Provider family (e.g. ai-chat)' },
  page: { type: 'string', valueName: 'PAGE', desc: 'Page key (scope page)' },
  'type-key': { type: 'string', valueName: 'TYPE', desc: 'Type key (scope instance)' },
};
const FEATURE_FLAGS = {
  kind: { type: 'string', choices: ['string', 'integer', 'number', 'boolean'], default: 'string', desc: 'Value kind of the field (feature input)' },
  format: { type: 'string', valueName: 'FMT', desc: 'Value format hint: iso_time, uuid, url, hex_id, token_id, markdown' },
  'avg-len': { type: 'number', valueName: 'N', desc: 'Average string length (feature input)' },
  unique: { type: 'number', valueName: '0-1', desc: 'Uniqueness ratio (feature input)' },
};

function describeField(f) {
  if (f.kind === 'boolean') return { type: 'boolean', boolean: { trueShare: 0.5 } };
  if (f.kind === 'integer' || f.kind === 'number') return { type: f.kind, number: { format: f.format, uniqueness: f.unique ?? 0.5, changeRate: 0.05, min: 0, max: f.kind === 'integer' ? 100 : 99.5 } };
  return { type: 'string', string: { formats: f.format ? { [f.format]: 1 } : {}, avgLen: f['avg-len'] ?? 12, uniqueness: f.unique ?? 0.5 } };
}
const ctxFromFlags = (f) => ({ site: f.site, origin: f.origin, account: f.account, family: f.family, page: f.page, typeKey: f['type-key'] });

function requireOne(ctx, flag, choices) {
  const v = ctx.flags[flag];
  if (!v) throw usageError(`--${flag} is required.`, choices ? `One of: ${choices.join(', ')}` : undefined);
  return v;
}

function persist(ctx, l, what) {
  const rev = l.save();
  return { revision: rev, saved: rev !== null, what };
}

// ---------------------------------------------------------------------------------------------
define({
  name: 'learn status', section: 'Learning', summary: 'Learner revision, scoped models, corrections, calibration and knowledge health',
  async run(ctx) {
    const l = ctx.learner();
    const accepted = l.corrections.filter((c) => !c.reverted && c.status !== 'rejected');
    const byScope = {}; for (const c of accepted) byScope[c.scope] = (byScope[c.scope] ?? 0) + 1;
    const models = Object.entries(l.models).map(([key, m]) => ({ key, examples: m.examples }));
    const modelScopes = {}; for (const m of models) { const k = m.key.split(':')[0]; modelScopes[k] = (modelScopes[k] ?? 0) + 1; }
    const calibration = Object.keys(l.calibrator.bins).map((kind) => ({ kind, observations: l.calibrator.bins[kind].reduce((a, b) => a + b.n, 0), ece: l.calibrator.ece(kind) }));
    const pending = l.proposals.filter((p) => p.status === 'proposed');
    const sessions = ctx.listSessions();
    const health = {}; for (const m of sessions) { const st = knowledgeState(Session.open(ctx.paths.sessions, m.id)); health[st] = (health[st] ?? 0) + 1; }
    const lastAudit = l.audit.at(-1) ?? null;
    const data = {
      dir: ctx.paths.learner, revision: l.revision, revisions: l.versions().length,
      global: { priorAndLearnedExamples: l.global.examples },
      scopedModels: { count: models.length, byScope: modelScopes, examples: models.reduce((a, m) => a + m.examples, 0) },
      overrides: Object.keys(l.overrides).length,
      corrections: { active: accepted.length, byScope, reverted: l.corrections.filter((c) => c.reverted).length },
      proposals: { pending: pending.length, accepted: l.proposals.filter((p) => p.status === 'accepted').length, rejected: l.proposals.filter((p) => p.status === 'rejected').length },
      calibration, promotionCandidates: l.promotionCandidates().length,
      sessions: { total: sessions.length, knowledge: health }, lastAudit,
    };
    ctx.out.emit(data, (o) => {
      o.heading('Learner');
      o.kv([['state', data.dir], ['revision', `${data.revision} (${data.revisions} stored)`], ['global model', `${data.global.priorAndLearnedExamples} examples (priors + promoted corrections)`],
        ['scoped models', `${data.scopedModels.count} (${Object.entries(modelScopes).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}), ${data.scopedModels.examples} examples`], ['instance overrides', data.overrides],
        ['corrections', `${data.corrections.active} active${Object.keys(byScope).length ? ` (${Object.entries(byScope).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''}, ${data.corrections.reverted} reverted`],
        ['proposals', `${data.proposals.pending} pending, ${data.proposals.accepted} accepted, ${data.proposals.rejected} rejected`], ['promotion candidates', data.promotionCandidates]]);
      o.line(''); o.heading('Calibration (does stated confidence match acceptance?)');
      o.table(calibration, [{ title: 'KIND', key: 'kind' }, { title: 'OBSERVATIONS', key: 'observations', align: 'right' }, { title: 'ECE', get: (c) => (c.ece === null ? '-' : c.ece.toFixed(3)), align: 'right' }], { indent: 2, empty: 'No decisions recorded yet; accept or reject suggestions to calibrate.' });
      o.line(''); o.heading('Knowledge across saved sessions');
      o.line(`  ${sessions.length} session(s): ${Object.entries(health).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}`);
```

_First 80 of 253 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
