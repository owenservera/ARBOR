# ARBOR Development Intelligence (HQ)

This is a **physically imported in-repository package**. It does not depend on a
repos-hq checkout, external HQ daemon/server, donor database or cross-repo API.
The original JavaScript/SQLite indexing, search, semantic registry, context
bundle and deterministic wiki algorithms live under ./lib, with the original
diagnostic CLI under ./bin/hq.mjs. Imported source files are unchanged and
pinned by ./source-provenance.json.

## Public integration entrypoint

Import createDevIntelligence from ./lib/arbor-service.mjs (or from
@arbor/dev-intelligence after workspace installation). The wrapper uses the
same HQ source algorithms; it does not implement a second index/search/wiki.

createDevIntelligence({ dataDir, approvedRoots }) returns:

- registerSource({name,path}), removeSource(name), index({force});
- search({query,project,limit,offset}), symbols(...), files(...);
- context({task,project,budgetTokens,maxFiles}), verifyContext(bundle);
- indexWatermarks(), sourceEvidence({project,path,startLine,endLine});
- graph({kind,project,target,depth}), wiki({force,maxFilePages});
- semanticIds(), semanticId(id), scanCapabilities({path,id}), status().

The Host MUST supply exact **consented development-project roots** in
approvedRoots for each access. Registered paths are metadata, not grants.
No projects are selected by default; methods reject unapproved registered
sources instead of silently searching them. Host World/personal sources do
not belong in this store. The adapter grants no Host effects.

Runtime state is located under a per-user application data path by default:
%LOCALAPPDATA%/ARBOR/development-intelligence on Windows, or
~/.local/share/ARBOR/development-intelligence elsewhere. It holds
projects.json, .hq/index.db, generated wiki and rebuildable caches.
No state is committed to Git. Host may pass a different user-data folder.
No external source DB is reused or needed.

## Internal diagnostic CLI

Run from the ARBOR checkout with Node 24+:

    node hq/bin/arbor-hq.mjs help
    node hq/bin/arbor-hq.mjs register --name example --source C:\code\example --allow C:\code\example
    node hq/bin/arbor-hq.mjs index --allow C:\code\example
    node hq/bin/arbor-hq.mjs search indexer --allow C:\code\example

--allow must be provided on *every* access. Use multiple --allow flags when
more than one development source is registered. The original HQ CLI source
remains available for behavior-parity inspection, but is NOT mounted as the
general-purpose end-user command surface.

## Runtime dependencies and tests

Requires Node >=24 for built-in node:sqlite with SQLite FTS5, file access to
explicitly approved development roots, local write permission to the selected
per-user data directory, and Git for git-aware revision capture. Existing
package-manager versions in donor: Bun 1.4.x; CI/workspace ownership belongs
to Lane G. No third-party production package or outside HQ runtime required.

From ARBOR/hq:

    node --test test/arbor-service.test.mjs
    node --test test/in-repo-closure.test.mjs
    node --test test/indexer.test.mjs test/search.test.mjs test/graph.test.mjs test/context.test.mjs test/wiki.test.mjs test/semantic-registry.test.mjs

Additional imported focused tests under test/ are unmodified donor tests and
some are not hermetic outside the assembled product tree; only G should
enable a combined suite after required other lanes and fixtures are present.
The commands above are intended tests, NOT claims that they have run.

## Source/writer ownership

HQ JS owns internal **development intelligence** index and derived wiki.
HQKG Rust graph compute belongs exclusively to native/hqkg (Lane A);
Host World, grants and effect writer belong to apps/vivim-host (Lane B).
The dev index is rebuildable; it is never a personal World or effect ledger.
