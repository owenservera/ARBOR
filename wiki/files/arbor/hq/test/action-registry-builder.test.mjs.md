# File: hq/test/action-registry-builder.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/action-registry-builder.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10369 B |
| Lines | 254 |
| Hash | 4914d7b06b8e |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 17 | no | function fixture({ handlers } = {}) { |
| action | function | 49 | no | function action(over = {}) { |
| sum | function | 66 | no | const sum = (map) =&gt; Object.values(map).reduce((total, n) =&gt; total + n, 0); |
| actions | const | 70 | no | const actions = buildActions(fixture()); |
| actions | const | 96 | no | const actions = buildActions({ domains: [{ name: &#39;Docs&#39;, purpose: &#39;document work&#39;, objects: [{ name: &#39;Team-Session&#39;, purpose: &#39;a joint session&#39; }] }], verbs: [{ verb: &#39;Read&#39;, risk: &#39;low&#39;, mutates: fa… |
| actions | const | 112 | no | const actions = buildActions(fixture()); |
| byId | const | 113 | no | const byId = Object.fromEntries(actions.map((a) =&gt; [a.id, a])); |
| shared | const | 135 | no | const shared = { |
| duplicated | const | 145 | no | const duplicated = { |
| thrown | variable | 151 | no | let thrown = null; |
| actions | const | 176 | no | const actions = buildActions(fixture()); |
| summary | const | 177 | no | const summary = summarize(actions); |
| summary | const | 191 | no | const summary = summarize([action(), action({ id: &#39;docs.read.board&#39;, actors: [] })]); |
| actions | const | 201 | no | const actions = buildActions(fixture()); |
| verdict | const | 202 | no | const verdict = validate(actions); |
| verdict | const | 211 | no | const verdict = validate([ action(), action(), // same id twice action({ id: &#39;docs.read.board&#39;, actors: [] }), action({ id: &#39;docs.publish.note&#39;, risk: &#39;high&#39;, mutates: true, approval: false }), |
| cases | const | 236 | no | const cases = [ |
| verdict | const | 244 | no | const verdict = validate(list); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| ../lib/action-registry.mjs | import | 10 | [hq/lib/action-registry.mjs](../lib/action-registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The action registry must expand three injected taxonomies without inventing one, and must name what it refuses |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | action-registry |
| 5 | invariant | — | — | every case builds a synthetic two-domain fixture; no case reads the real action taxonomy |
| 6 | invariant | — | — | a defect is asserted through its problem code and its id, never through a helper&#39;s opinion |
| 7 | see | — | hq/lib/action-registry.mjs | hq/lib/action-registry.mjs |

## Excerpt

```javascript
/**
 * @hq:context The action registry must expand three injected taxonomies without inventing one, and must name what it refuses
 * @hq:owner hq-agent
 * @hq:task action-registry
 * @hq:invariant every case builds a synthetic two-domain fixture; no case reads the real action taxonomy
 * @hq:invariant a defect is asserted through its problem code and its id, never through a helper's opinion
 * @hq:see hq/lib/action-registry.mjs
 */
import { describe, expect, test } from 'bun:test';
import { ACTION_STATUSES, buildActions, summarize, validate } from '../lib/action-registry.mjs';

/**
 * Two domains, two objects each, two verbs. Small enough to read in one glance,
 * and shaped so exactly one domain is wired to each verb — which is what makes
 * the wired/declared split visible without reading the implementation.
 */
function fixture({ handlers } = {}) {
  return {
    domains: [
      {
        name: 'docs',
        purpose: 'document work',
        objects: [
          { name: 'note', purpose: 'a written note' },
          { name: 'board', purpose: 'a place notes collect' },
        ],
      },
      {
        name: 'team',
        purpose: 'people work',
        objects: [
          { name: 'session', purpose: 'a working session' },
          { name: 'seat', purpose: 'an assignable seat' },
        ],
      },
    ],
    verbs: [
      { verb: 'read', purpose: 'look at', risk: 'low', mutates: false, actors: ['agent'], approval: false },
      { verb: 'publish', purpose: 'make public', risk: 'high', mutates: true, actors: ['agent', 'owner'], approval: true },
    ],
    handlers: handlers ?? {
      'docs.read': { command: 'hq docs read', note: 'read one document' },
      'team.publish': { command: 'hq team publish', note: 'publish one team object' },
    },
  };
}

/** A single well-formed action, for the validator cases where the fixture would add noise. */
function action(over = {}) {
  return {
    id: 'docs.read.note',
    domain: 'docs',
    verb: 'read',
    object: 'note',
    purpose: 'read note — document work: a written note',
    risk: 'low',
    mutates: false,
    actors: ['agent'],
    approval: false,
    status: 'declared',
    handler: null,
    ...over,
  };
}

const sum = (map) => Object.values(map).reduce((total, n) => total + n, 0);

describe('buildActions — one flat list from three injected taxonomies', () => {
  test('two domains of two objects and two verbs produce eight actions', () => {
    const actions = buildActions(fixture());

    expect(actions).toHaveLength(8);
    expect(actions.map((a) => a.id)).toEqual([
      'docs.read.note',
      'docs.read.board',
      'docs.publish.note',
      'docs.publish.board',
      'team.read.session',
      'team.read.seat',
      'team.publish.session',
```

_First 80 of 255 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
