# File: apps/vivim-host/server.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/server.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 77215 B |
| Lines | 1272 |
| Hash | 296654643afd |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 41 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 42 | no | const REPO_ROOT = path.resolve(here, &#39;..&#39;, &#39;..&#39;); |
| STUDIO_CLI | const | 43 | no | const STUDIO_CLI = path.join(REPO_ROOT, &#39;studio&#39;, &#39;bin&#39;, &#39;studio.mjs&#39;); |
| execFile | const | 44 | no | const execFile = promisify(execFileCb); |
| SECURITY | const | 46 | no | const SECURITY = { |
| MIME | const | 53 | no | const MIME = { |
| ASSETS | const | 75 | no | const ASSETS = { |
| STATES | const | 97 | no | const STATES = [&#39;queued&#39;, &#39;claimed&#39;, &#39;done&#39;, &#39;failed&#39;]; |
| studioDataDir | function | 99 | yes | export function studioDataDir(env = process.env, platform = process.platform, home = os.homedir()) { |
| paths | const | 100 | no | const paths = platform === &#39;win32&#39; ? path.win32 : path.posix; |
| manifestFile | function | 110 | yes | export function manifestFile(env = process.env) { |
| mf | const | 111 | no | const mf = workspaceManifestFile(env); |
| manifestComplete | function | 117 | yes | export function manifestComplete(env = process.env) { |
| file | const | 118 | no | const file = manifestFile(env); |
| m | const | 121 | no | const m = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| runCommand | function | 127 | no | async function runCommand(file, args) { |
| onboardingState | function | 137 | no | function onboardingState() { |
| env | const | 138 | no | const env = detectEnvironment(); |
| bridgeSnapshot | function | 149 | yes | export function bridgeSnapshot(dataRoot) { |
| file | const | 150 | no | const file = path.join(dataRoot, &#39;bridge&#39;, &#39;commands.jsonl&#39;); |
| records | const | 154 | no | const records = new Map(); |
| r | const | 158 | no | const r = JSON.parse(line); |
| rows | const | 162 | no | const rows = [...records.values()].sort((a, b) =&gt; String(b.updatedAt \|\| &#39;&#39;).localeCompare(String(a.updatedAt \|\| &#39;&#39;))); |
| totals | const | 163 | no | const totals = Object.fromEntries(STATES.map(s =&gt; [s, rows.filter(r =&gt; r.status === s).length])); |
| recent | const | 164 | no | const recent = rows.slice(0, 12).map(r =&gt; ({ id: r.id, consumer: r.consumer === &#39;harness&#39; ? &#39;harness&#39; : r.consumer === &#39;grokbot&#39; ? &#39;grokbot&#39; : &#39;unknown&#39;, status: r.status, updatedAt: r.updatedAt \|\| n… |
| hostSnapshot | function | 169 | yes | export function hostSnapshot({ dataRoot, now = () =&gt; new Date().toISOString(), journalRoot = path.resolve(here, &#39;../../runtime/journal&#39;), bootstrap = null }) { |
| observedAt | const | 170 | no | const observedAt = now(); |
| bridge | const | 171 | no | const bridge = bridgeSnapshot(dataRoot); |
| journey | const | 172 | no | const journey = messageJourney(dataRoot, { now: observedAt, journalRoot }); |
| services | const | 173 | no | const services = { |
| snapshot | const | 179 | no | const snapshot = { |
| createHostServer | function | 191 | yes | export function createHostServer({ dataRoot = studioDataDir(), staticRoot = path.join(here, &#39;public&#39;), bootstrap = null, ownerToken = null, directPhone = null, worker = null, studioUrl = null, studio… |
| productJournal | const | 193 | no | const productJournal = createProductJournal({ dataRoot }); |
| runtime | variable | 194 | no | let runtime = bootstrap; |
| token | variable | 195 | no | let token = ownerToken; |
| runtimeFor | function | 196 | no | const runtimeFor = () =&gt; { |
| tokenFor | function | 200 | no | const tokenFor = () =&gt; { |
| supervisor | const | 205 | no | const supervisor = createWorkerSupervisor({ dataRoot, // Feed the supervisor the Host&#39;s existing read-only native worker probe // (diagnostics.mjs). Roles without a probe stay &quot;missing evidence&quot;, whi… |
| admitted | const | 216 | no | const admitted = supervisor.takeover(&#39;bootstrap&#39;, process.pid); |
| control | variable | 220 | no | let control = null; |
| uiSessions | const | 221 | no | const uiSessions = createControlBrowserSessions(); |
| controlFor | function | 222 | no | const controlFor = () =&gt; (control ??= createControlDispatcher({ dataRoot, runtime: runtimeFor(), devices: enrollment, productJournal })); |
| nativeContext | const | 223 | no | const nativeContext = createRustChatContext({dataRoot:path.resolve(dataRoot),productJournal,control:controlFor}); |
| apk | const | 226 | no | const apk = createApkRegistry({ dataRoot }); |
| bundledApk | const | 229 | no | const bundledApk = process.env.VIVIM_BUNDLED_APK; |
| bundledManifest | const | 230 | no | const bundledManifest = process.env.VIVIM_BUNDLED_APK_MANIFEST; |
| manifest | const | 233 | no | const manifest = JSON.parse(readFileSync(bundledManifest, &#39;utf8&#39;).replace(String.fromCharCode(0xfeff), &#39;&#39;)); |
| actualSha | const | 234 | no | const actualSha = createHash(&#39;sha256&#39;).update(readFileSync(bundledApk)).digest(&#39;hex&#39;); |
| installed | const | 240 | no | const installed = apk.getRelease(manifest.releaseId); |
| current | const | 241 | no | const current = apk.getCurrent(); |
| pairing | const | 255 | no | const pairing = createPairingStore({ dataRoot }); |
| onboardingService | const | 257 | no | const onboardingService = onboarding ?? createOnboardingService({ dataRoot, getRuntime: runtimeFor, directOrigin: directPhone?.origin ?? null, studio: studioUrl ? createStudioPort({ url: studioUrl, t… |
| direct | const | 263 | no | const direct = directPhone ? createDirectPhoneHandler({ ...directPhone, dataRoot, worldId: runtimeFor().worldId, projection: () =&gt; runtimeFor().projection(), webMemory: opts =&gt; runtimeFor().webMemory… |
| enrollment | const | 282 | no | const enrollment = createEnrollment({ dataRoot, origin: null, user: null }); |
| server | const | 283 | no | const server = http.createServer(async (req, res) =&gt; { for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v); const rawPath = String(req.url \|\| &#39;&#39;).split(&#39;?&#39;)[0]; const host = String(req… |
| rawPath | const | 285 | no | const rawPath = String(req.url \|\| &#39;&#39;).split(&#39;?&#39;)[0]; |
| host | const | 286 | no | const host = String(req.headers.host \|\| &#39;&#39;).toLowerCase(); |
| localHost | const | 287 | no | const localHost = /^(127\\.0\\.0\\.1\|localhost)(:\\d{1,5})?$/.test(host) &amp;&amp; |
| loopbackPeer | const | 291 | no | const loopbackPeer = [&#39;127.0.0.1&#39;, &#39;::1&#39;, &#39;::ffff:127.0.0.1&#39;].includes(req.socket.remoteAddress); |
| pathname | const | 296 | no | const pathname = new URL(req.url \|\| &#39;/&#39;, &#39;http://localhost&#39;).pathname; |
| workerMatch | const | 319 | no | const workerMatch = pathname.match(/^\\/api\\/host\\/worker\\/([^\\/]+)\\/(status\|recover)$/); |
| payload | variable | 362 | no | let payload; |
| entry | variable | 371 | no | let entry; |
| owner | variable | 414 | no | let owner; |
| stored | const | 423 | no | const stored = await productJournal.append(entry); |
| indexing | const | 435 | no | const indexing = pathname.endsWith(&#39;/index&#39;); |
| context | const | 436 | no | const context = pathname.endsWith(&#39;/context&#39;); |
| sameOrigin | const | 441 | no | const sameOrigin = String(req.headers.origin \|\| &#39;&#39;).toLowerCase() === &#39;http://&#39; + host; |
| bearer | variable | 446 | no | let bearer = false; |
| session | const | 448 | no | const session = uiSessions.get(req); |
| sessionOk | const | 449 | no | const sessionOk = session &amp;&amp; uiSessions.authorized(req, { mutate: indexing }); |
| empty | const | 451 | no | const empty = { schema: &#39;vivim.file-surface/1&#39;, generatorVersion: &#39;hq.source-index/1&#39;, |
| config | const | 454 | no | const config = developmentSources ?? { |
| actorId | const | 458 | no | const actorId = &#39;desktop-owner&#39;; |
| sessionId | const | 459 | no | const sessionId = bearer ? &#39;owner-token&#39; : session.sessionId; |
| surface | const | 460 | no | const surface = await createLiveSourceSurface({ approvedRoots: config.approvedRoots, dataDir: config.dataDir, actorId, sessionId, authorize: request =&gt; request.actorId === actorId &amp;&amp; request.sessionI… |
| params | const | 467 | no | const params = new URL(req.url, &#39;http://&#39; + host).searchParams; |
| project | const | 468 | no | const project = params.get(&#39;project&#39;) ?? undefined; |
| query | const | 469 | no | const query = params.get(&#39;q&#39;) ?? &#39;&#39;; |
| sourcePath | const | 470 | no | const sourcePath = params.get(&#39;path&#39;) ?? undefined; |
| task | const | 471 | no | const task = params.get(&#39;task&#39;) ?? &#39;&#39;; |
| anchorId | const | 472 | no | const anchorId=params.get(&#39;anchor&#39;)??undefined, fingerprint=params.get(&#39;fingerprint&#39;)??undefined; |
| value | const | 478 | no | const value = indexing ? surface.refresh() |
| projected | const | 499 | no | const projected = await productJournal.readProjection(); |
| format | const | 512 | no | const format = new URL(req.url, &#39;http://localhost&#39;).searchParams.get(&#39;format&#39;); |
| raw | const | 517 | no | const raw = format === &#39;jsonl&#39;; |
| body | const | 518 | no | const body = raw ? await productJournal.rawJournal() : JSON.stringify(await productJournal.readRecords()); |
| asset | variable | 529 | no | let asset = ASSETS[pathname]; |
| body | const | 533 | no | const body = await readFile(path.join(staticRoot, asset)); |
| BOOTSTRAP_BODY_LIMIT | const | 542 | no | const BOOTSTRAP_BODY_LIMIT = 256 * 1024; |
| BOOTSTRAP_MUTATIONS | const | 543 | no | const BOOTSTRAP_MUTATIONS = { |
| sendJson | function | 557 | no | function sendJson(res, status, body) { |
| readJsonBody | function | 562 | no | function readJsonBody(req, limit = BOOTSTRAP_BODY_LIMIT) { |
| size | variable | 566 | no | let size = 0, tooLarge = false; const chunks = []; |
| text | const | 576 | no | const text = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| handleBootstrap | function | 587 | no | async function handleBootstrap(req, res, pathname, host, runtime, tokenFor) { |
| origin | const | 588 | no | const origin = req.headers.origin; |
| expected | const | 589 | no | const expected = &#39;http://&#39; + host; |
| surface | const | 601 | no | const surface = runtime.uiRevision(); |
| revision | const | 602 | no | const revision = surface ? Number(surface.revision) : null; |
| status | const | 603 | no | const status = revision === null ? null : runtime.uiRevisionStatus(revision)?.status ?? &#39;applied&#39;; |
| deviceMatch | const | 610 | no | const deviceMatch = pathname.match(/^\\/api\\/host\\/devices\\/([^\\/]+)\\/(approve\|revoke)$/); |
| ownerToken | variable | 614 | no | let ownerToken = null; |
| debugMatch | const | 628 | no | const debugMatch = pathname.match(/^\\/api\\/host\\/debug\\/(apk\|devices)$/); |
| ownerToken | variable | 632 | no | let ownerToken = null; |
| kind | const | 636 | no | const kind = debugMatch[1]; |
| mutate | const | 654 | no | const mutate = BOOTSTRAP_MUTATIONS[pathname]; |
| ownerToken | variable | 658 | no | let ownerToken = null; |
| body | variable | 664 | no | let body; |
| out | const | 668 | no | const out = await mutate(runtime, body); |
| code | const | 671 | no | const code = error?.code ?? &#39;INVALID&#39;; |
| status | const | 672 | no | const status = code === &#39;LEDGER_UNAVAILABLE&#39; ? 503 : code === &#39;GRANT_REQUIRED&#39; \|\| code === &#39;GRANT_SCOPE&#39; ? 403 : code === &#39;IDEMPOTENCY_CONFLICT&#39; ? 409 : 400; |
| APK_REGISTER_BODY_LIMIT | const | 682 | no | const APK_REGISTER_BODY_LIMIT = 64 * 1024; |
| APK_APPLICATION_ID | const | 683 | no | const APK_APPLICATION_ID = &#39;inc.vivim.app&#39;; |
| apkSlug | function | 684 | no | const apkSlug = (value, max) =&gt; String(value ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9_-]+/g, &#39;-&#39;) |
| handleDataIntelligence | function | 690 | no | function handleDataIntelligence(req, res, pathname, host, runtimeFor, tokenFor) { |
| body | variable | 699 | no | let body; |
| handleApk | function | 707 | no | async function handleApk(req, res, pathname, host, apk, tokenFor) { |
| origin | const | 708 | no | const origin = req.headers.origin; |
| body | variable | 716 | no | let body; |
| rawPath | const | 719 | no | const rawPath = typeof body.apkPath === &#39;string&#39; ? body.apkPath.trim() : &#39;&#39;; |
| apkPath | const | 721 | no | const apkPath = path.resolve(rawPath); |
| sha | variable | 723 | no | let sha = null; |
| versionCode | const | 726 | no | const versionCode = Number(body.versionCode) \|\| 1; |
| versionName | const | 727 | no | const versionName = typeof body.versionName === &#39;string&#39; &amp;&amp; body.versionName.trim() ? body.versionName.trim() : &#39;1.0.0&#39;; |
| releaseId | const | 728 | no | const releaseId = typeof body.releaseId === &#39;string&#39; &amp;&amp; body.releaseId.trim() |
| existing | const | 731 | no | const existing = apk.getRelease(releaseId); |
| release | const | 738 | no | const release = apk.registerRelease({ releaseId, applicationId: typeof body.applicationId === &#39;string&#39; &amp;&amp; body.applicationId.trim() ? body.applicationId.trim() : APK_APPLICATION_ID, versionCode, vers… |
| releaseId | const | 763 | no | const releaseId = new URL(req.url \|\| &#39;/&#39;, &#39;http://localhost&#39;).searchParams.get(&#39;releaseId&#39;); |
| streamInfo | variable | 765 | no | let streamInfo; |
| stream | const | 775 | no | const stream = createReadStream(filePath); |
| ownerAuthorized | function | 784 | no | function ownerAuthorized(req, res, tokenFor) { |
| ownerToken | variable | 785 | no | let ownerToken = null; |
| handleControl | function | 797 | no | async function handleControl(req, res, pathname, host, controlFor, tokenFor, uiSessions, enrollment, runtimeFor, productJournal, nativeContext, developmentSources) { |
| route | const | 798 | no | const route = pathname.slice(&#39;/api/host/control/&#39;.length); |
| sameOrigin | const | 799 | no | const sameOrigin = String(req.headers.origin \|\| &#39;&#39;).toLowerCase() === &#39;http://&#39; + host; |
| isMutation | const | 800 | no | const isMutation = [&#39;plan&#39;, &#39;interpret&#39;, &#39;execute&#39;, &#39;ui-logout&#39;, &#39;devices/approve&#39;, &#39;devices/revoke&#39;,&#39;development/register&#39;,&#39;development/index&#39;,&#39;development/hvi-grant&#39;,&#39;development/hvi-revoke&#39;].inclu… |
| body | const | 813 | no | const body = await readJsonBody(req, 4096); |
| session | const | 817 | no | const session = uiSessions.exchange(body.code); |
| session | const | 827 | no | const session = uiSessions.get(req); |
| authorized | variable | 833 | no | let authorized = false; |
| owner | variable | 834 | no | let owner = null; |
| developmentPort | function | 841 | no | const developmentPort=()=&gt;createDevelopmentReadPort({ config:developmentSources??{approvedRoots:JSON.parse(process.env.VIVIM_HQ_APPROVED_ROOTS\|\|&#39;[]&#39;),dataDir:process.env.VIVIM_HQ_DATA_DIR\|\|undefined}… |
| op | const | 848 | no | const op=route.slice(&#39;development/&#39;.length); |
| port | const | 853 | no | const port=developmentPort(),body=op===&#39;status&#39;?undefined:await readJsonBody(req,8192); |
| method | const | 854 | no | const method={&#39;status&#39;:&#39;status&#39;,&#39;register&#39;:&#39;register&#39;,&#39;index&#39;:&#39;refresh&#39;,&#39;hvi-grant&#39;:&#39;issueGrant&#39;,&#39;hvi-revoke&#39;:&#39;revokeGrant&#39;}[op]; |
| value | const | 855 | no | const value=await port[method](body); |
| readStudioOutcomes | function | 859 | no | function readStudioOutcomes(){ |
| context | const | 878 | no | const context = await productJournal.readWikiContext(); |
| applicationEffects | variable | 879 | no | let applicationEffects; |
| native | const | 882 | no | const native = await nativeContext(&#39;wiki&#39;,{owner:true}); |
| enriched | const | 887 | no | const enriched = { ...context, applicationEffects, nativeContext:native, studioOutcomes:readStudioOutcomes() }; |
| projected | const | 899 | no | const projected = runtimeFor().projection(); |
| recent | const | 903 | no | const recent = controlFor().recent(12).map(r =&gt; ({ planId: r.planId, actionId: r.actionId, risk: r.risk, state: r.state, createdAt: r.createdAt, source: r.source })); |
| grants | const | 907 | no | const grants = enrollment.listGrants(); |
| media | const | 910 | no | const media = await createMediaPlaybackService().list(); |
| params | const | 940 | no | const params = readMemoryParams(new URL(req.url, &#39;http://&#39; + host).searchParams); |
| reads | const | 974 | no | const reads = { catalog: c =&gt; c.describe(), world: c =&gt; c.world(), language: c =&gt; c.languagePack(), lexicon: c =&gt; c.lexicon(), rules: c =&gt; c.ownerRules(), recent: c =&gt; ({ items: c.recent(20) }) }; |
| planMatch | const | 975 | no | const planMatch = route.match(/^plans\\/(ctl-[a-f0-9]{16})$/); |
| body | const | 989 | no | const body = await readJsonBody(req, 64 * 1024); |
| c | const | 990 | no | const c = controlFor(); |
| interpret | function | 996 | no | const interpret=text=&gt;c.interpret(text,{source:&#39;desktop&#39;}); |
| meaning | const | 997 | no | const meaning=interpret(body.text); |
| wiki | variable | 999 | no | let wiki=null; |
| currentOwner | variable | 1003 | no | let currentOwner=null; |
| plan | const | 1013 | no | const plan = await c.plan(body, { source: &#39;desktop&#39;, actor: &#39;desktop-owner&#39;, readHvi: selection=&gt;developmentPort().compare(selection) }); |
| stillOwner | function | 1015 | no | const stillOwner = () =&gt; { |
| result | const | 1021 | no | const result = await attachRequestContext(plan, { text: body.text, readWiki: () =&gt; productJournal.readPhoneWiki(), compileSources: async params =&gt; { if (!stillOwner()) throw new Error(&#39;OWNER_AUTH&#39;); |
| config | const | 1026 | no | const config = developmentSources ?? { |
| session | const | 1032 | no | const session = uiSessions.get(req); |
| actorId | const | 1033 | no | const actorId = &#39;desktop-owner&#39;; |
| sessionId | const | 1034 | no | const sessionId = session?.sessionId ?? &#39;owner-token&#39;; |
| surface | const | 1035 | no | const surface = await createLiveSourceSurface({ approvedRoots:config.approvedRoots,dataDir:config.dataDir,actorId,sessionId, authorize: request =&gt; request.actorId===actorId &amp;&amp; request.sessionId===ses… |
| currentOwner | variable | 1044 | no | let currentOwner = null; |
| code | const | 1056 | no | const code = error?.code ?? &#39;CONTROL_INVALID&#39;; |
| handleOnboarding | function | 1063 | no | async function handleOnboarding(req, res, pathname, apk, pairing, onboarding, enrollment, host, tokenFor, dataRoot) { |
| studioCli | const | 1064 | no | const studioCli = STUDIO_CLI; |
| send | function | 1065 | no | const send = (status, body) =&gt; sendJson(res, status, body); |
| fail | function | 1066 | no | const fail = (status, message, code = &#39;INVALID&#39;) =&gt; send(status, { ok: false, error: message, code }); |
| sameOrigin | function | 1067 | no | const sameOrigin = () =&gt; String(req.headers.origin \|\| &#39;&#39;).toLowerCase() === &#39;http://&#39; + host; |
| isInside | function | 1068 | no | const isInside = (root, target) =&gt; { |
| r | const | 1069 | no | const r = path.resolve(root); |
| t | const | 1070 | no | const t = path.resolve(target); |
| requireOwnerMutation | function | 1073 | no | const requireOwnerMutation = () =&gt; { |
| privilegedPost | const | 1079 | no | const privilegedPost = new Set([ &#39;/api/onboarding/setup&#39;, &#39;/api/onboarding/start&#39;, &#39;/api/onboarding/doctor&#39;, &#39;/api/onboarding/apk/register&#39;, &#39;/api/onboarding/pair/register&#39;, &#39;/api/onboarding/provider… |
| body | variable | 1094 | no | let body; |
| port | const | 1098 | no | const port = Number(cdpPort) \|\| 38702; |
| out | const | 1099 | no | const out = await runCommand(process.execPath, [ studioCli, &#39;setup&#39;, &#39;--yes&#39;, &#39;--workspace-root&#39;, workspaceRoot, &#39;--chrome-exe&#39;, chromeExe, &#39;--chrome-profile&#39;, chromeProfile, |
| mf | const | 1112 | no | const mf = manifestFile(); |
| dataDir | variable | 1113 | no | let dataDir = &#39;C:\\\\VIVIM&#39;; |
| m | const | 1115 | no | const m = JSON.parse(readFileSync(mf, &#39;utf8&#39;)); |
| ps1 | const | 1118 | no | const ps1 = path.join(REPO_ROOT, &#39;studio&#39;, &#39;scripts&#39;, &#39;windows&#39;, &#39;VIVIM.ps1&#39;); |
| out | const | 1119 | no | const out = await runCommand(&#39;powershell.exe&#39;, [&#39;-NoProfile&#39;, &#39;-ExecutionPolicy&#39;, &#39;Bypass&#39;, &#39;-File&#39;, ps1, &#39;-DataDir&#39;, dataDir]); |
| out | const | 1126 | no | const out = await runCommand(process.execPath, [studioCli, &#39;doctor&#39;, &#39;--json&#39;]); |
| report | variable | 1127 | no | let report; |
| body | variable | 1138 | no | let body; |
| rawPath | const | 1140 | no | const rawPath = typeof body.apkPath === &#39;string&#39; ? body.apkPath.trim() : &#39;&#39;; |
| apkPath | const | 1142 | no | const apkPath = path.resolve(rawPath); |
| allowedRoots | const | 1143 | no | const allowedRoots = [path.join(dataRoot, &#39;apk-artifacts&#39;), REPO_ROOT]; |
| sha | variable | 1148 | no | let sha; |
| versionCode | const | 1151 | no | const versionCode = Number(body.versionCode) \|\| 1; |
| versionName | const | 1152 | no | const versionName = typeof body.versionName === &#39;string&#39; &amp;&amp; body.versionName.trim() ? body.versionName.trim() : &#39;1.0.0&#39;; |
| releaseId | const | 1153 | no | const releaseId = typeof body.releaseId === &#39;string&#39; &amp;&amp; body.releaseId.trim() |
| existing | const | 1156 | no | const existing = apk.getRelease(releaseId); |
| release | const | 1162 | no | const release = apk.registerRelease({ releaseId, applicationId: typeof body.applicationId === &#39;string&#39; &amp;&amp; body.applicationId.trim() ? body.applicationId.trim() : &#39;inc.vivim.app&#39;, versionCode, version… |
| releaseId | const | 1181 | no | const releaseId = new URL(req.url \|\| &#39;/&#39;, &#39;http://localhost&#39;).searchParams.get(&#39;releaseId&#39;); |
| streamInfo | variable | 1183 | no | let streamInfo; |
| stream | const | 1193 | no | const stream = createReadStream(filePath); |
| grants | const | 1204 | no | const grants = enrollment.listGrants(); |
| active | const | 1205 | no | const active = grants.find(g =&gt; g.status === &#39;active&#39; &amp;&amp; !g.revokedAt); |
| pending | const | 1206 | no | const pending = grants.filter(g =&gt; g.status === &#39;pending&#39;).length; |
| guided | const | 1218 | no | const guided = { |
| result | const | 1224 | no | const result = onboarding.approveAndStart({ generationId: body.generationId }); |
| body | variable | 1235 | no | let body; |
| port | const | 1245 | no | const port = Number(process.env.VIVIM_HOST_PORT \|\| 43187); |
| dataRoot | const | 1247 | no | const dataRoot = studioDataDir(); |
| runtime | const | 1251 | no | const runtime = createBootstrapRuntime({ dataRoot }); |
| worker | const | 1252 | no | const worker = createBootstrapCommandWorker({ root: dataRoot, runtime, log: (line) =&gt; console.log(&#39;[bootstrap] &#39; + line), }); |
| ownerToken | variable | 1256 | no | let ownerToken = null; |
| loaded | const | 1258 | no | const loaded = loadOwnerToken({ dataRoot }); |
| directPhone | const | 1264 | no | const directPhone = process.env.VIVIM_DIRECT_ORIGIN \|\| process.env.VIVIM_DIRECT_USER |
| studioUrl | const | 1266 | no | const studioUrl = process.env.VIVIM_STUDIO_URL \|\| &#39;http://127.0.0.1:7878&#39;; |
| server | const | 1267 | no | const server = createHostServer({ dataRoot, bootstrap: runtime, ownerToken, directPhone, worker, studioUrl, studioToken: process.env.VIVIM_STUDIO_TOKEN \|\| null, autoPump: true }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 2 | external |
| node:os | import | 3 | external |
| node:path | import | 4 | external |
| node:fs | import | 5 | external |
| node:fs/promises | import | 6 | external |
| node:crypto | import | 7 | external |
| node:url | import | 8 | external |
| node:child_process | import | 9 | external |
| node:util | import | 10 | external |
| ./diagnostics.mjs | import | 11 | [apps/vivim-host/diagnostics.mjs](./diagnostics.mjs.md) |
| ./recovery/host-adapter.mjs | import | 12 | [apps/vivim-host/recovery/host-adapter.mjs](./recovery/host-adapter.mjs.md) |
| ../../studio/src/config.mjs | import | 13 | [studio/src/config.mjs](../../studio/src/config.mjs.md) |
| ../../studio/src/workspace-manifest.mjs | import | 14 | [studio/src/workspace-manifest.mjs](../../studio/src/workspace-manifest.mjs.md) |
| ./insights.mjs | import | 15 | [apps/vivim-host/insights.mjs](./insights.mjs.md) |
| ./bootstrap/runtime.mjs | import | 16 | [apps/vivim-host/bootstrap/runtime.mjs](./bootstrap/runtime.mjs.md) |
| ./bootstrap/web-memory.mjs | import | 17 | [apps/vivim-host/bootstrap/web-memory.mjs](./bootstrap/web-memory.mjs.md) |
| ./media/playback.mjs | import | 18 | [apps/vivim-host/media/playback.mjs](./media/playback.mjs.md) |
| ./bootstrap/command-worker.mjs | import | 19 | [apps/vivim-host/bootstrap/command-worker.mjs](./bootstrap/command-worker.mjs.md) |
| ./bootstrap/worker-supervisor.mjs | import | 20 | [apps/vivim-host/bootstrap/worker-supervisor.mjs](./bootstrap/worker-supervisor.mjs.md) |
| ./bootstrap/owner-auth.mjs | import | 21 | [apps/vivim-host/bootstrap/owner-auth.mjs](./bootstrap/owner-auth.mjs.md) |
| ./direct-phone.mjs | import | 22 | [apps/vivim-host/direct-phone.mjs](./direct-phone.mjs.md) |
| ./chat/rust-context.mjs | import | 23 | [apps/vivim-host/chat/rust-context.mjs](./chat/rust-context.mjs.md) |
| ./conversations/live-projection.mjs | import | 24 | [apps/vivim-host/conversations/live-projection.mjs](./conversations/live-projection.mjs.md) |
| ./chat/product-journal.mjs | import | 25 | [apps/vivim-host/chat/product-journal.mjs](./chat/product-journal.mjs.md) |
| ./chat/wiki-semantics.mjs | import | 26 | [apps/vivim-host/chat/wiki-semantics.mjs](./chat/wiki-semantics.mjs.md) |
| ./apk/enrollment.mjs | import | 27 | [apps/vivim-host/apk/enrollment.mjs](./apk/enrollment.mjs.md) |
| ./apk/registry.mjs | import | 28 | [apps/vivim-host/apk/registry.mjs](./apk/registry.mjs.md) |
| ./apk/pairing.mjs | import | 29 | [apps/vivim-host/apk/pairing.mjs](./apk/pairing.mjs.md) |
| ./control/dispatcher.mjs | import | 30 | [apps/vivim-host/control/dispatcher.mjs](./control/dispatcher.mjs.md) |
| ./control/browser-session.mjs | import | 31 | [apps/vivim-host/control/browser-session.mjs](./control/browser-session.mjs.md) |
| ./onboarding/service.mjs | import | 32 | [apps/vivim-host/onboarding/service.mjs](./onboarding/service.mjs.md) |
| ./onboarding/studio-port.mjs | import | 33 | [apps/vivim-host/onboarding/studio-port.mjs](./onboarding/studio-port.mjs.md) |
| ./onboarding/environment.mjs | import | 34 | [apps/vivim-host/onboarding/environment.mjs](./onboarding/environment.mjs.md) |
| ./control/http-status.mjs | import | 35 | [apps/vivim-host/control/http-status.mjs](./control/http-status.mjs.md) |
| ./control/live-source-surface.mjs | import | 36 | [apps/vivim-host/control/live-source-surface.mjs](./control/live-source-surface.mjs.md) |
| ./control/development-read-port.mjs | import | 37 | [apps/vivim-host/control/development-read-port.mjs](./control/development-read-port.mjs.md) |
| ./control/request-context.mjs | import | 38 | [apps/vivim-host/control/request-context.mjs](./control/request-context.mjs.md) |
| ../mobile-relay/composer-assist.mjs | import | 39 | [apps/mobile-relay/composer-assist.mjs](../mobile-relay/composer-assist.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/web-memory-auth.test.mjs](./bootstrap/web-memory-auth.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/control/cli.mjs](./control/cli.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/bootstrap-grant.test.mjs](./test/bootstrap-grant.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/bootstrap.test.mjs](./test/bootstrap.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/chat-box-baseline.test.mjs](./test/chat-box-baseline.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/chat-command-surface.test.mjs](./test/chat-command-surface.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/control-browser-session.test.mjs](./test/control-browser-session.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/control-desktop-surface.test.mjs](./test/control-desktop-surface.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/control-http.test.mjs](./test/control-http.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/control-wiki-execution.test.mjs](./test/control-wiki-execution.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/control-wiki-phone.test.mjs](./test/control-wiki-phone.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/data-intelligence.test.mjs](./test/data-intelligence.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/demo-iframe-smoke.test.mjs](./test/demo-iframe-smoke.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/demo-shell-assets.test.mjs](./test/demo-shell-assets.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/demo-shell-tokens.test.mjs](./test/demo-shell-tokens.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/diagnostics.test.mjs](./test/diagnostics.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](./test/direct-phone.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/first-run-phone-contract.test.mjs](./test/first-run-phone-contract.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/host-preview.test.mjs](./test/host-preview.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/host-worker-lifecycle.test.mjs](./test/host-worker-lifecycle.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/host.test.mjs](./test/host.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/insights.test.mjs](./test/insights.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/live-source-surface.test.mjs](./test/live-source-surface.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/media-stream-http.test.mjs](./test/media-stream-http.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/mobile-first-entry.test.mjs](./test/mobile-first-entry.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](./test/onboarding.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/physical-host-pwa-acceptance.test.mjs](./test/physical-host-pwa-acceptance.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/product-routes.test.mjs](./test/product-routes.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/ui-revision.test.mjs](./test/ui-revision.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/vlang-command-compilation.test.mjs](./test/vlang-command-compilation.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/wiki-control-persistence.test.mjs](./test/wiki-control-persistence.test.mjs.md) | ../server.mjs |
| [apps/vivim-host/test/worker-route-security.test.mjs](./test/worker-route-security.test.mjs.md) | ../server.mjs |
| [harness/src/dev/bootstrap.mjs](../../harness/src/dev/bootstrap.mjs.md) | ../../../apps/vivim-host/server.mjs |
| [scripts/acceleration/live-host-check.mjs](../../scripts/acceleration/live-host-check.mjs.md) | ../../apps/vivim-host/server.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Host M0: read-only loopback preview. No browser control, worker starts, or sends.
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { appendFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { workerHealth, messageJourney } from './diagnostics.mjs';
import { projectHostRecovery } from './recovery/host-adapter.mjs';
import { workspaceManifestFile } from '../../studio/src/config.mjs';
import { MANIFEST_FILE, MANIFEST_SCHEMA, MANIFEST_VERSION } from '../../studio/src/workspace-manifest.mjs';
import { diagnoseHost } from './insights.mjs';
import { createBootstrapRuntime } from './bootstrap/runtime.mjs';
import { readMemoryParams } from './bootstrap/web-memory.mjs';
import { createMediaPlaybackService } from './media/playback.mjs';
import { createBootstrapCommandWorker } from './bootstrap/command-worker.mjs';
import { createWorkerSupervisor } from './bootstrap/worker-supervisor.mjs';
import { loadOwnerToken, verifyOwnerToken } from './bootstrap/owner-auth.mjs';
import { createDirectPhoneHandler, serveLoopbackPhoneAsset } from './direct-phone.mjs';
import { createRustChatContext } from './chat/rust-context.mjs';
import {createLiveStateProjection} from './conversations/live-projection.mjs';
import { createProductJournal, projectAppliedControlEffects } from './chat/product-journal.mjs';
import { projectWikiSemantics } from './chat/wiki-semantics.mjs';
import { createEnrollment } from './apk/enrollment.mjs';
import { createApkRegistry } from './apk/registry.mjs';
import { createPairingStore } from './apk/pairing.mjs';
import { createControlDispatcher } from './control/dispatcher.mjs';
import { createControlBrowserSessions, UI_COOKIE } from './control/browser-session.mjs';
import { createOnboardingService } from './onboarding/service.mjs';
import { createStudioPort } from './onboarding/studio-port.mjs';
import { detectEnvironment } from './onboarding/environment.mjs';
import { controlErrorStatus } from './control/http-status.mjs';
import { createLiveSourceSurface } from './control/live-source-surface.mjs';
import { createDevelopmentReadPort } from './control/development-read-port.mjs';
import { attachRequestContext } from './control/request-context.mjs';
import { composerResponse, needsWikiDraftContext } from '../mobile-relay/composer-assist.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '..', '..');
const STUDIO_CLI = path.join(REPO_ROOT, 'studio', 'bin', 'studio.mjs');
const execFile = promisify(execFileCb);

const SECURITY = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};
const MIME = {
  '/': 'text/html; charset=utf-8',
  '/host/control': 'text/html; charset=utf-8',
  '/mobile-first.css': 'text/css; charset=utf-8',
  '/mobile-first.js': 'text/javascript; charset=utf-8',
  '/onboarding': 'text/html; charset=utf-8',
  '/host.css': 'text/css; charset=utf-8',
  '/host.js': 'text/javascript; charset=utf-8',
  '/control-panel.js': 'text/javascript; charset=utf-8',
  '/onboarding.js': 'text/javascript; charset=utf-8',
  '/qrcode.js': 'text/javascript; charset=utf-8',
  '/vivim-tokens.css': 'text/css; charset=utf-8',
  '/fonts/space-grotesk-latin-wght-normal.woff2': 'font/woff2',
  '/fonts/geist-latin-wght-normal.woff2': 'font/woff2',
  '/fonts/jetbrains-mono-latin-wght-normal.woff2': 'font/woff2',
  '/chat': 'text/html; charset=utf-8',
  '/wiki': 'text/html; charset=utf-8',
  '/chat.js': 'text/javascript; charset=utf-8',
  '/wiki.js': 'text/javascript; charset=utf-8',
  '/chat.css': 'text/css; charset=utf-8',
  '/wiki.css': 'text/css; charset=utf-8',
};
const ASSETS = {
  '/': 'mobile-first.html',
  '/host/control': 'index.html',
  '/mobile-first.css': 'mobile-first.css',
  '/mobile-first.js': 'mobile-first.js',
  '/onboarding': 'onboarding.html',
```

_First 80 of 1273 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
