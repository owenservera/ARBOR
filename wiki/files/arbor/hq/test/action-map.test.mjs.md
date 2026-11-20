# File: hq/test/action-map.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/action-map.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7668 B |
| Lines | 178 |
| Hash | 30ef1fd0b120 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DOMAIN_FILES | const | 26 | no | const DOMAIN_FILES = [DOMAINS_1, DOMAINS_2, DOMAINS_3, DOMAINS_4]; |
| DOMAINS | const | 27 | no | const DOMAINS = DOMAIN_FILES.flat(); |
| ACTIONS | const | 28 | no | const ACTIONS = buildActions({ domains: DOMAINS, verbs: VERBS, handlers: HANDLERS }); |
| DOMAIN_COUNT | const | 30 | no | const DOMAIN_COUNT = 20; |
| OBJECTS_PER_DOMAIN | const | 31 | no | const OBJECTS_PER_DOMAIN = 10; |
| VERB_COUNT | const | 32 | no | const VERB_COUNT = 10; |
| ACTIONS_PER_DOMAIN | const | 33 | no | const ACTIONS_PER_DOMAIN = OBJECTS_PER_DOMAIN * VERB_COUNT; // 100 |
| EXPECTED_TOTAL | const | 34 | no | const EXPECTED_TOTAL = DOMAIN_COUNT * ACTIONS_PER_DOMAIN; // 2000 |
| ID_PATTERN | const | 35 | no | const ID_PATTERN = /^[a-z0-9-]+\\.[a-z]+\\.[a-z0-9-]+$/; |
| HANDLER_KEYS | const | 38 | no | const HANDLER_KEYS = new Set(Object.keys(HANDLERS ?? {}).map((key) =&gt; String(key).trim().toLowerCase())); |
| countBy | function | 40 | no | function countBy(list, pick) { |
| counts | const | 41 | no | const counts = new Map(); |
| key | const | 43 | no | const key = pick(item); |
| sumValues | function | 49 | no | function sumValues(map) { |
| asQuery | function | 54 | no | function asQuery(value) { |
| ids | const | 73 | no | const ids = ACTIONS.map((action) =&gt; action.id); |
| malformed | const | 76 | no | const malformed = ids.filter((id) =&gt; !ID_PATTERN.test(id)); |
| mismatched | const | 79 | no | const mismatched = ACTIONS |
| badObjects | const | 90 | no | const badObjects = DOMAINS |
| counts | const | 95 | no | const counts = countBy(ACTIONS, (action) =&gt; action.domain); |
| summary | const | 103 | no | const summary = summarize(ACTIONS); |
| result | const | 116 | no | const result = validate(ACTIONS); |
| mismatches | const | 124 | no | const mismatches = []; |
| handlerKey | const | 126 | no | const handlerKey = `${action.domain}.${action.verb}`; |
| hasHandler | const | 127 | no | const hasHandler = HANDLER_KEYS.has(handlerKey); |
| isWired | const | 128 | no | const isWired = action.status === &#39;wired&#39;; |
| wired | const | 135 | no | const wired = ACTIONS.filter((action) =&gt; action.status === &#39;wired&#39;).length; |
| declared | const | 136 | no | const declared = ACTIONS.length - wired; |
| result | const | 145 | no | const result = route(ACTIONS, query); |
| none | const | 150 | no | const none = route(ACTIONS, &#39;zzz nonsense zzz&#39;); |
| expanded | const | 158 | no | const expanded = asQuery(expand(&#39;rename a conversation&#39;)); |
| result | const | 161 | no | const result = route(ACTIONS, expanded); |
| wrong | const | 169 | no | const wrong = []; |
| line | const | 171 | no | const line = describeAction(action); |
| parts | const | 172 | no | const parts = line.split(&#39; · &#39;); |
| namesFields | const | 173 | no | const namesFields = parts[1] === action.risk &amp;&amp; parts[3] === action.status; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 15 | external |
| ../lib/action-registry.mjs | import | 16 | [hq/lib/action-registry.mjs](../lib/action-registry.mjs.md) |
| ../lib/action-router.mjs | import | 17 | [hq/lib/action-router.mjs](../lib/action-router.mjs.md) |
| ../lib/actions/verbs.mjs | import | 18 | [hq/lib/actions/verbs.mjs](../lib/actions/verbs.mjs.md) |
| ../lib/actions/domains-1.mjs | import | 19 | [hq/lib/actions/domains-1.mjs](../lib/actions/domains-1.mjs.md) |
| ../lib/actions/domains-2.mjs | import | 20 | [hq/lib/actions/domains-2.mjs](../lib/actions/domains-2.mjs.md) |
| ../lib/actions/domains-3.mjs | import | 21 | [hq/lib/actions/domains-3.mjs](../lib/actions/domains-3.mjs.md) |
| ../lib/actions/domains-4.mjs | import | 22 | [hq/lib/actions/domains-4.mjs](../lib/actions/domains-4.mjs.md) |
| ../lib/actions/handlers.mjs | import | 23 | [hq/lib/actions/handlers.mjs](../lib/actions/handlers.mjs.md) |
| ../lib/actions/aliases.mjs | import | 24 | [hq/lib/actions/aliases.mjs](../lib/actions/aliases.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | The whole action map composes: 20 domains x 10 objects x 10 verbs must build one 2000-action |
| 5 | owner | hq-agent | — | hq-agent |
| 6 | task | — | — | action-map |
| 7 | invariant | — | — | the expected total is arithmetic (20 x 10 x 10), never read back from the catalog, so a |
| 9 | invariant | — | — | wired and declared are asserted in both directions against the HANDLERS keys, so a status |
| 11 | invariant | — | — | nonsense must be NO_MATCH with an empty match list, so a plausible-looking wrong answer |
| 13 | see | — | hq/lib/action-registry.mjs | hq/lib/action-registry.mjs · hq/lib/action-router.mjs · hq/lib/actions/verbs.mjs |

## Excerpt

```javascript
/**
 * @hq:context The whole action map composes: 20 domains x 10 objects x 10 verbs must build one 2000-action
 *   catalog whose ids address, whose summary partitions, whose validation is clean, whose status follows
 *   HANDLERS, and which the router can reach from a plain-English sentence.
 * @hq:owner hq-agent
 * @hq:task action-map
 * @hq:invariant the expected total is arithmetic (20 x 10 x 10), never read back from the catalog, so a
 *   shrunken taxonomy fails instead of quietly redefining success.
 * @hq:invariant wired and declared are asserted in both directions against the HANDLERS keys, so a status
 *   that disagrees with the handler table fails whichever side is wrong.
 * @hq:invariant nonsense must be NO_MATCH with an empty match list, so a plausible-looking wrong answer
 *   cannot pass as routing.
 * @hq:see hq/lib/action-registry.mjs · hq/lib/action-router.mjs · hq/lib/actions/verbs.mjs
 */
import { describe, expect, test } from 'bun:test';
import { buildActions, summarize, validate } from '../lib/action-registry.mjs';
import { NO_MATCH, describe as describeAction, route } from '../lib/action-router.mjs';
import { VERBS } from '../lib/actions/verbs.mjs';
import { DOMAINS as DOMAINS_1 } from '../lib/actions/domains-1.mjs';
import { DOMAINS as DOMAINS_2 } from '../lib/actions/domains-2.mjs';
import { DOMAINS as DOMAINS_3 } from '../lib/actions/domains-3.mjs';
import { DOMAINS as DOMAINS_4 } from '../lib/actions/domains-4.mjs';
import { HANDLERS } from '../lib/actions/handlers.mjs';
import { expand } from '../lib/actions/aliases.mjs';

const DOMAIN_FILES = [DOMAINS_1, DOMAINS_2, DOMAINS_3, DOMAINS_4];
const DOMAINS = DOMAIN_FILES.flat();
const ACTIONS = buildActions({ domains: DOMAINS, verbs: VERBS, handlers: HANDLERS });

const DOMAIN_COUNT = 20;
const OBJECTS_PER_DOMAIN = 10;
const VERB_COUNT = 10;
const ACTIONS_PER_DOMAIN = OBJECTS_PER_DOMAIN * VERB_COUNT; // 100
const EXPECTED_TOTAL = DOMAIN_COUNT * ACTIONS_PER_DOMAIN; // 2000
const ID_PATTERN = /^[a-z0-9-]+\.[a-z]+\.[a-z0-9-]+$/;

/** Handler keys normalized exactly as the registry's handlerIndex does, so casing cannot fake a match. */
const HANDLER_KEYS = new Set(Object.keys(HANDLERS ?? {}).map((key) => String(key).trim().toLowerCase()));

function countBy(list, pick) {
  const counts = new Map();
  for (const item of list) {
    const key = pick(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function sumValues(map) {
  return Object.values(map ?? {}).reduce((total, value) => total + value, 0);
}

/** Accept the text (or text-bearing object) an alias expander may return, so this test pins composition, not shape. */
function asQuery(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(String).join(' ');
  if (value && typeof value === 'object') {
    for (const key of ['text', 'query', 'expanded', 'value']) {
      if (typeof value[key] === 'string') return value[key];
    }
  }
  return '';
}

describe('the catalog', () => {
  test('is exactly 2000 actions: 20 domains x 10 objects x 10 verbs', () => {
    expect(ACTIONS).toHaveLength(EXPECTED_TOTAL);
    expect(VERBS).toHaveLength(VERB_COUNT);
    expect(DOMAINS).toHaveLength(DOMAIN_COUNT);
  });

  test('every id is unique and reads domain.verb.object', () => {
    const ids = ACTIONS.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);

    const malformed = ids.filter((id) => !ID_PATTERN.test(id));
    expect(malformed).toEqual([]);

    const mismatched = ACTIONS
      .filter((action) => action.id !== `${action.domain}.${action.verb}.${action.object}`)
```

_First 80 of 179 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
