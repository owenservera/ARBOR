# File: studio/src/studio/personal-app-blueprint.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-blueprint.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9722 B |
| Lines | 159 |
| Hash | 780a042fd823 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSONAL_APP_SCHEMA | const | 4 | yes | export const PERSONAL_APP_SCHEMA = &#39;vivim.personal-app/1&#39;; |
| PERSONAL_APP_KINDS | const | 5 | yes | export const PERSONAL_APP_KINDS = Object.freeze([&#39;notes&#39;, &#39;tasks&#39;, &#39;dashboard&#39;, &#39;blank&#39;]); |
| PERSONAL_APP_BASE_SCREENS | const | 6 | yes | export const PERSONAL_APP_BASE_SCREENS = Object.freeze([&#39;home&#39;, &#39;agent&#39;, &#39;builder&#39;]); |
| MAX_PERSONAL_APP_SCREENS | const | 7 | yes | export const MAX_PERSONAL_APP_SCREENS = 12; |
| PERSONAL_APP_TEMPLATES | const | 9 | yes | export const PERSONAL_APP_TEMPLATES = Object.freeze([ { id: &#39;reading-list&#39;, title: &#39;My Reading List&#39;, intent: &#39;Keep books and articles to read, with notes and a done list.&#39;, screens: [{ kind: &#39;tasks&#39;… |
| invalid | function | 17 | no | const invalid = (message, code = &#39;PERSONAL_APP_INVALID&#39;, status = 400) =&gt; |
| clean | function | 19 | no | const clean = (value, label, max) =&gt; { |
| slug | function | 26 | no | const slug = value =&gt; value.toLowerCase().normalize(&#39;NFKD&#39;).replace(/[\\u0300-\\u036f]/g, &#39;&#39;) |
| idPattern | const | 28 | no | const idPattern = /^app-[a-f0-9]{32}$/; |
| isPersonalAppId | function | 29 | yes | export const isPersonalAppId = id =&gt; typeof id === &#39;string&#39; &amp;&amp; idPattern.test(id); |
| createPersonalAppBlueprint | function | 31 | yes | export function createPersonalAppBlueprint({ id, title, intent, now }) { |
| name | const | 33 | no | const name = clean(title, &#39;title&#39;, 80), request = clean(intent, &#39;intent&#39;, 2000); |
| assertPersonalAppBlueprint | function | 49 | yes | export function assertPersonalAppBlueprint(app) { |
| seen | const | 57 | no | const seen = new Set(); |
| addPersonalAppScreen | function | 72 | yes | export function addPersonalAppScreen(app, { kind, label, now }) { |
| title | const | 75 | no | const title = clean(label, &#39;screen label&#39;, 64); |
| key | const | 76 | no | const key = &#39;custom-&#39; + slug(title); |
| personalAppScaffold | function | 95 | yes | export function personalAppScaffold(app) { |
| PERSONAL_APP_CHANGE_SCHEMA | const | 111 | yes | export const PERSONAL_APP_CHANGE_SCHEMA = &#39;vivim.personal-app-change/1&#39;; |
| parsePersonalAppChange | function | 114 | yes | export function parsePersonalAppChange(value) { |
| raw | variable | 115 | no | let raw = value; |
| operations | const | 127 | no | const operations = raw.operations.map(op =&gt; { if (!op \|\| typeof op !== &#39;object&#39; \|\| Array.isArray(op) \|\| Object.keys(op).some(key =&gt; ![&#39;type&#39;, &#39;kind&#39;, &#39;label&#39;].includes(key)) \|\| op.type !== &#39;add-scree… |
| previewPersonalAppChange | function | 139 | yes | export function previewPersonalAppChange(app, proposal, { now } = {}) { |
| change | const | 141 | no | const change = parsePersonalAppChange(proposal); |
| next | variable | 145 | no | let next = app; |
| diff | const | 146 | no | const diff = []; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) | ./personal-app-blueprint.mjs |
| [studio/src/studio/personal-app-service.mjs](./personal-app-service.mjs.md) | ./personal-app-blueprint.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Personal App Builder v0: deterministic, inert blueprint DSL.
// A model may eventually PROPOSE changes through the existing Harness, but its output
// must pass this same validator. Nothing in a blueprint is executable code.
export const PERSONAL_APP_SCHEMA = 'vivim.personal-app/1';
export const PERSONAL_APP_KINDS = Object.freeze(['notes', 'tasks', 'dashboard', 'blank']);
export const PERSONAL_APP_BASE_SCREENS = Object.freeze(['home', 'agent', 'builder']);
export const MAX_PERSONAL_APP_SCREENS = 12;
// Templates are trusted data, not executable UI. Reuse the same renderer/validator kinds.
export const PERSONAL_APP_TEMPLATES = Object.freeze([
  { id: 'reading-list', title: 'My Reading List', intent: 'Keep books and articles to read, with notes and a done list.', screens: [{ kind: 'tasks', label: 'To Read' }, { kind: 'notes', label: 'Reading Notes' }] },
  { id: 'household-tasks', title: 'Household Tasks', intent: 'Keep track of household chores and useful household notes.', screens: [{ kind: 'tasks', label: 'Chores' }, { kind: 'notes', label: 'Household Notes' }] },
  { id: 'notes', title: 'My Notes', intent: 'Write and keep personal notes on my PC.', screens: [{ kind: 'notes', label: 'Notes' }] },
  { id: 'study-planner', title: 'Study Planner', intent: 'Plan study tasks and keep study notes.', screens: [{ kind: 'tasks', label: 'Study Plan' }, { kind: 'notes', label: 'Study Notes' }, { kind: 'dashboard', label: 'Progress' }] },
  { id: 'habit-tracker', title: 'Habit Tracker', intent: 'Track habits with a checklist and keep reflection notes.', screens: [{ kind: 'tasks', label: 'Habits' }, { kind: 'notes', label: 'Reflections' }] },
  { id: 'blank', title: 'My App', intent: 'Start a personal app and choose my own screens.', screens: [{ kind: 'blank', label: 'My Canvas' }] },
].map(template => Object.freeze({ ...template, screens: Object.freeze(template.screens.map(screen => Object.freeze(screen))) })));
const invalid = (message, code = 'PERSONAL_APP_INVALID', status = 400) =>
  Object.assign(new Error(message), { code, status });
const clean = (value, label, max) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) {
    throw invalid(label + ' must contain 1..' + max + ' printable characters');
  }
  return value.trim();
};
const slug = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42);
const idPattern = /^app-[a-f0-9]{32}$/;
export const isPersonalAppId = id => typeof id === 'string' && idPattern.test(id);

export function createPersonalAppBlueprint({ id, title, intent, now }) {
  if (!isPersonalAppId(id)) throw invalid('Invalid local app id');
  const name = clean(title, 'title', 80), request = clean(intent, 'intent', 2000);
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) throw invalid('Invalid time');
  return {
    schema: PERSONAL_APP_SCHEMA, id, title: name, intent: request, createdAt: now, updatedAt: now,
    source: 'explicit-user-request', platform: 'mobile-first-pwa-scaffold',
    authority: 'local-user-owned-blueprint', providerExecution: 'not-attempted',
    remoteBinding: 'not-configured', deployStatus: 'not-built',
    screens: [
      { key: 'home', label: 'Home', kind: 'home', origin: 'base-scaffold' },
      { key: 'agent', label: 'My Agent', kind: 'agent', origin: 'base-scaffold' },
      { key: 'builder', label: 'Build', kind: 'builder', origin: 'base-scaffold' },
    ],
    buildHistory: [{ type: 'created', at: now, basis: 'user-authored-intent; no-model-call' }],
  };
}

export function assertPersonalAppBlueprint(app) {
  if (!app || typeof app !== 'object' || Array.isArray(app) || app.schema !== PERSONAL_APP_SCHEMA ||
      !isPersonalAppId(app.id) || typeof app.title !== 'string' || app.title.length > 80 ||
      typeof app.intent !== 'string' || app.intent.length > 2000 ||
      app.source !== 'explicit-user-request' ||
      !Array.isArray(app.screens) || app.screens.length < 3 || app.screens.length > MAX_PERSONAL_APP_SCREENS) {
    throw invalid('Invalid or unsupported app blueprint', 'PERSONAL_APP_CORRUPT', 500);
  }
  const seen = new Set();
  for (const screen of app.screens) {
    if (!screen || typeof screen.key !== 'string' || !/^[a-z][a-z0-9-]{0,48}$/.test(screen.key) ||
        typeof screen.label !== 'string' || !screen.label.trim() || screen.label.length > 64 ||
        typeof screen.kind !== 'string' ||
        !['home', 'agent', 'builder', ...PERSONAL_APP_KINDS].includes(screen.kind) ||
        seen.has(screen.key)) throw invalid('Invalid or repeated screen', 'PERSONAL_APP_CORRUPT', 500);
    seen.add(screen.key);
  }
  if (PERSONAL_APP_BASE_SCREENS.some(key => !seen.has(key))) {
    throw invalid('Required app navigation is missing', 'PERSONAL_APP_CORRUPT', 500);
  }
  return app;
}

export function addPersonalAppScreen(app, { kind, label, now }) {
  assertPersonalAppBlueprint(app);
  if (!PERSONAL_APP_KINDS.includes(kind)) throw invalid('Unsupported starter screen kind');
  const title = clean(label, 'screen label', 64);
  const key = 'custom-' + slug(title);
  if (key === 'custom-' || key.length > 49) throw invalid('Screen label needs a readable identifier');
  if (app.screens.some(screen => screen.key === key)) {
    throw invalid('Screen already exists', 'PERSONAL_APP_SCREEN_EXISTS', 409);
  }
```

_First 80 of 160 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
