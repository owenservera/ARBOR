# File: apps/vivim-host/bootstrap/service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 49528 B |
| Lines | 840 |
| Hash | 53f7c6b97523 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BOOTSTRAP_SCHEMA | const | 16 | yes | export const BOOTSTRAP_SCHEMA = &#39;vivim.bootstrap-service/1&#39;; |
| WORLD_DEFAULT | const | 17 | yes | export const WORLD_DEFAULT = &#39;world-local&#39;; |
| UI_REVISION_STATUSES | const | 20 | yes | export const UI_REVISION_STATUSES = Object.freeze([&#39;proposed&#39;, &#39;previewed&#39;, &#39;accepted&#39;, &#39;applied&#39;, &#39;rejected&#39;, &#39;conflict&#39;]); |
| UI_REVISION_HISTORY_STATUSES | const | 21 | yes | export const UI_REVISION_HISTORY_STATUSES = Object.freeze([&#39;superseded&#39;, &#39;reverted&#39;]); |
| UI_REVISION_ANY | const | 22 | no | const UI_REVISION_ANY = new Set([...UI_REVISION_STATUSES, ...UI_REVISION_HISTORY_STATUSES]); |
| ID | const | 23 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| PHASES | const | 24 | no | const PHASES = [&#39;connecting&#39;, &#39;learning&#39;, &#39;shaping&#39;, &#39;deepening&#39;, &#39;blocked&#39;, &#39;uncertain&#39;]; |
| MAX_PROJECTION_BYTES | const | 25 | no | const MAX_PROJECTION_BYTES = 32 * 1024; |
| GRANT_SCOPES | const | 28 | no | const GRANT_SCOPES = Object.freeze({ &#39;onboarding-visual&#39;: [&#39;visual&#39;], &#39;full-bootstrap&#39;: [&#39;visual&#39;, &#39;profile&#39;, &#39;boundary&#39;, &#39;pass&#39;] }); |
| GRANT_MAX_SENDS | const | 36 | yes | export const GRANT_MAX_SENDS = 20; |
| GRANT_MAX_EXPIRY_MS | const | 37 | yes | export const GRANT_MAX_EXPIRY_MS = 24 * 3600000; |
| GRANT_META_KEY | const | 38 | yes | export const GRANT_META_KEY = &#39;grant.bootstrap&#39;; |
| GRANT_REVOKED_META_KEY | const | 39 | yes | export const GRANT_REVOKED_META_KEY = &#39;grant.bootstrap.revoked&#39;; |
| SHA256_HEX | const | 40 | no | const SHA256_HEX = /^[a-f0-9]{64}$/; |
| GRANT_REASONS | const | 43 | yes | export const GRANT_REASONS = Object.freeze({ revoked: &#39;GRANT_REVOKED&#39;, notGranted: &#39;GRANT_REQUIRED&#39;, expired: &#39;GRANT_EXPIRED&#39;, scope: &#39;GRANT_SCOPE&#39;, |
| readGrant | function | 56 | yes | export function readGrant(ledger, key = GRANT_META_KEY) { |
| writeGrant | function | 59 | yes | export function writeGrant(ledger, grant, key = GRANT_META_KEY) { |
| grantExpiryMs | function | 63 | yes | export function grantExpiryMs(grant) { |
| parsed | const | 65 | no | const parsed = typeof grant.expiresAt === &#39;string&#39; ? Date.parse(grant.expiresAt) : Number(grant.expiresAt); |
| grantBoundDigest | function | 68 | yes | export function grantBoundDigest(grant) { |
| grantRefusalMessage | function | 71 | no | function grantRefusalMessage(code) { |
| grantRefusal | function | 86 | yes | export function grantRefusal(grant, { worldId = null, area = null, promptDigest = null, thread = null, send = false, now = 0, revoked = false } = {}) { |
| expiry | const | 89 | no | const expiry = grantExpiryMs(grant); |
| allowed | const | 93 | no | const allowed = GRANT_SCOPES[grant.scope] ?? []; |
| bound | const | 96 | no | const bound = grantBoundDigest(grant); |
| claimGrantSend | function | 112 | yes | export function claimGrantSend({ ledger, worldId = WORLD_DEFAULT, area = &#39;pass&#39;, promptDigest = null, thread = &#39;new&#39;, requestId = null, now = () =&gt; new Date().toISOString() } = {}) { |
| raw | const | 114 | no | const raw = typeof now === &#39;function&#39; ? now() : now; |
| stamp | const | 115 | no | const stamp = typeof raw === &#39;string&#39; ? raw : new Date(raw).toISOString(); |
| grant | const | 118 | no | const grant = readGrant(ledger); |
| revoked | const | 119 | no | const revoked = grant?.revoked === true \|\| (!grant &amp;&amp; Boolean(readGrant(ledger, GRANT_REVOKED_META_KEY))); |
| refusal | const | 120 | no | const refusal = grantRefusal(grant, { worldId, area, promptDigest, thread, send: true, now: Date.parse(stamp), revoked }); |
| used | const | 127 | no | const used = Number(grant.sendsUsed) \|\| 0; |
| fail | function | 138 | no | function fail(reason) { throw new TypeError(&#39;Bootstrap service: &#39; + reason); } |
| coded | function | 139 | no | function coded(code, message) { return Object.assign(new TypeError(&#39;Bootstrap service: &#39; + message), { code }); } |
| iso | function | 140 | no | function iso(now) { const v = now(); return typeof v === &#39;string&#39; ? v : new Date(v).toISOString(); } |
| idOk | function | 141 | no | function idOk(value, name) { if (typeof value !== &#39;string&#39; \|\| !ID.test(value)) fail(name + &#39; must be a bounded id&#39;); return value; } |
| stable | function | 142 | no | function stable(value) { |
| digestOf | function | 147 | no | function digestOf(value) { return createHash(&#39;sha256&#39;).update(JSON.stringify(stable(value))).digest(&#39;hex&#39;); } |
| receiptKey | function | 148 | no | function receiptKey({ worldId, pass, requestId, generationId }) { |
| createBootstrapService | function | 152 | yes | export function createBootstrapService({ ledger, worldId = WORLD_DEFAULT, now = () =&gt; new Date().toISOString(), provider = &#39;chatgpt&#39; } = {}) { |
| readJson | function | 156 | no | const readJson = (row, field, fallback) =&gt; { |
| uiRevisionStatusMap | const | 163 | no | const uiRevisionStatusMap = new Map(); |
| trackUiRevisionStatus | function | 164 | no | function trackUiRevisionStatus(revision, status, actor, at, world = worldId) { |
| rev | const | 165 | no | const rev = Number(revision); |
| entry | const | 168 | no | const entry = { status, actor: actor ?? null, at: at ?? iso(now) }; |
| row | const | 170 | no | const row = ledger.uiRevisions.byRevision(world, rev); |
| uiRevisionStatus | function | 175 | no | function uiRevisionStatus(revision = null) { |
| rev | const | 176 | no | const rev = revision === null \|\| revision === undefined ? null : Number(revision); |
| active | const | 178 | no | const active = ledger.uiRevisions.active(worldId); |
| local | const | 181 | no | const local = uiRevisionStatusMap.get(rev); |
| row | const | 183 | no | const row = ledger.uiRevisions.byRevision(worldId, rev); |
| stored | const | 185 | no | const stored = row.status === &#39;active&#39; ? &#39;applied&#39; : row.status === &#39;undone&#39; ? &#39;reverted&#39; : row.status ?? &#39;applied&#39;; |
| decision | const | 186 | no | const decision = readJson(row, &#39;decision_json&#39;, null); |
| meta | const | 190 | no | const meta = { |
| grantBounds | function | 204 | no | function grantBounds({ at, maxSends, expiresAt, expiresInMs, promptDigest, freshThreadOnly }) { |
| issued | const | 205 | no | const issued = Date.parse(at); |
| cap | const | 207 | no | const cap = maxSends === undefined \|\| maxSends === null ? GRANT_MAX_SENDS : maxSends; |
| expires | variable | 211 | no | let expires = null; |
| parsed | const | 213 | no | const parsed = typeof expiresAt === &#39;string&#39; ? Date.parse(expiresAt) : NaN; |
| span | const | 219 | no | const span = expiresInMs === undefined \|\| expiresInMs === null ? GRANT_MAX_EXPIRY_MS : expiresInMs; |
| grantBootstrap | function | 239 | no | function grantBootstrap({ scope = &#39;onboarding-visual&#39;, at = iso(now), maxSends, expiresAt, expiresInMs, promptDigest = null, freshThreadOnly = true } = {}) { |
| existing | const | 241 | no | const existing = meta.grant(); |
| issuedAt | const | 243 | no | const issuedAt = typeof at === &#39;string&#39; ? at : new Date(at).toISOString(); |
| bounds | const | 244 | no | const bounds = grantBounds({ at: issuedAt, maxSends, expiresAt, expiresInMs, promptDigest, freshThreadOnly }); |
| revokeGrant | function | 252 | no | function revokeGrant() { |
| prior | const | 253 | no | const prior = meta.grant(); |
| requireGrant | function | 263 | no | function requireGrant(area, { promptDigest = null, thread = null, send = false } = {}) { |
| grant | const | 264 | no | const grant = meta.grant(); |
| revoked | const | 265 | no | const revoked = grant?.revoked === true \|\| (!grant &amp;&amp; Boolean(meta.grantRevoked())); |
| refusal | const | 266 | no | const refusal = grantRefusal(grant, { worldId, area, promptDigest, thread, send, now: Date.parse(iso(now)), revoked }); |
| requireGrantForSend | function | 274 | no | function requireGrantForSend({ promptDigest = null, thread = &#39;new&#39; } = {}) { |
| consumeGrantSend | function | 279 | no | function consumeGrantSend({ promptDigest = null, thread = &#39;new&#39;, requestId = null } = {}) { |
| grantState | function | 284 | no | function grantState() { |
| grant | const | 285 | no | const grant = meta.grant(); |
| bounded | const | 287 | no | const bounded = Number.isInteger(grant.maxSends); |
| used | const | 288 | no | const used = Number(grant.sendsUsed) \|\| 0; |
| provenanceFor | function | 300 | no | function provenanceFor({ requestId, generationId = null, threadRef = null, kind, digest = null, basis = null }) { |
| id | const | 301 | no | const id = &#39;prv-&#39; + idOk(requestId, &#39;requestId&#39;); |
| activeThemeRow | function | 306 | no | function activeThemeRow() { return ledger.themes.active(worldId); } |
| activePlan | function | 307 | no | function activePlan() { |
| row | const | 308 | no | const row = activeThemeRow(); |
| ownerThemeActive | function | 312 | no | const ownerThemeActive = () =&gt; { |
| row | const | 313 | no | const row = activeThemeRow(); |
| recordPreferences | function | 317 | no | function recordPreferences(claims) { |
| ingestF02 | function | 331 | no | function ingestF02({ response, requestId, generationId = null, threadRef = null, activate = null } = {}) { |
| parsed | const | 335 | no | const parsed = parseF02Response(response); |
| digest | const | 336 | no | const digest = digestOf(parsed); |
| key | const | 337 | no | const key = receiptKey({ worldId, pass: &#39;F02&#39;, requestId, generationId }); |
| prior | const | 339 | no | const prior = ledger.receipts.get(key); |
| revision | const | 344 | no | const revision = ledger.themes.nextRevision(worldId); |
| plan | const | 345 | no | const plan = compileF02RenderPlan(parsed, { worldId, requestId, revision }); |
| wantActive | const | 346 | no | const wantActive = activate === null ? !!meta.grant() : activate === true; |
| blockedByOwner | const | 347 | no | const blockedByOwner = ownerThemeActive(); |
| active | const | 348 | no | const active = wantActive &amp;&amp; !blockedByOwner; |
| provenanceId | const | 349 | no | const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: &#39;provider-inference&#39;, digest: &#39;f02:&#39; + revision, basis: parsed.provisional ? &#39;provisional&#39; : &#39;provider-memory&#39; }); |
| themeId | const | 350 | no | const themeId = &#39;thm-&#39; + worldId + &#39;-&#39; + revision; |
| claims | const | 360 | no | const claims = [ |
| at | const | 376 | no | const at = iso(now); |
| receipt | const | 380 | no | const receipt = { |
| choosePreset | function | 392 | no | function choosePreset({ preset, requestId = &#39;owner-&#39; + Date.now().toString(36), threadRef = null } = {}) { |
| revision | const | 397 | no | const revision = ledger.themes.nextRevision(worldId); |
| plan | const | 398 | no | const plan = compilePresetRenderPlan(preset, { worldId, revision, source: &#39;owner-choice&#39; }); |
| provenanceId | const | 399 | no | const provenanceId = provenanceFor({ requestId, threadRef, kind: &#39;owner-choice&#39; }); |
| themeId | const | 400 | no | const themeId = &#39;thm-&#39; + worldId + &#39;-&#39; + revision; |
| undoTheme | function | 414 | no | function undoTheme({ requestId = &#39;undo-&#39; + Date.now().toString(36) } = {}) { |
| current | const | 418 | no | const current = activeThemeRow(); |
| rows | const | 419 | no | const rows = ledger.themes.list(worldId, 50); |
| previous | const | 420 | no | const previous = current ? rows.find(r =&gt; r.revision &lt; current.revision &amp;&amp; r.status !== &#39;suggested&#39;) : null; |
| at | const | 421 | no | const at = iso(now); |
| jobId | const | 422 | no | const jobId = &#39;job-&#39; + idOk(requestId, &#39;requestId&#39;); |
| pastJob | const | 423 | no | const pastJob = ledger.jobs.get(jobId, worldId); |
| receipt | const | 425 | no | const receipt = readJson(pastJob, &#39;receipt_json&#39;, {}); |
| plan | const | 432 | no | const plan = previous ? { ...readJson(previous, &#39;render_json&#39;, null), revision: previous.revision, status: &#39;active&#39;, themeId: previous.id } : compileProvisionalPlan(worldId); |
| ingestF01 | function | 439 | no | function ingestF01({ response, requestId, generationId = null, threadRef = null } = {}) { |
| profile | const | 443 | no | const profile = compileF01Profile(response, { worldId, requestId }); |
| gen | const | 444 | no | const gen = generationId ?? profile.generationId ?? null; |
| digest | const | 445 | no | const digest = digestOf({ focus: profile.claims, cards: profile.cards, unknowns: profile.unknowns }); |
| key | const | 446 | no | const key = receiptKey({ worldId, pass: &#39;F01&#39;, requestId, generationId: gen }); |
| prior | const | 448 | no | const prior = ledger.receipts.get(key); |
| at | const | 453 | no | const at = iso(now); |
| provenanceId | const | 454 | no | const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: &#39;provider-inference&#39;, digest: &#39;f01:&#39; + requestId, basis: &#39;recognition&#39; }); |
| contradictions | const | 455 | no | const contradictions = []; |
| existing | const | 457 | no | const existing = ledger.claims.list(worldId, { section: claim.section, limit: 200 }).find(c =&gt; c.id === claim.id); |
| cards | const | 469 | no | const cards = profile.cards.map(c =&gt; ({ id: &#39;crd-&#39; + c.id.replace(/^clm-/, &#39;&#39;), worldId, pass: &#39;F01&#39;, section: &#39;card&#39;, label: c.title, kind: &#39;card&#39;, freshness: &#39;current&#39;, basis: &#39;provider_memory_repo… |
| state | const | 476 | no | const state = meta.cards(); |
| receipt | const | 479 | no | const receipt = { ok: true, pass: &#39;F01&#39;, requestId, claims: profile.claims.length, cards: profile.cards.length, |
| ingestPass | function | 487 | no | function ingestPass({ response, requestId, generationId = null, threadRef = null } = {}) { |
| parsedOut | const | 491 | no | const parsedOut = compilePassOutput(response, { worldId, requestId }); |
| gen | const | 493 | no | const gen = generationId ?? parsedOut.generationId ?? null; |
| digest | const | 494 | no | const digest = digestOf({ passId: parsedOut.passId, observations: parsedOut.observations, assertions: parsedOut.assertions, coverage: parsedOut.coverage }); |
| key | const | 495 | no | const key = receiptKey({ worldId, pass: parsedOut.passId, requestId, generationId: gen }); |
| prior | const | 497 | no | const prior = ledger.receipts.get(key); |
| out | const | 502 | no | const out = parsedOut; |
| at | const | 503 | no | const at = iso(now); |
| provenanceId | const | 504 | no | const provenanceId = provenanceFor({ requestId, generationId, threadRef, kind: &#39;provider-inference&#39;, digest: out.passId + &#39;:&#39; + requestId, basis: &#39;deep-pass&#39; }); |
| relationships | variable | 505 | no | let relationships = 0; |
| jobId | const | 536 | no | const jobId = &#39;job-&#39; + requestId; |
| receipt | const | 543 | no | const receipt = { ok: true, pass: out.passId, requestId, observations: out.observations.length, |
| setPassState | function | 551 | no | function setPassState({ pass, status, requestId = null, coverage = null, receipt = null } = {}) { |
| at | const | 555 | no | const at = iso(now); |
| jobId | const | 557 | no | const jobId = &#39;job-&#39; + idOk(requestId, &#39;requestId&#39;); |
| setOwnerPreference | function | 567 | no | function setOwnerPreference({ value } = {}) { |
| token | const | 571 | no | const token=digestOf(value.toLowerCase()).slice(0,24); |
| id | const | 572 | no | const id=&#39;prf-owner-pref-&#39;+token; |
| at | const | 573 | no | const at=iso(now); |
| clearOwnerPreference | function | 579 | no | function clearOwnerPreference({ id } = {}) { |
| row | const | 584 | no | const row=ledger.preferences.get(id,worldId); |
| setHardNo | function | 593 | no | function setHardNo({ trait, key = null } = {}) { |
| value | const | 595 | no | const value = shorten(String(trait ?? &#39;&#39;).trim(), 120); |
| at | const | 597 | no | const at = iso(now); |
| id | const | 598 | no | const id = &#39;prf-owner-&#39; + hash(key \|\| value); |
| clearHardNo | function | 608 | no | function clearHardNo({ id } = {}) { |
| row | const | 612 | no | const row = ledger.preferences.get(id, worldId); |
| claim | const | 616 | no | const claim = ledger.claims.list(worldId, { section: &#39;boundary&#39;, limit: 200 }).find(c =&gt; c.preference_json &amp;&amp; JSON.parse(c.preference_json).key === row.key); |
| previewUiProposal | function | 623 | no | function previewUiProposal(proposal) { |
| grant | const | 624 | no | const grant=requireGrant(&#39;visual&#39;); |
| surface | const | 625 | no | const surface=uiRevision()??createSurface({surfaceId:&#39;my-space&#39;}); |
| preview | const | 626 | no | const preview=compileUiProposal({proposal,surface,approvedRefs:[],audience:&#39;phone&#39;}); |
| projectionDigest | const | 629 | no | const projectionDigest=digestOf({audience:&#39;phone&#39;,surfaceId:preview.surfaceId,catalogVersion:preview.catalogVersion, theme:preview.surface.theme,tree:preview.surface.tree}); |
| applyUiProposal | function | 636 | no | function applyUiProposal({ proposal, surface, approvedRefs = [], requestId, worldId: targetWorld = worldId, now: at = null, actor = &#39;owner&#39;, approvalBinding = null } = {}) { |
| stamp | const | 640 | no | const stamp = typeof at === &#39;string&#39; ? at : at ? new Date(at).toISOString() : iso(now); |
| preview | const | 641 | no | const preview = compileUiProposal({ proposal, surface, approvedRefs }); |
| projectionDigest | const | 642 | no | const projectionDigest = digestOf({ audience: &#39;phone&#39;, surfaceId: preview.surfaceId, catalogVersion: preview.catalogVersion, theme: preview.surface.theme, tree: preview.surface.tree }); |
| parent | const | 647 | no | const parent = ledger.uiRevisions.active(targetWorld); |
| parentRevision | const | 648 | no | const parentRevision = parent ? Number(parent.revision) : 0; |
| actual | const | 650 | no | const actual=parent?readJson(parent,&#39;surface_json&#39;,null):createSurface({surfaceId:&#39;my-space&#39;}); |
| revision | const | 662 | no | const revision = parentRevision + 1; |
| changeId | const | 663 | no | const changeId = &#39;chg-&#39; + hash(requestId + &#39;:&#39; + revision); |
| committed | const | 664 | no | const committed = { ...preview.surface, revision }; |
| receipt | const | 665 | no | const receipt = { |
| applied | const | 680 | no | const applied = trackUiRevisionStatus(revision, &#39;applied&#39;, actor, stamp, targetWorld); |
| undoUiRevision | function | 690 | no | function undoUiRevision({ requestId = &#39;undo-ui-&#39; + Date.now().toString(36), actor = &#39;owner&#39; } = {}) { |
| current | const | 694 | no | const current = ledger.uiRevisions.active(worldId); |
| rows | const | 695 | no | const rows = ledger.uiRevisions.list(worldId, 100); |
| previous | const | 696 | no | const previous = current ? rows.find(r =&gt; r.revision &lt; current.revision) : null; |
| at | const | 697 | no | const at = iso(now); |
| uiRevision | function | 708 | no | function uiRevision() { |
| row | const | 709 | no | const row = ledger.uiRevisions.active(worldId); |
| phase | function | 713 | no | function phase() { |
| rows | const | 714 | no | const rows = ledger.passes.list(worldId); |
| by | const | 715 | no | const by = Object.fromEntries(rows.map(r =&gt; [r.pass, r.status])); |
| deep | const | 718 | no | const deep = DEEP_PASSES.filter(p =&gt; by[p] === &#39;complete&#39;).length; |
| fast | const | 719 | no | const fast = [&#39;F01&#39;, &#39;F02&#39;].filter(p =&gt; by[p] === &#39;complete&#39;).length; |
| cards | function | 726 | no | function cards() { |
| state | const | 727 | no | const state = meta.cards(); |
| revoked | const | 728 | no | const revoked = new Set(state.revoked ?? []); |
| all | const | 729 | no | const all = ledger.claims.list(worldId, { section: &#39;card&#39;, limit: 50 }) |
| byRequest | const | 731 | no | const byRequest = new Map(); |
| key | const | 733 | no | const key = String(c.provenance_id \|\| &#39;&#39;).replace(/^prv-/, &#39;&#39;); |
| active | const | 737 | no | const active = state.active &amp;&amp; byRequest.has(state.active) |
| fullStatus | function | 743 | no | function fullStatus() { |
| theme | const | 744 | no | const theme = activePlan(); |
| prefs | const | 745 | no | const prefs = ledger.preferences.list(worldId).map(p =&gt; ({ id: p.id, key: p.key, value: p.value, polarity: p.polarity, hard: Number(p.hard) === 1, basis: p.basis, source: p.source, scope: p.scope, co… |
| passRows | const | 749 | no | const passRows = ledger.passes.list(worldId).map(p =&gt; ({ pass: p.pass, status: p.status, updatedAt: p.updated_at, coverage: readJson(p, &#39;coverage_json&#39;, { areas: [] }) })); |
| contradictions | const | 752 | no | const contradictions = ledger.contradictions.list(worldId).map(c =&gt; ({ id: c.id, resolution: c.resolution, note: c.note, createdAt: c.created_at })); |
| projection | function | 776 | no | function projection() { |
| full | const | 777 | no | const full = fullStatus(); |
| theme | const | 778 | no | const theme = full.plan; |
| payload | const | 779 | no | const payload = { |
| row | const | 799 | no | const row = ledger.uiRevisions.active(worldId); |
| committed | const | 801 | no | const committed = readJson(row, &#39;surface_json&#39;, null); |
| status | const | 802 | no | const status = uiRevisionStatus(Number(row.revision)); |
| size | const | 814 | no | const size = Buffer.byteLength(JSON.stringify(payload), &#39;utf8&#39;); |
| hash | function | 830 | no | function hash(value) { |
| h | variable | 831 | no | let h = 0x811c9dc5; |
| text | const | 832 | no | const text = String(value); |
| shorten | function | 836 | no | function shorten(value, limit) { |
| text | const | 837 | no | const text = String(value ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| F02_FONT_STACKS | export | 840 | yes | export { surfaceVariables, F02_FONT_STACKS } |
| surfaceVariables | export | 840 | yes | export { surfaceVariables, F02_FONT_STACKS } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| ../../mobile-relay/bootstrap-f02.mjs | import | 7 | [apps/mobile-relay/bootstrap-f02.mjs](../../mobile-relay/bootstrap-f02.mjs.md) |
| ../../mobile-relay/generative-ui/compiler.mjs | import | 8 | [apps/mobile-relay/generative-ui/compiler.mjs](../../mobile-relay/generative-ui/compiler.mjs.md) |
| ../../mobile-relay/generative-ui/renderer.mjs | import | 9 | [apps/mobile-relay/generative-ui/renderer.mjs](../../mobile-relay/generative-ui/renderer.mjs.md) |
| ../../mobile-relay/generative-ui/catalog.mjs | import | 10 | [apps/mobile-relay/generative-ui/catalog.mjs](../../mobile-relay/generative-ui/catalog.mjs.md) |
| ../../mobile-relay/bootstrap-f01.mjs | import | 11 | [apps/mobile-relay/bootstrap-f01.mjs](../../mobile-relay/bootstrap-f01.mjs.md) |
| ../../mobile-relay/bootstrap-pass.mjs | import | 12 | [apps/mobile-relay/bootstrap-pass.mjs](../../mobile-relay/bootstrap-pass.mjs.md) |
| ../../mobile-relay/theme-plan.mjs | import | 13 | [apps/mobile-relay/theme-plan.mjs](../../mobile-relay/theme-plan.mjs.md) |
| ../../mobile-relay/bootstrap-f02.mjs | import | 14 | [apps/mobile-relay/bootstrap-f02.mjs](../../mobile-relay/bootstrap-f02.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/runtime.mjs](./runtime.mjs.md) | ./service.mjs |
| [apps/vivim-host/bootstrap/scheduler.mjs](./scheduler.mjs.md) | ./service.mjs |
| [apps/vivim-host/control/hvi-source-grant.mjs](../control/hvi-source-grant.mjs.md) | ../bootstrap/service.mjs |
| [apps/vivim-host/test/bootstrap-grant.test.mjs](../test/bootstrap-grant.test.mjs.md) | ../bootstrap/service.mjs |
| [apps/vivim-host/test/bootstrap.test.mjs](../test/bootstrap.test.mjs.md) | ../bootstrap/service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM bootstrap service: the single trusted local writer for personalization.
// ChatGPT output is untrusted data. This module validates it, assigns ids and
// revisions, persists through the bootstrap ledger, and projects a bounded,
// phone-safe view. It never sends to a provider, never executes generated SQL or
// JavaScript, and never treats provider inference as owner confirmation.
import { createHash, randomUUID } from 'node:crypto';
import { compileF02RenderPlan, parseF02Response } from '../../mobile-relay/bootstrap-f02.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';
import { planTierflowSurface } from '../../mobile-relay/generative-ui/renderer.mjs';
import { createSurface } from '../../mobile-relay/generative-ui/catalog.mjs';
import { compileF01Profile } from '../../mobile-relay/bootstrap-f01.mjs';
import { compilePassOutput, DEEP_PASSES } from '../../mobile-relay/bootstrap-pass.mjs';
import { compilePresetRenderPlan, compileProvisionalPlan, hasPreset, surfaceVariables } from '../../mobile-relay/theme-plan.mjs';
import { F02_FONT_STACKS } from '../../mobile-relay/bootstrap-f02.mjs';

export const BOOTSTRAP_SCHEMA = 'vivim.bootstrap-service/1';
export const WORLD_DEFAULT = 'world-local';
// Honest UI revision statuses (PRD 11 §5.3). A revision is only 'applied' after the Host
// committed it; 'superseded' and 'reverted' are history states the ledger keeps.
export const UI_REVISION_STATUSES = Object.freeze(['proposed', 'previewed', 'accepted', 'applied', 'rejected', 'conflict']);
export const UI_REVISION_HISTORY_STATUSES = Object.freeze(['superseded', 'reverted']);
const UI_REVISION_ANY = new Set([...UI_REVISION_STATUSES, ...UI_REVISION_HISTORY_STATUSES]);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const PHASES = ['connecting', 'learning', 'shaping', 'deepening', 'blocked', 'uncertain'];
const MAX_PROJECTION_BYTES = 32 * 1024;
// A grant is an owner decision with a bounded area. Nothing outside the granted area
// can be written by provider output, a phone command or the local UI.
const GRANT_SCOPES = Object.freeze({
  'onboarding-visual': ['visual'],
  'full-bootstrap': ['visual', 'profile', 'boundary', 'pass']
});

// Bounded grants. Every NEW grant carries a send cap, an absolute expiry and an optional
// prompt-digest binding. A grant record written before these fields existed keeps its
// original unbounded meaning, so upgrading never revokes authority the owner already gave.
export const GRANT_MAX_SENDS = 20;
export const GRANT_MAX_EXPIRY_MS = 24 * 3600000;
export const GRANT_META_KEY = 'grant.bootstrap';
export const GRANT_REVOKED_META_KEY = 'grant.bootstrap.revoked';
const SHA256_HEX = /^[a-f0-9]{64}$/;
// Distinct machine-readable refusal codes. The order of evaluation is fixed:
// revoked -> not granted -> expired -> scope -> digest -> thread -> exhausted.
export const GRANT_REASONS = Object.freeze({
  revoked: 'GRANT_REVOKED',
  notGranted: 'GRANT_REQUIRED',
  expired: 'GRANT_EXPIRED',
  scope: 'GRANT_SCOPE',
  digest: 'GRANT_DIGEST_MISMATCH',
  thread: 'GRANT_THREAD_REQUIRED',
  exhausted: 'GRANT_EXHAUSTED',
  claimUnavailable: 'GRANT_CLAIM_UNAVAILABLE',
  badBounds: 'GRANT_BAD_BOUNDS',
  badDigest: 'GRANT_BAD_DIGEST'
});

export function readGrant(ledger, key = GRANT_META_KEY) {
  try { const raw = ledger.meta.get(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function writeGrant(ledger, grant, key = GRANT_META_KEY) {
  ledger.meta.set(key, JSON.stringify(grant));
}
// Absent bound means a legacy unbounded record. An unreadable one fails closed as expired.
export function grantExpiryMs(grant) {
  if (!grant || grant.expiresAt === undefined || grant.expiresAt === null) return null;
  const parsed = typeof grant.expiresAt === 'string' ? Date.parse(grant.expiresAt) : Number(grant.expiresAt);
  return Number.isFinite(parsed) ? parsed : 0;
}
export function grantBoundDigest(grant) {
  return typeof grant?.promptDigest === 'string' && SHA256_HEX.test(grant.promptDigest) ? grant.promptDigest : null;
}
function grantRefusalMessage(code) {
  switch (code) {
    case GRANT_REASONS.revoked: return 'bootstrap grant was revoked by the owner';
    case GRANT_REASONS.notGranted: return 'bootstrap has not been granted by the owner';
    case GRANT_REASONS.expired: return 'bootstrap grant expired; the owner must grant again';
    case GRANT_REASONS.scope: return 'grant scope does not allow this write';
    case GRANT_REASONS.digest: return 'grant is bound to a different prompt digest';
    case GRANT_REASONS.thread: return 'bootstrap grant covers fresh threads only';
    case GRANT_REASONS.exhausted: return 'bootstrap grant send cap is exhausted';
    default: return 'bootstrap grant refused';
```

_First 80 of 841 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
