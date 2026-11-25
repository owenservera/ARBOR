# Universal Absorption — discovery agent protocol R003
Master owns shared primitive taxonomy, deduplication, admission and integration. Discovery workers own scoped real observations, not new core engines. ChatGPT direct via VIVIM MCP; no local coding agents. Cloud GitHub for source changes; do not edit production or shared checkout. Use existing Craft/Studio/Host/UIA infrastructure; read ARBOR AGENTS.md and Labs craft-anything-arbor-adapter docs. Use a distinct project and browser scope per application; no concurrent workers manipulating the same browser target. No credentials, private user content, account records, sends, edits, purchases, deletions, or settings changes during discovery. Respect site authorization and record blocked surfaces.

## Output paths
Use an operator-granted local scratch directory per site/run; raw evidence stays local. Return exact paths, source SHA-256, target origin, observed states, gaps, and VIVIM execution receipts. Do not commit raw captures. No fabricated evidence IDs. Give a proposal file with semantic candidate IDs, surface IDs and real source references. Master reviews before admission.

## Preferred input A — actual Craft atlas
Export genuine stock Craft evidence from one persistent session, validate with existing Labs adapter CLI (see README there), and produce atlas.json. Do not make a second importer. Use existing Studio projection. The master runs:
```powershell
$env:VIVIM_ABSORPTION_EXE = 'ABSOLUTE_PATH_TO_BUILT_vivim-absorption.exe'
$env:VIVIM_ABSORPTION_STORE = 'ABSOLUTE_OPERATOR_OWNED_LOCAL_INBOX'
node core/absorption/intake.mjs intake SITE_ID EXPECTED_ORIGIN ABSOLUTE_ATLAS_PATH
node core/absorption/intake.mjs read RECEIPT_ID
```
Rust binary: cargo build --manifest-path core/absorption/Cargo.toml. Use a source-pinned build, not an unreviewed local patch. Existing native Host projector shadow status is retained; no execution admission implied.

## Input B — real Windows UIA observations
The existing Facebook baseline uses vivim.facebook-uia-observation/1; native operation uia-facebook accepts exact original bytes and fixed scope. New workers can emit vivim.application-uia-observation/1, with target {siteId,origin}, source {producer:"craft-anything",method:"windows-uia"}, executionAuthorized:false, privateContentPersisted:false, observations:[{surface:"stable-surface-name",nodes:actualCount,controls:[observedNonprivateControlNames]}]. These values must reflect genuine captured observations, not example data. Include separate original execution receipts and provenance; the inbox treats external UIA claims as unattested, strips surface/control text, keeps source SHA and counts/ordinals. Master invokes native binary with argv ["uia",store,expectedSiteId,expectedOrigin] and exact input bytes on stdin (legacy Facebook: ["uia-facebook",store]). This path accepts no arbitrary raw source text into the shared store.

## Input C — semantic proposals after source intake
After master returns the observation receipt ID, provide JSON:
```json
{"schema":"vivim.absorption-semantic-handoff/1","scope":{"siteId":"SITE","origin":"ORIGIN"},"sourceId":"ACTUAL_RECEIPT_ID","candidates":[{"primitiveId":"messaging.conversation.list","surfaceId":"inbox","evidenceRefs":["uia:0"]}]}
```
Example only, not evidence. Atlas refs use actual observed ev_ IDs; UIA refs use zero-based source ordinals. No guesses marked as observed. Master calls binary argv ["handoff",store] with JSON stdin. Read back via ["read",store] with {"id":"ACTUAL_RECEIPT_ID"}. Candidate names are open-world; no automatic new primitive version or authorization.

## First assignments (one ChatGPT session per assignment)
1. Facebook existing worker: finish current authorized scope, export actual baseline/canonical atlas and semantic proposal. Do not restart completed work. Identify messaging, contacts, groups, feeds, search, preferences, navigation.
2. WhatsApp Web https://web.whatsapp.com — compare conversation, compose, attachment, search, group and read-state capabilities with Facebook. No actual sends or private conversation export.
3. ChatGPT https://chatgpt.com — thread navigation, composer, attachments, model selection, response states, artifacts, history/settings. Reuse existing Studio/Harness profiles; do not submit prompts unless separately authorized.
4. Gmail https://mail.google.com — inbox/list, labels, search, thread, compose/drafts and attachments. No private message bodies, no send.
5. GitHub https://github.com — public repo, issue, PR, files, search, project navigation, code review affordances; no repository mutations.
6. Public legal/accounting pilots: Clio https://www.clio.com and Xero https://www.xero.com — public surface only until authorized app access; distinguish marketing from authenticated capabilities.

Launch only targets with authorized access; sequentialize workers that would share a browser/profile. Ask the master for an intake ID after capture. No worker changes core/absorption or creates another shared runtime.

## Current limitations
The durable inbox and Host bridge are development integration, not registered production endpoints; build binary before native intake. Semantic candidates do not promote automatically into VLANG, HQKG or executable Harness bindings. No complete 1,000-target registry yet. Native runtime test and real Facebook admission must be separately evidenced.
