# File: studio/src/studio/personal-app-content.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-content.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6603 B |
| Lines | 117 |
| Hash | d6ba6c4d9268 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSONAL_APP_CONTENT_SCHEMA | const | 8 | yes | export const PERSONAL_APP_CONTENT_SCHEMA = &#39;vivim.personal-app-content/1&#39;; |
| KEY | const | 9 | no | const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/; |
| ITEM_ID | const | 10 | no | const ITEM_ID = /^item-[a-f0-9]{32}$/; |
| KINDS | const | 11 | no | const KINDS = new Set([&#39;note&#39;, &#39;task&#39;]); |
| MAX_ITEMS | const | 12 | no | const MAX_ITEMS = 200; |
| fail | function | 13 | no | const fail = (status, code, message) =&gt; problem(status, message, code); |
| clean | function | 14 | no | function clean(value, name, max, allowEmpty = false) { |
| assertPersonalAppContent | function | 22 | yes | export function assertPersonalAppContent(content, id) { |
| seen | const | 29 | no | const seen = new Set(); |
| createPersonalAppContentService | function | 42 | yes | export function createPersonalAppContentService({ paths, apps, clock = () =&gt; new Date().toISOString() } = {}) { |
| store | const | 46 | no | const store = new VersionedStore(path.join(paths.root, &#39;personal-app-content&#39;), { kind: &#39;personal app content&#39; }); |
| get | function | 47 | no | function get(id) { |
| save | function | 67 | no | const save = (id, before, next, message) =&gt; { |
| createItem | function | 74 | no | function createItem({ id, expectedVersion, idempotencyKey, kind, title, body = &#39;&#39; } = {}) { |
| name | const | 78 | no | const name = clean(title, &#39;title&#39;, 160), detail = clean(body, &#39;body&#39;, 4000, true); |
| before | const | 79 | no | const before = get(id); |
| itemId | const | 80 | no | const itemId = &#39;item-&#39; + createHash(&#39;sha256&#39;).update(id + &#39;:&#39; + idempotencyKey).digest(&#39;hex&#39;).slice(0, 32); |
| prior | const | 81 | no | const prior = before.items.find(item =&gt; item.id === itemId); |
| item | const | 94 | no | const item = { id: itemId, kind, title: name, body: detail, completed: false, |
| content | const | 96 | no | const content = save(id, before, { ...before, items: [...before.items, item] }, &#39;Created user-authored &#39; + kind); |
| setTaskComplete | function | 99 | no | function setTaskComplete({ id, itemId, expectedVersion, completed } = {}) { |
| before | const | 103 | no | const before = get(id), old = before.items.find(item =&gt; item.id === itemId); |
| item | const | 111 | no | const item = { ...old, completed, updatedAt: clock() }; |
| content | const | 112 | no | const content = save(id, before, { ...before, items: before.items.map(value =&gt; value.id === itemId ? item : value) }, &#39;Changed local task completion&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |
| ../store/versioned.mjs | import | 5 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./http.mjs | import | 6 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) | ./personal-app-content.mjs |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./personal-app-content.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Durable user-owned content for a personal app. Shares Studio's same-owner HTTP boundary.
// Read is inert; writes use VersionedStore CAS and stable creation keys. No provider dispatch.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { VersionedStore } from '../store/versioned.mjs';
import { problem, storeProblem } from './http.mjs';

export const PERSONAL_APP_CONTENT_SCHEMA = 'vivim.personal-app-content/1';
const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const ITEM_ID = /^item-[a-f0-9]{32}$/;
const KINDS = new Set(['note', 'task']);
const MAX_ITEMS = 200;
const fail = (status, code, message) => problem(status, message, code);
function clean(value, name, max, allowEmpty = false) {
  if (typeof value !== 'string' || value.length > max ||
      (!allowEmpty && !value.trim()) ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) {
    throw fail(400, 'PERSONAL_APP_CONTENT_INVALID', name + ' must be printable and at most ' + max + ' characters');
  }
  return value.trim();
}
export function assertPersonalAppContent(content, id) {
  if (!content || content.schema !== PERSONAL_APP_CONTENT_SCHEMA ||
      content.appId !== id || !Number.isSafeInteger(content.version) ||
      content.version < 0 || !Array.isArray(content.items) ||
      content.items.length > MAX_ITEMS) {
    throw fail(500, 'PERSONAL_APP_CONTENT_CORRUPT', 'Stored personal app content has invalid metadata');
  }
  const seen = new Set();
  for (const item of content.items) {
    if (!item || !ITEM_ID.test(item.id) || seen.has(item.id) ||
        !KINDS.has(item.kind) || typeof item.title !== 'string' ||
        !item.title.trim() || item.title.length > 160 ||
        typeof item.body !== 'string' || item.body.length > 4000 ||
        typeof item.completed !== 'boolean' || typeof item.createdAt !== 'string') {
      throw fail(500, 'PERSONAL_APP_CONTENT_CORRUPT', 'Stored app item is invalid');
    }
    seen.add(item.id);
  }
  return content;
}
export function createPersonalAppContentService({ paths, apps, clock = () => new Date().toISOString() } = {}) {
  if (!paths?.root || !path.isAbsolute(paths.root) || typeof apps?.get !== 'function') {
    throw new TypeError('Absolute local paths and personal app owner required');
  }
  const store = new VersionedStore(path.join(paths.root, 'personal-app-content'), { kind: 'personal app content' });
  function get(id) {
    apps.get(id); // Validates id and enforces that the blueprint is owned locally.
    try {
      if (!store.has(id)) {
        // Missing CURRENT is only an empty app when no saved snapshots exist. Never
        // disguise interrupted/damaged persistence as an empty list or initialize over it.
        if (store.versions(id).length) throw fail(500, 'PERSONAL_APP_CONTENT_CORRUPT', 'Saved content pointer is missing');
        return { schema: PERSONAL_APP_CONTENT_SCHEMA, appId: id,
          version: 0, items: [], authority: 'local-pc', remoteSync: 'not-configured' };
      }
      return assertPersonalAppContent(store.load(id), id);
    } catch (error) {
      if (['PERSONAL_APP_CONTENT_CORRUPT', 'STORE_CURRENT_CORRUPT', 'STORE_RECORD_CORRUPT',
        'STORE_NO_SUCH_VERSION', 'STORE_NO_SUCH_ITEM'].includes(error?.code)) {
        throw fail(500, 'PERSONAL_APP_CONTENT_CORRUPT',
          'Your saved notes and tasks could not be opened. Nothing was replaced. Keep the saved files on your PC and ask for help restoring them before saving again.');
      }
      throw storeProblem(error);
    }
  }
  const save = (id, before, next, message) => {
    try {
      return assertPersonalAppContent(store.compareAndSave(id, next, {
        expectedVersion: before.version === 0 ? null : before.version, changeNote: message,
      }), id);
    } catch (error) { throw storeProblem(error); }
  };
  function createItem({ id, expectedVersion, idempotencyKey, kind, title, body = '' } = {}) {
    if (typeof idempotencyKey !== 'string' || !KEY.test(idempotencyKey) || !KINDS.has(kind)) {
      throw fail(400, 'PERSONAL_APP_CONTENT_INVALID', 'Valid idempotency key and note/task kind required');
    }
    const name = clean(title, 'title', 160), detail = clean(body, 'body', 4000, true);
    const before = get(id);
    const itemId = 'item-' + createHash('sha256').update(id + ':' + idempotencyKey).digest('hex').slice(0, 32);
```

_First 80 of 118 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
