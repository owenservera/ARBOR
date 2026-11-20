# File: studio/src/studio/personal-app-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6708 B |
| Lines | 117 |
| Hash | 4a9bbcbd033e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KEY | const | 10 | no | const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/; |
| MAX_APPS | const | 11 | no | const MAX_APPS = 20; |
| fail | function | 12 | no | const fail = (status, message, code = &#39;PERSONAL_APP_INVALID&#39;) =&gt; problem(status, message, code); |
| createPersonalAppService | function | 13 | yes | export function createPersonalAppService({ paths, clock = () =&gt; new Date().toISOString() } = {}) { |
| store | const | 15 | no | const store = new VersionedStore(path.join(paths.root, &#39;personal-apps&#39;), { kind: &#39;personal app&#39; }); |
| readProblem | function | 16 | no | const readProblem = error =&gt; { |
| exists | function | 23 | no | const exists = id =&gt; { |
| load | function | 30 | no | const load = id =&gt; { |
| app | const | 34 | no | const app = store.load(id); |
| commit | function | 39 | no | const commit = (id, value, expectedVersion, note) =&gt; { |
| list | function | 43 | no | function list() { |
| apps | const | 44 | no | const apps = store.names().map(id =&gt; { const app = load(id); return { id: app.id, title: app.title, version: app.version, updatedAt: app.updatedAt, screenCount: app.screens.length, deployStatus: app.… |
| app | const | 45 | no | const app = load(id); |
| create | function | 53 | no | function create({ title, intent, idempotencyKey } = {}, template = null) { |
| id | const | 57 | no | const id = &#39;app-&#39; + createHash(&#39;sha256&#39;).update(idempotencyKey).digest(&#39;hex&#39;).slice(0, 32); |
| blueprint | variable | 59 | no | let blueprint = createPersonalAppBlueprint({ id, title, intent, now: clock() }); |
| previous | const | 65 | no | const previous = load(id); |
| saved | const | 75 | no | const saved = commit(id, blueprint, null, &#39;Created user-owned personal mobile app blueprint&#39;); |
| fromTemplate | function | 78 | no | function fromTemplate({ template, title, idempotencyKey } = {}) { |
| chosen | const | 79 | no | const chosen = PERSONAL_APP_TEMPLATES.find(item =&gt; item.id === template); |
| addScreen | function | 83 | no | function addScreen({ id, expectedVersion, kind, label } = {}) { |
| before | const | 84 | no | const before = load(id); |
| next | const | 88 | no | const next = addPersonalAppScreen(before, { kind, label, now: clock() }); |
| saved | const | 89 | no | const saved = commit(id, next, expectedVersion, &#39;Added user-directed declarative mobile screen&#39;); |
| previewChange | function | 92 | no | function previewChange({ id, proposal } = {}) { |
| app | const | 93 | no | const app = load(id); |
| applyChange | function | 96 | no | function applyChange({ id, expectedVersion, proposal, approval } = {}) { |
| before | const | 100 | no | const before = load(id); |
| preview | const | 104 | no | const preview = previewPersonalAppChange(before, proposal, { now: clock() }); |
| next | variable | 105 | no | let next = before; |
| saved | const | 109 | no | const saved = commit(id, next, expectedVersion, &#39;Explicitly approved bounded data-only app proposal&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |
| ../store/versioned.mjs | import | 5 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./http.mjs | import | 6 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./personal-app-blueprint.mjs | import | 7 | [studio/src/studio/personal-app-blueprint.mjs](./personal-app-blueprint.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) | ./personal-app-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One local owner for user-authored personal app blueprints and declarative mobile screens.
// No AI/provider dispatch, code execution, file generation, sync or installer.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { VersionedStore } from '../store/versioned.mjs';
import { problem, storeProblem } from './http.mjs';
import { createPersonalAppBlueprint, addPersonalAppScreen, personalAppScaffold,
  assertPersonalAppBlueprint, isPersonalAppId, previewPersonalAppChange, PERSONAL_APP_TEMPLATES } from './personal-app-blueprint.mjs';

const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const MAX_APPS = 20;
const fail = (status, message, code = 'PERSONAL_APP_INVALID') => problem(status, message, code);
export function createPersonalAppService({ paths, clock = () => new Date().toISOString() } = {}) {
  if (!paths?.root || !path.isAbsolute(paths.root)) throw new TypeError('Absolute paths.root is required');
  const store = new VersionedStore(path.join(paths.root, 'personal-apps'), { kind: 'personal app' });
  const readProblem = error => {
    if (['PERSONAL_APP_CORRUPT', 'STORE_CURRENT_CORRUPT', 'STORE_RECORD_CORRUPT',
      'STORE_NO_SUCH_VERSION', 'STORE_NO_SUCH_ITEM'].includes(error?.code)) {
      return fail(500, 'Your saved app could not be opened. Nothing was replaced. Keep the saved files on your PC and ask for help restoring them.', 'PERSONAL_APP_CORRUPT');
    }
    return storeProblem(error);
  };
  const exists = id => {
    try {
      if (store.has(id)) return true;
      if (store.versions(id).length) throw fail(500, 'Saved app pointer is missing', 'PERSONAL_APP_CORRUPT');
      return false;
    } catch (error) { throw readProblem(error); }
  };
  const load = id => {
    if (!isPersonalAppId(id)) throw fail(400, 'Invalid personal app ID');
    if (!exists(id)) throw fail(404, 'This app is not saved on this PC. Open your app library and choose another app.', 'PERSONAL_APP_NOT_FOUND');
    try {
      const app = store.load(id);
      assertPersonalAppBlueprint(app);
      return app;
    } catch (error) { throw readProblem(error); }
  };
  const commit = (id, value, expectedVersion, note) => {
    try { return store.compareAndSave(id, value, { expectedVersion, changeNote: note }); }
    catch (error) { throw storeProblem(error); }
  };
  function list() {
    const apps = store.names().map(id => {
      const app = load(id);
      return { id: app.id, title: app.title, version: app.version,
        updatedAt: app.updatedAt, screenCount: app.screens.length,
        deployStatus: app.deployStatus, providerExecution: app.providerExecution };
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    return { schema: 'vivim.personal-app-index/1', total: apps.length, items: apps,
      source: 'user-owned-versioned-local-blueprints', providerExecution: 'not-attempted' };
  }
  function create({ title, intent, idempotencyKey } = {}, template = null) {
    if (typeof idempotencyKey !== 'string' || !KEY.test(idempotencyKey)) {
      throw fail(400, 'A stable 8..128 character idempotency key is required');
    }
    const id = 'app-' + createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 32);
    // Validate the request BEFORE consulting an existing id: replay is allowed only for the same inputs.
    let blueprint = createPersonalAppBlueprint({ id, title, intent, now: clock() });
    if (template) {
      blueprint.template = template.id;
      for (const screen of template.screens) blueprint = addPersonalAppScreen(blueprint, { ...screen, now: clock() });
    }
    if (exists(id)) {
      const previous = load(id);
      if (previous.title !== blueprint.title || previous.intent !== blueprint.intent || previous.template !== blueprint.template) {
        throw fail(409, 'This creation key was used for another request', 'PERSONAL_APP_IDEMPOTENCY_CONFLICT');
      }
      return { app: previous, replayed: true };
    }
    if (store.names().length >= MAX_APPS) {
      throw fail(409, 'Personal app index is full', 'PERSONAL_APP_LIMIT');
    }
    // Concurrent same-key creates are fenced by the store CAS; replay requires a read-only retry.
    const saved = commit(id, blueprint, null, 'Created user-owned personal mobile app blueprint');
    return { app: saved, replayed: false };
  }
  function fromTemplate({ template, title, idempotencyKey } = {}) {
    const chosen = PERSONAL_APP_TEMPLATES.find(item => item.id === template);
    if (!chosen) throw fail(400, 'Choose one of the available app templates');
```

_First 80 of 118 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
