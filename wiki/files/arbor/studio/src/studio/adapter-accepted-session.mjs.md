# File: studio/src/studio/adapter-accepted-session.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-accepted-session.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4008 B |
| Lines | 60 |
| Hash | 16198d36b131 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACCEPTED_SESSION_PRODUCER | const | 9 | yes | export const ACCEPTED_SESSION_PRODUCER = &#39;accepted-session-dom-turns/1&#39;; |
| ROLE_ATTRIBUTE | const | 10 | no | const ROLE_ATTRIBUTE = /^data-[a-zA-Z0-9-]{1,94}$/; |
| hash | function | 11 | no | const hash = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| fail | function | 12 | no | const fail = code =&gt; { throw Object.assign(new Error(code), { code }); }; |
| bounded | function | 13 | no | const bounded = (s, cap = 320) =&gt; typeof s === &#39;string&#39; &amp;&amp; s.length &gt; 0 &amp;&amp; s.length &lt;= cap &amp;&amp; !/[\\x00-\\x1f\\x7f]/.test(s); |
| domEvidenceRef | function | 15 | yes | export function domEvidenceRef(sessionId, digest) { |
| acceptedSessionToAdapterEvents | function | 20 | yes | export function acceptedSessionToAdapterEvents({ scope, verified } = {}) { |
| session | const | 22 | no | const session = verified?.session, acceptance = verified?.acceptance; |
| admission | const | 23 | no | const admission = profileAdmission(acceptance, { validatedByCore: true }); |
| observedOrigin | variable | 31 | no | let observedOrigin; |
| turns | const | 35 | no | const turns = session.kv.get(&#39;DOM_TURNS&#39;, null); |
| ref | const | 37 | no | const ref = domEvidenceRef(session.id, verified.domDigest), dom = [], seen = new Set(); |
| t | const | 39 | no | const t = turns[i], role = t?.role, attr = t?.roleAttribute; |
| key | const | 44 | no | const key = attr + &#39;:&#39; + role + &#39;:&#39; + (t.roleMatch === &#39;suffix&#39; ? &#39;suffix&#39; : &#39;exact&#39;); |
| source | const | 52 | no | const source = { producer: ACCEPTED_SESSION_PRODUCER, captureId: session.id, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| ../intel/profile-evidence.mjs | import | 5 | [studio/src/intel/profile-evidence.mjs](../intel/profile-evidence.mjs.md) |
| ./adapter-evidence-intake.mjs | import | 6 | [studio/src/studio/adapter-evidence-intake.mjs](./adapter-evidence-intake.mjs.md) |
| ./adapter-capture-to-signals.mjs | import | 7 | [studio/src/studio/adapter-capture-to-signals.mjs](./adapter-capture-to-signals.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-learning-pipeline.mjs](./adapter-learning-pipeline.mjs.md) | ./adapter-accepted-session.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Server-only bridge from Core-accepted saved sessions into the existing I1 adapter events.
// Only DOM_TURNS is covered by acceptance.domDigest. No unbound SHAPES/route evidence,
// browser effects, text, or guessed account/native-conversation identity is admitted.
import { createHash } from 'node:crypto';
import { profileAdmission } from '../intel/profile-evidence.mjs';
import { scopeKey } from './adapter-evidence-intake.mjs';
import { captureToAdapterEvents } from './adapter-capture-to-signals.mjs';

export const ACCEPTED_SESSION_PRODUCER = 'accepted-session-dom-turns/1';
const ROLE_ATTRIBUTE = /^data-[a-zA-Z0-9-]{1,94}$/;
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const bounded = (s, cap = 320) => typeof s === 'string' && s.length > 0 && s.length <= cap && !/[\x00-\x1f\x7f]/.test(s);

export function domEvidenceRef(sessionId, digest) {
  if (!bounded(sessionId, 128) || !/^[a-f0-9]{64}$/.test(digest ?? '')) fail('DOM_EVIDENCE_ID_INVALID');
  return 'DOM_TURNS:' + hash(JSON.stringify([sessionId, digest]));
}

export function acceptedSessionToAdapterEvents({ scope, verified } = {}) {
  scopeKey(scope);
  const session = verified?.session, acceptance = verified?.acceptance;
  const admission = profileAdmission(acceptance, { validatedByCore: true });
  if (!session?.kv?.get || !bounded(session.id, 128) || !admission.eligible ||
      verified.rawDigest !== acceptance.binding.rawDigest || verified.domDigest !== acceptance.binding.domDigest)
    fail('SESSION_NOT_CORE_ACCEPTED');
  const range = acceptance.binding.seqRange;
  if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] > range[1])
    fail('ACCEPTANCE_SEQUENCE_UNBOUND');
  // The attached target is the session origin. Receipt/DOM_INSPECT are not acceptance-bound.
  let observedOrigin;
  try { observedOrigin = new URL(session.meta?.target?.url).origin; } catch { fail('SESSION_ORIGIN_UNBOUND'); }
  if (observedOrigin !== scope.origin || (session.meta?.site && session.meta.site !== scope.siteId))
    fail('SESSION_SCOPE_MISMATCH');
  const turns = session.kv.get('DOM_TURNS', null);
  if (!Array.isArray(turns) || turns.length > 10000) fail('DOM_TURNS_INVALID');
  const ref = domEvidenceRef(session.id, verified.domDigest), dom = [], seen = new Set();
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i], role = t?.role, attr = t?.roleAttribute;
    // Respect the observer's exact/suffix match contract (including ChatGPT's
    // data-content-search-unit-key), without disclosing DOM handles or raw text.
    if (!['user', 'assistant'].includes(role) || !ROLE_ATTRIBUTE.test(attr ?? '') ||
        (t.roleMatch != null && !['exact', 'suffix'].includes(t.roleMatch)) || !bounded(t.domId)) continue;
    const key = attr + ':' + role + ':' + (t.roleMatch === 'suffix' ? 'suffix' : 'exact');
    if (seen.has(key)) continue;
    seen.add(key);
    dom.push({ attributes: { [attr]: role }, role, roleAttribute: attr,
      roleMatch: t.roleMatch === 'suffix' ? 'suffix' : 'exact', outcome: 'present',
      identity: { verified: true, role, evidenceRef: ref,
        ref: 'bound-dom-turn:' + hash(JSON.stringify([verified.domDigest, i, t.domId])) } });
  }
  const source = { producer: ACCEPTED_SESSION_PRODUCER, captureId: session.id,
    sessionId: session.id, sequence: range[1], rawDigest: verified.rawDigest,
    domDigest: verified.domDigest, origin: scope.origin, accountRef: scope.accountRef,
    accountBinding: 'caller-scoped-unverified', carrier: 'dom', coverage: 'complete',
    evidenceClass: 'SAVED_REAL_CAPTURE', evidenceRef: ref,
    provenance: { artifact: 'DOM_TURNS', acceptanceSchema: acceptance.schema,
      sequenceRange: [...range], rawDigest: verified.rawDigest, domDigest: verified.domDigest } };
  return captureToAdapterEvents([{ scope: { ...scope }, source, dom }]);
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
