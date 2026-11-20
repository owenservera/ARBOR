# File: studio/src/studio/commands.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/commands.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 33273 B |
| Lines | 734 |
| Hash | 7d5b1e31582d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFERRED_EFFECT | const | 25 | no | const DEFERRED_EFFECT = &#39;deferred: no live provider/browser work&#39;; |
| ID_PART | const | 29 | no | const ID_PART = &#39;[a-z0-9-]{1,60}&#39;; |
| CONVERSATION_SHAPE | const | 30 | no | const CONVERSATION_SHAPE = `^c-${ID_PART}$`; |
| PROJECT_SHAPE | const | 31 | no | const PROJECT_SHAPE = `^p-${ID_PART}$`; |
| WORLD_REFERENCE_SHAPE | const | 32 | no | const WORLD_REFERENCE_SHAPE = `^[cnpos]-${ID_PART}$`; |
| SELECTION_SHAPE | const | 33 | no | const SELECTION_SHAPE = `^s-${ID_PART}$`; |
| SOURCE_SHAPE | const | 34 | no | const SOURCE_SHAPE = &#39;^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$&#39;; |
| COMMAND_ID_RE | const | 35 | no | const COMMAND_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/; |
| ROUTE_TOKEN_RE | const | 36 | no | const ROUTE_TOKEN_RE = /^[a-z0-9@+?!$%^*=~_.-]{1,64}$/i; |
| LOCAL_KINDS | const | 37 | no | const LOCAL_KINDS = Object.freeze([&#39;message&#39;, &#39;project&#39;, &#39;note&#39;, &#39;source-reference&#39;, &#39;selection&#39;]); |
| IMPORT_FORMATS | const | 38 | no | const IMPORT_FORMATS = Object.freeze([&#39;json&#39;, &#39;jsonl&#39;]); |
| stringField | function | 40 | no | const stringField = (maxLength, extra = {}) =&gt; ({ type: &#39;string&#39;, minLength: 1, maxLength, ...extra }); |
| schema | function | 41 | no | const schema = (properties, required) =&gt; Object.freeze({ type: &#39;object&#39;, properties, required: Object.freeze(required), additionalProperties: false }); |
| CATEGORIES | const | 43 | no | const CATEGORIES = Object.freeze([&#39;navigation&#39;, &#39;query&#39;, &#39;creation&#39;, &#39;organization&#39;, &#39;transfer&#39;, &#39;effect&#39;]); |
| FAMILY_ID_RE | const | 44 | no | const FAMILY_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/; |
| SYMBOL_RE | const | 47 | no | const SYMBOL_RE = /^[?+/@!~^=$%*][a-z0-9-]*(?:\\/[a-z0-9-]+)*$/; |
| COMMAND_FAMILIES | const | 51 | no | const COMMAND_FAMILIES = deepFreeze([ // navigation { id: &#39;open-saved-conversation&#39;, category: &#39;navigation&#39;, |
| COMMAND_SYMBOLS | const | 198 | yes | export const COMMAND_SYMBOLS = deepFreeze(Object.fromEntries( COMMAND_FAMILIES.flatMap((family) =&gt; family.symbols.map((symbol) =&gt; [symbol, family.commandId])), )); |
| COMMANDS | const | 202 | no | const COMMANDS = deepFreeze([ { id: &#39;open-conversation&#39;, summary: &#39;Open a saved conversation for local reading.&#39;, inputs: schema({ |
| SCOPES | const | 321 | no | const SCOPES = new Set([&#39;read&#39;, &#39;local-write&#39;, &#39;external-effect&#39;]); |
| knownCategories | const | 329 | no | const knownCategories = new Set(CATEGORIES); |
| familyIds | const | 330 | no | const familyIds = new Set(); |
| familyOwners | const | 331 | no | const familyOwners = new Map(); |
| familyById | const | 332 | no | const familyById = new Map(); |
| command | const | 338 | no | const command = COMMANDS.find((entry) =&gt; entry.id === family.commandId); |
| key | const | 346 | no | const key = normalizeCommandInput(symbol); |
| spec | const | 353 | no | const spec = command.inputs.properties[key]; |
| symbolOwners | const | 361 | no | const symbolOwners = new Map(); |
| key | const | 364 | no | const key = normalizeCommandInput(symbol); |
| deepFreeze | function | 369 | no | function deepFreeze(value) { |
| snapshot | function | 378 | no | function snapshot(value) { |
| normalizeCommandInput | function | 386 | yes | export function normalizeCommandInput(value) { |
| publicCommand | function | 390 | no | function publicCommand(command) { |
| publicFamily | function | 409 | no | function publicFamily(family) { |
| command | const | 410 | no | const command = commandById(family.commandId); |
| listCommandFamilies | function | 427 | yes | export function listCommandFamilies() { |
| familyFor | function | 431 | no | function familyFor(input) { |
| normalized | const | 433 | no | const normalized = normalizeCommandInput(input); |
| commandById | function | 438 | no | function commandById(id) { |
| exactCommand | function | 442 | no | function exactCommand(input) { |
| normalized | const | 444 | no | const normalized = normalizeCommandInput(input); |
| family | const | 446 | no | const family = familyFor(normalized); |
| scoreCommand | function | 450 | no | function scoreCommand(normalized, command) { |
| score | variable | 451 | no | let score = 0; |
| tokens | const | 455 | no | const tokens = normalized.split(/[^a-z0-9]+/).filter((token) =&gt; token.length &gt;= 2); |
| candidatesFor | function | 465 | no | function candidatesFor(input) { |
| normalized | const | 466 | no | const normalized = typeof input === &#39;string&#39; ? normalizeCommandInput(input) : &#39;&#39;; |
| scoreFamily | function | 473 | no | function scoreFamily(normalized, family) { |
| score | variable | 474 | no | let score = 0; |
| tokens | const | 478 | no | const tokens = normalized.split(/[^a-z0-9]+/).filter((token) =&gt; token.length &gt;= 2); |
| familyCandidatesFor | function | 489 | no | function familyCandidatesFor(normalized) { |
| interpretCommandInput | function | 504 | yes | export function interpretCommandInput(input) { |
| normalized | const | 505 | no | const normalized = typeof input === &#39;string&#39; ? normalizeCommandInput(input) : &#39;&#39;; |
| family | const | 526 | no | const family = familyFor(normalized); |
| command | const | 528 | no | const command = commandById(family.commandId); |
| exactCommandMatch | const | 538 | no | const exactCommandMatch = exactCommand(normalized); |
| familyCandidates | const | 549 | no | const familyCandidates = familyCandidatesFor(normalized); |
| candidates | const | 550 | no | const candidates = familyCandidates.length |
| CONTROL_RE | const | 565 | no | const CONTROL_RE = /[\\u0000-\\u001f\\u007f]/; |
| MULTILINE_CONTROL_RE | const | 567 | no | const MULTILINE_CONTROL_RE = /[\\u0000-\\u0008\\u000b-\\u001f\\u007f]/; |
| controlChars | function | 569 | no | function controlChars(value, multiline = false) { |
| checkValue | function | 573 | no | function checkValue(key, spec, value, errors, uncertain) { |
| validateArgs | function | 588 | no | function validateArgs(command, args) { |
| errors | const | 589 | no | const errors = []; |
| uncertain | const | 590 | no | const uncertain = []; |
| plain | function | 593 | no | const plain = (value) =&gt; { |
| prototype | const | 595 | no | const prototype = Object.getPrototypeOf(value); |
| properties | const | 600 | no | const properties = command.inputs.properties; |
| keys | const | 601 | no | const keys = Object.keys(args); |
| previewOf | function | 614 | no | function previewOf(command, args) { |
| checked | const | 615 | no | const checked = validateArgs(command, args); |
| external | const | 616 | no | const external = command.scope === &#39;external-effect&#39;; |
| errors | const | 617 | no | const errors = external ? [command.unavailableReason, ...checked.errors] : checked.errors; |
| valid | const | 618 | no | const valid = errors.length === 0; |
| uncertain | const | 619 | no | const uncertain = external |
| wouldDo | const | 623 | no | const wouldDo = external |
| unknownPreview | function | 642 | no | function unknownPreview(input) { |
| gateRouteId | function | 655 | no | function gateRouteId(id) { |
| gateBody | function | 663 | no | function gateBody(body) { |
| prototype | const | 665 | no | const prototype = body &amp;&amp; typeof body === &#39;object&#39; ? Object.getPrototypeOf(body) : false; |
| encoded | variable | 669 | no | let encoded; |
| gateInput | function | 678 | no | function gateInput(value) { |
| createCommandCatalog | function | 685 | yes | export function createCommandCatalog() { |
| command | const | 691 | no | const command = exactCommand(id); |
| command | const | 695 | no | const command = exactCommand(input); |
| normalized | const | 696 | no | const normalized = typeof input === &#39;string&#39; ? normalizeCommandInput(input) : &#39;&#39;; |
| command | const | 701 | no | const command = exactCommand(id); |
| registerCommandRoutes | function | 709 | yes | export function registerCommandRoutes(router) { |
| add | const | 710 | no | const add = router?.add; |
| catalog | const | 712 | no | const catalog = createCommandCatalog(); |
| resolved | const | 717 | no | const resolved = catalog.resolve(gateInput(q.symbol)); |
| id | const | 724 | no | const id = gateRouteId(p?.id); |
| command | const | 725 | no | const command = catalog.describe(id); |
| id | const | 730 | no | const id = gateRouteId(p?.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./http.mjs | import | 23 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./commands.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// C-10 semantic command catalog. Preview and description only.
// This module does not read a store, open a browser, contact a provider, or perform a command.
//
// A preview response never carries a run-now claim:
//   - valid / canProceed only mean the arguments passed the catalog schema (never permission to run);
//   - wouldRequireConfirmation says a confirmation gate would precede any future write;
//   - no code path in this module performs anything.
//
// Error codes reuse the world vocabulary: malformed gate input throws WORLD_INVALID_INPUT (same
// class as the world route input gates). No command-specific codes exist. Unknown command ids
// resolve as data in a 200 response ({ found: false, candidates }) so suggestions survive the
// hub serializer, which only forwards { error, code, ...storeFields } for thrown errors.
//
// Symbols (`/find`, `+/project`, ...) cannot be route path tokens; they resolve as data via
// GET /commands?symbol=%2Ffind, which returns the route-safe command id for describe/preview.
//
// Symbols are grouped into semantic families (COMMAND_FAMILIES): a family is one intent vocabulary
// (query text, attach to project, export selection, ...) that resolves to exactly one of the same
// seven previewed commands. Families add vocabulary and interpretation, never authority: a family
// may suggest argument values, but it can not merge them into a caller's arguments, and the preview
// gate validates only what the caller actually passes. interpretCommandInput is a pure lookup over
// frozen data: symbol/intent -> candidate command(s), with no store, network, browser, or mutation.
import { problem } from './http.mjs';

const DEFERRED_EFFECT = 'deferred: no live provider/browser work';
// World id grammar (same families as src/studio/world-service.mjs / world-relations.mjs):
// c-<40 hex> observed / c-i<38 hex> imported conversations; p- projects; n- notes;
// o- source references; s- selections. Shape-only here: the store remains the identity owner.
const ID_PART = '[a-z0-9-]{1,60}';
const CONVERSATION_SHAPE = `^c-${ID_PART}$`;
const PROJECT_SHAPE = `^p-${ID_PART}$`;
const WORLD_REFERENCE_SHAPE = `^[cnpos]-${ID_PART}$`;
const SELECTION_SHAPE = `^s-${ID_PART}$`;
const SOURCE_SHAPE = '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$';
const COMMAND_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ROUTE_TOKEN_RE = /^[a-z0-9@+?!$%^*=~_.-]{1,64}$/i;
const LOCAL_KINDS = Object.freeze(['message', 'project', 'note', 'source-reference', 'selection']);
const IMPORT_FORMATS = Object.freeze(['json', 'jsonl']);

const stringField = (maxLength, extra = {}) => ({ type: 'string', minLength: 1, maxLength, ...extra });
const schema = (properties, required) => Object.freeze({ type: 'object', properties, required: Object.freeze(required), additionalProperties: false });

const CATEGORIES = Object.freeze(['navigation', 'query', 'creation', 'organization', 'transfer', 'effect']);
const FAMILY_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
// A symbol always opens with punctuation, so it can never be read as a command id or as free text:
// `?` asks, `+` creates, `@` attaches, `!` names, `/` opens, `~` recalls.
const SYMBOL_RE = /^[?+/@!~^=$%*][a-z0-9-]*(?:\/[a-z0-9-]+)*$/;

// 17 semantic families over the seven previewed commands. `suggests` is presentation only: it names
// argument values a future caller might pass, and is never merged into an argument object here.
const COMMAND_FAMILIES = deepFreeze([
  // navigation
  {
    id: 'open-saved-conversation',
    category: 'navigation',
    commandId: 'open-conversation',
    summary: 'Open one saved conversation by its world id.',
    symbols: ['/open-conversation', '/conversation', '@conversation'],
    suggests: {},
  },
  {
    id: 'open-imported-conversation',
    category: 'navigation',
    commandId: 'open-conversation',
    summary: 'Open a conversation that arrived through a local import.',
    symbols: ['/open-imported', '?imported-conversation'],
    suggests: {},
  },
  // query
  {
    id: 'find-text',
    category: 'query',
    commandId: 'find',
    summary: 'Find saved local records by free query text.',
    symbols: ['/find', '?find', '?/find'],
    suggests: {},
  },
  {
    id: 'find-by-kind',
    category: 'query',
```

_First 80 of 735 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
