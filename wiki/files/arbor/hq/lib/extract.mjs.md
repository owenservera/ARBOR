# File: hq/lib/extract.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/extract.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 52945 B |
| Lines | 1420 |
| Hash | faa876099ffa |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_LINES | const | 9 | no | const MAX_LINES = 30000; |
| MAX_SIGNATURE | const | 10 | no | const MAX_SIGNATURE = 240; |
| MAX_ANNOTATION_TEXT | const | 11 | no | const MAX_ANNOTATION_TEXT = 500; |
| KINDS | const | 13 | no | const KINDS = new Set([ &#39;function&#39;, &#39;class&#39;, &#39;method&#39;, &#39;const&#39;, &#39;type&#39;, &#39;interface&#39;, &#39;enum&#39;, &#39;route&#39;, &#39;export&#39;, &#39;variable&#39;, &#39;struct&#39;, &#39;trait&#39;, &#39;module&#39;, &#39;table&#39;, &#39;view&#39;, &#39;procedure&#39;, &#39;test&#39;, ]); |
| ANNOTATION_KINDS | const | 19 | no | const ANNOTATION_KINDS = [ |
| STATEMENT_WORDS | const | 26 | no | const STATEMENT_WORDS = new Set([ &#39;return&#39;, &#39;throw&#39;, &#39;new&#39;, &#39;else&#39;, &#39;if&#39;, &#39;for&#39;, &#39;while&#39;, &#39;switch&#39;, &#39;catch&#39;, &#39;do&#39;, &#39;case&#39;, &#39;default&#39;, &#39;break&#39;, &#39;continue&#39;, &#39;yield&#39;, &#39;await&#39;, &#39;using&#39;, &#39;delete&#39;, &#39;typeof… |
| CONTROL | const | 34 | no | const CONTROL = new Set([ &#39;if&#39;, &#39;for&#39;, &#39;while&#39;, &#39;switch&#39;, &#39;catch&#39;, &#39;return&#39;, &#39;function&#39;, &#39;class&#39;, &#39;const&#39;, &#39;let&#39;, &#39;var&#39;, &#39;import&#39;, &#39;from&#39;, &#39;use&#39;, &#39;else&#39;, &#39;do&#39;, &#39;try&#39;, &#39;new&#39;, &#39;throw&#39;, &#39;case&#39;, &#39;default… |
| normLang | function | 53 | no | function normLang(lang) { |
| l | const | 54 | no | const l = String(lang ?? &#39;&#39;).trim().toLowerCase(); |
| commentCfg | function | 67 | no | function commentCfg(lang) { |
| toLines | function | 95 | no | function toLines(text) { |
| raw | const | 96 | no | const raw = String(text ?? &#39;&#39;).split(/\\r?\\n/); |
| indentOf | function | 100 | no | function indentOf(line) { |
| ws | const | 101 | no | const ws = /^[ \\t]*/.exec(line)[0]; |
| n | variable | 102 | no | let n = 0; |
| okName | function | 107 | no | function okName(name) { |
| n | const | 109 | no | const n = String(name); |
| mk | function | 115 | no | function mk(name, kind, line, endLine, signature, exported) { |
| scanComments | function | 132 | no | function scanComments(lines, cfg) { |
| out | const | 133 | no | const out = []; |
| block | variable | 134 | no | let block = null; |
| line | const | 136 | no | const line = lines[li]; |
| i | variable | 137 | no | let i = 0; |
| idx | const | 140 | no | const idx = line.indexOf(block.end, i); |
| ch | const | 151 | no | const ch = line[i]; |
| started | variable | 156 | no | let started = null; |
| lineMarker | variable | 165 | no | let lineMarker = null; |
| skipString | function | 179 | no | function skipString(line, start) { |
| q | const | 180 | no | const q = line[start]; |
| cleanComment | function | 188 | no | function cleanComment(text) { |
| maskCode | function | 200 | no | function maskCode(lines, cfg, blankStrings) { |
| out | const | 201 | no | const out = new Array(lines.length); |
| block | variable | 202 | no | let block = null; |
| line | const | 204 | no | const line = lines[li]; |
| chars | const | 205 | no | const chars = line.split(&#39;&#39;); |
| i | variable | 206 | no | let i = 0; |
| idx | const | 208 | no | const idx = line.indexOf(block.end, 0); |
| stop | const | 213 | no | const stop = Math.min(chars.length, idx + block.end.length); |
| ch | const | 219 | no | const ch = line[i]; |
| closed | const | 223 | no | const closed = end &gt; i + 1 &amp;&amp; line[end - 1] === ch; |
| stop | const | 224 | no | const stop = closed ? end - 1 : end; |
| started | variable | 230 | no | let started = null; |
| idx | const | 235 | no | const idx = line.indexOf(started.end, i + started.start.length); |
| stop | const | 241 | no | const stop = idx + started.end.length; |
| isLineComment | variable | 247 | no | let isLineComment = false; |
| scriptOnly | function | 263 | no | function scriptOnly(codeLines, originalLines) { |
| active | const | 264 | no | const active = new Array(codeLines.length).fill(false); |
| inScript | variable | 265 | no | let inScript = false; |
| any | variable | 266 | no | let any = false; |
| t | const | 268 | no | const t = originalLines[i]; |
| braceDepths | function | 289 | no | function braceDepths(codeLines) { |
| depths | const | 290 | no | const depths = new Array(codeLines.length).fill(0); |
| depth | variable | 291 | no | let depth = 0; |
| s | const | 294 | no | const s = codeLines[i]; |
| braceRange | function | 306 | no | function braceRange(codeLines, startLine, depthBefore = null) { |
| stopRe | const | 307 | no | const stopRe = /^\\s*(?:export\|import\|class\|interface\|enum\|type\|function\|const\|let\|var\|def\|fn\|func\|fun\|impl\|struct\|trait\|mod\|using\|namespace\|record\|object\|protocol\|extension\|actor\|case\|data\|pub\|val\|at… |
| depth | variable | 308 | no | let depth = depthBefore ? (depthBefore[startLine] \|\| 0) : 0; |
| startDepth | variable | 309 | no | let startDepth = 0; |
| found | variable | 310 | no | let found = false; |
| openLine | const | 311 | no | const openLine = startLine; |
| s | const | 313 | no | const s = codeLines[i]; |
| trimmed | const | 315 | no | const trimmed = s.trim(); |
| makeSignature | function | 337 | no | function makeSignature(lines, idx, prefix = &#39;&#39;) { |
| text | variable | 338 | no | let text = String(lines[idx] ?? &#39;&#39;).trim(); |
| balance | variable | 339 | no | let balance = countChar(text, &#39;(&#39;) - countChar(text, &#39;)&#39;); |
| j | variable | 340 | no | let j = idx; |
| next | const | 343 | no | const next = String(lines[j] ?? &#39;&#39;).trim(); |
| s | variable | 347 | no | let s = text.replace(/\\s+/g, &#39; &#39;).trim(); |
| countChar | function | 352 | no | function countChar(s, ch) { |
| n | variable | 353 | no | let n = 0; |
| firstNonBlankLine | function | 358 | no | function firstNonBlankLine(lines, from) { |
| t | const | 360 | no | const t = lines[i].trim(); |
| jsSymbols | function | 370 | no | function jsSymbols(lines, code, codeKeep) { |
| out | const | 371 | no | const out = []; |
| n | const | 372 | no | const n = code.length; |
| depthBefore | const | 373 | no | const depthBefore = braceDepths(code); |
| classes | const | 374 | no | const classes = []; |
| t | const | 377 | no | const t = code[i]; |
| m | variable | 380 | no | let m = /^\\s*(export\\s+(?:default\\s+)?)?(?:declare\\s+)?(?:abstract\\s+)?class\\s+([A-Za-z_$][\\w$]*)/.exec(t); |
| isFn | const | 425 | no | const isFn = jsIsFunctionBinding(code, i); |
| kind | const | 426 | no | const kind = isFn ? &#39;function&#39; : (m[2] === &#39;const&#39; ? &#39;const&#39; : &#39;variable&#39;); |
| part | const | 441 | no | const part = raw.trim(); |
| asMatch | const | 443 | no | const asMatch = /\\bas\\s+([A-Za-z_$][\\w$]*)\\s*$/.exec(part); |
| name | const | 444 | no | const name = asMatch ? asMatch[1] : part.split(/\\s+/)[0]; |
| t | const | 459 | no | const t = code[j]; |
| m | const | 461 | no | const m = /^\\s*(?:(?:public\|private\|protected\|static\|async\|abstract\|readonly\|override\|declare)\\s+)*([A-Za-z_$][\\w$]*)\\s*(?:&lt;[^&gt;]*&gt;)?\\s*\\(/.exec(t); if (!m \|\| !okName(m[1]) \|\| CONTROL.has(m[1].toLower… |
| routeRe | const | 469 | no | const routeRe = /^\\s*(?:app\|router\|server\|fastify)\\s*\\.\\s*(get\|post\|put\|patch\|delete\|all)\\s*\\(\\s*([&#39;&quot;`])([^&#39;&quot;`]+)\\2/; for (let i = 0; i &lt; n; i++) { const m = routeRe.exec(codeKeep[i] \|\| &#39;&#39;); if (m) {… |
| m | const | 471 | no | const m = routeRe.exec(codeKeep[i] \|\| &#39;&#39;); |
| method | const | 473 | no | const method = m[1].toLowerCase(); |
| routePath | const | 474 | no | const routePath = m[3]; |
| jsIsFunctionBinding | function | 482 | no | function jsIsFunctionBinding(code, idx) { |
| span | const | 483 | no | const span = code.slice(idx, idx + 4).join(&#39; &#39;); |
| eq | const | 484 | no | const eq = span.indexOf(&#39;=&#39;); |
| rhs | const | 486 | no | const rhs = span.slice(eq + 1).trim(); |
| pythonSymbols | function | 497 | no | function pythonSymbols(lines, code) { |
| out | const | 498 | no | const out = []; |
| stack | const | 499 | no | const stack = []; |
| t | const | 501 | no | const t = code[i]; |
| indent | const | 503 | no | const indent = indentOf(t); |
| parent | const | 505 | no | const parent = stack[stack.length - 1]; |
| m | variable | 507 | no | let m = /^(\\s*)(async\\s+)?def\\s+([A-Za-z_]\\w*)\\s*\\(/.exec(t); if (m &amp;&amp; okName(m[3])) { const kind = parent &amp;&amp; parent.kind === &#39;class&#39; ? &#39;method&#39; : &#39;function&#39;; const end = pythonEnd(lines, i, indent);… |
| kind | const | 509 | no | const kind = parent &amp;&amp; parent.kind === &#39;class&#39; ? &#39;method&#39; : &#39;function&#39;; |
| deco | const | 511 | no | const deco = pythonDecorator(lines, i, indent); |
| deco | const | 520 | no | const deco = pythonDecorator(lines, i, indent); |
| pythonDecorator | function | 536 | no | function pythonDecorator(lines, idx, indent) { |
| prev | variable | 537 | no | let prev = idx - 1; |
| t | const | 540 | no | const t = lines[prev].trim(); |
| pythonEnd | function | 545 | no | function pythonEnd(lines, idx, indent) { |
| last | variable | 546 | no | let last = idx; |
| t | const | 548 | no | const t = lines[j]; |
| goSymbols | function | 560 | no | function goSymbols(lines, code) { |
| out | const | 561 | no | const out = []; |
| depthBefore | const | 562 | no | const depthBefore = braceDepths(code); |
| t | const | 564 | no | const t = code[i]; |
| m | variable | 567 | no | let m = /^\\s*func\\s+(?:\\(([^)]*)\\)\\s*)?([A-Za-z_]\\w*)\\s*[\\(\\[]/.exec(t); |
| receiver | const | 569 | no | const receiver = m[1] ? m[1].trim() : &#39;&#39;; |
| kind | const | 570 | no | const kind = receiver ? &#39;method&#39; : &#39;function&#39;; |
| rustSymbols | function | 601 | no | function rustSymbols(lines, code) { |
| out | const | 602 | no | const out = []; |
| depthBefore | const | 603 | no | const depthBefore = braceDepths(code); |
| impls | const | 604 | no | const impls = []; |
| inImpl | function | 611 | no | const inImpl = (i) =&gt; impls.some((r) =&gt; i &gt; r.openLine &amp;&amp; i &lt; r.closeLine); |
| t | const | 614 | no | const t = code[i]; |
| m | variable | 617 | no | let m = /^\\s*(pub(?:\\([^)]*\\))?\\s+)?(?:(?:async\|const\|unsafe\|extern(?:\\s+&quot;[^&quot;]*&quot;)?\|default)\\s+)*fn\\s+([A-Za-z_]\\w*)/.exec(t); |
| matchType | function | 670 | no | function matchType(lang, t) { |
| re | variable | 671 | no | let re; |
| m | const | 694 | no | const m = re.exec(t); |
| keyword | variable | 696 | no | let keyword = m[2].toLowerCase(); |
| kindMap | const | 698 | no | const kindMap = { |
| modernLangSymbols | function | 706 | no | function modernLangSymbols(lines, code, lang) { |
| out | const | 707 | no | const out = []; |
| depthBefore | const | 708 | no | const depthBefore = braceDepths(code); |
| types | const | 709 | no | const types = []; |
| t | const | 712 | no | const t = code[i]; |
| tm | const | 714 | no | const tm = matchType(lang, t); |
| t | const | 725 | no | const t = code[j]; |
| name | variable | 727 | no | let name = null; |
| m | const | 730 | no | const m = /^\\s*(?:(?:public\|private\|protected\|internal\|override\|open\|final\|abstract\|suspend\|inline\|operator\|tailrec\|external\|expect\|actual\|infix\|const)\\s+)*fun\\s+(?:&lt;[^&gt;]*&gt;\\s*)?(?:[A-Za-z_][\\w.&lt;&gt;?, ]… |
| m | const | 733 | no | const m = /^\\s*(?:(?:override\|final\|private\|protected\|implicit\|inline\|transparent)\\s+)*def\\s+([A-Za-z_]\\w*)/.exec(t); |
| m | const | 736 | no | const m = /^\\s*(?:(?:public\|private\|internal\|fileprivate\|open\|static\|final\|override\|mutating\|nonmutating\|convenience\|required\|@\\w+)\\s+)*func\\s+([A-Za-z_]\\w*)/.exec(t); |
| m | const | 739 | no | const m = /^\\s*(?:(?:public\|private\|protected\|static\|final\|abstract)\\s+)*function\\s+&amp;?\\s*([A-Za-z_]\\w*)\\s*\\(/.exec(t); if (m) name = m[1]; } else { const m = /^\\s*((?:(?:public\|private\|protected\|inte… |
| m | const | 742 | no | const m = /^\\s*((?:(?:public\|private\|protected\|internal\|static\|final\|abstract\|override\|virtual\|sealed\|async\|synchronized\|native\|default\|extern\|unsafe\|new\|readonly\|partial\|strictfp\|volatile\|transient)… |
| first | const | 744 | no | const first = m[2].trim().split(/\\s+/)[0]; |
| beforeParen | const | 746 | no | const beforeParen = t.slice(0, t.indexOf(&#39;(&#39;)); if (!beforeParen.includes(&#39;=&#39;)) name = m[3]; } } if (!name) { |
| ctor | const | 751 | no | const ctor = /^\\s*(?:(?:public\|private\|protected\|internal)\\s+)+([A-Z][A-Za-z_]\\w*)\\s*\\(/.exec(t); if (ctor &amp;&amp; ctor[1] === type.name) name = ctor[1]; } } |
| m | const | 764 | no | const m = /^\\s*(?:(?:public\|private\|protected)\\s+)?const\\s+([A-Za-z_]\\w*)/.exec(code[i]); |
| t | const | 772 | no | const t = code[i]; |
| m | variable | 774 | no | let m = null; |
| modernExported | function | 787 | no | function modernExported(t, lang) { |
| cSymbols | function | 800 | no | function cSymbols(lines, code, lang) { |
| out | const | 801 | no | const out = []; |
| depthBefore | const | 802 | no | const depthBefore = braceDepths(code); |
| types | const | 803 | no | const types = []; |
| t | const | 806 | no | const t = code[i]; |
| m | const | 808 | no | const m = /^\\s*(?:template\\s*&lt;[^&gt;]*&gt;\\s*)?(class\|struct\|enum(?:\\s+class)?\|namespace\|union)\\s+([A-Za-z_]\\w*)/.exec(t); |
| keyword | const | 810 | no | const keyword = m[1].toLowerCase(); |
| kind | const | 811 | no | const kind = keyword.startsWith(&#39;enum&#39;) ? &#39;enum&#39; |
| t | const | 821 | no | const t = code[i]; |
| trimmed | const | 823 | no | const trimmed = t.trim(); |
| insideType | const | 827 | no | const insideType = types.some((r) =&gt; i &gt; r.open &amp;&amp; i &lt; r.close &amp;&amp; depthBefore[i] === r.bodyDepth); |
| allowed | const | 828 | no | const allowed = depthBefore[i] === 0 \|\| insideType; |
| stmt | variable | 832 | no | let stmt = t; |
| k | variable | 833 | no | let k = i; |
| openParen | const | 838 | no | const openParen = stmt.indexOf(&#39;(&#39;); const closeParen = stmt.lastIndexOf(&#39;)&#39;); |
| closeParen | const | 839 | no | const closeParen = stmt.lastIndexOf(&#39;)&#39;); |
| before | const | 841 | no | const before = stmt.slice(0, openParen).trim(); |
| nameMatch | const | 842 | no | const nameMatch = /([A-Za-z_~][\\w]*)$/.exec(before); |
| name | const | 844 | no | const name = nameMatch[1]; |
| beforeName | const | 846 | no | const beforeName = before.slice(0, before.length - name.length).trim(); |
| firstWord | const | 848 | no | const firstWord = beforeName.split(/\\s+/)[0]; |
| afterParen | const | 851 | no | const afterParen = stmt.slice(closeParen + 1); |
| hasBrace | variable | 852 | no | let hasBrace = afterParen.includes(&#39;{&#39;); |
| next | const | 854 | no | const next = firstNonBlankLine(code, k + 1); |
| rubySymbols | function | 871 | no | function rubySymbols(lines, code) { |
| out | const | 872 | no | const out = []; |
| stack | const | 873 | no | const stack = []; |
| t | const | 875 | no | const t = code[i]; |
| indent | const | 877 | no | const indent = indentOf(t); |
| m | variable | 880 | no | let m = /^(\\s*)def\\s+(?:self\\.)?([A-Za-z_]\\w*[?!=]?)/.exec(t); |
| parent | const | 882 | no | const parent = stack[stack.length - 1]; |
| kind | const | 883 | no | const kind = parent ? &#39;method&#39; : &#39;function&#39;; |
| name | const | 906 | no | const name = raw.trim().replace(/^:/, &#39;&#39;).replace(/[^\\w?!]/g, &#39;&#39;); |
| rubyEnd | function | 914 | no | function rubyEnd(lines, idx) { |
| depth | variable | 915 | no | let depth = 0; |
| t | const | 917 | no | const t = lines[j].trim(); |
| luaSymbols | function | 934 | no | function luaSymbols(lines, code) { |
| out | const | 935 | no | const out = []; |
| t | const | 937 | no | const t = code[i]; |
| m | variable | 939 | no | let m = /^\\s*(local\\s+)?function\\s+([A-Za-z_][\\w.:]*)/.exec(t); |
| luaEnd | function | 952 | no | function luaEnd(lines, idx) { |
| depth | variable | 953 | no | let depth = 1; |
| t | const | 955 | no | const t = lines[j].trim(); |
| sqlSymbols | function | 966 | no | function sqlSymbols(lines) { |
| out | const | 967 | no | const out = []; |
| re | const | 968 | no | const re = /^\\s*CREATE\\s+(?:OR\\s+REPLACE\\s+)?(TABLE\|VIEW\|INDEX\|FUNCTION\|PROCEDURE)\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([`&quot;\\[\\]\\w.$]+)/i; |
| m | const | 970 | no | const m = re.exec(lines[i]); |
| keyword | const | 972 | no | const keyword = m[1].toUpperCase(); |
| name | const | 973 | no | const name = m[2].replace(/^[`&quot;[]+\|[`&quot;\\]]+$/g, &#39;&#39;); |
| kind | const | 975 | no | const kind = keyword === &#39;VIEW&#39; ? &#39;view&#39; |
| shellSymbols | function | 987 | no | function shellSymbols(lines, code, lang) { |
| out | const | 988 | no | const out = []; |
| t | const | 990 | no | const t = code[i]; |
| name | variable | 992 | no | let name = null; |
| m | const | 994 | no | const m = /^\\s*(?:function\|filter)\\s+(?:global:\|script:\|local:\|private:)?([A-Za-z_][\\w-]*)/i.exec(t); |
| m | variable | 997 | no | let m = /^\\s*function\\s+([A-Za-z_][\\w.:-]*)/.exec(t); |
| finalizeSymbols | function | 1012 | no | function finalizeSymbols(list, lines) { |
| seen | const | 1013 | no | const seen = new Set(); |
| out | const | 1014 | no | const out = []; |
| total | const | 1015 | no | const total = lines.length; |
| line | const | 1019 | no | const line = Math.max(1, Math.min(total, Number(s.line) \|\| 1)); |
| key | const | 1022 | no | const key = `${s.name}\\u0000${line}`; |
| rawSig | const | 1025 | no | const rawSig = String(s.signature \|\| lines[line - 1] \|\| s.name); |
| signature | const | 1026 | no | const signature = rawSig.replace(/\\s+/g, &#39; &#39;).trim().slice(0, MAX_SIGNATURE); |
| finalizeImports | function | 1040 | no | function finalizeImports(list) { |
| seen | const | 1041 | no | const seen = new Set(); |
| out | const | 1042 | no | const out = []; |
| key | const | 1045 | no | const key = `${item.specifier}\\u0000${item.kind}\\u0000${item.line}`; |
| finalizeAnnotations | function | 1054 | no | function finalizeAnnotations(list) { |
| seen | const | 1055 | no | const seen = new Set(); |
| out | const | 1056 | no | const out = []; |
| key | const | 1059 | no | const key = `${a.line}\\u0000${a.kind}\\u0000${a.text}`; |
| extractSymbols | function | 1079 | yes | export function extractSymbols(lang, text) { |
| L | const | 1080 | no | const L = normLang(lang); |
| lines | const | 1081 | no | const lines = toLines(text); |
| cfg | const | 1083 | no | const cfg = commentCfg(L); |
| code | variable | 1084 | no | let code = maskCode(lines, cfg, true); |
| codeKeep | variable | 1085 | no | let codeKeep = maskCode(lines, cfg, false); |
| raw | variable | 1091 | no | let raw = []; |
| extractImports | function | 1144 | yes | export function extractImports(lang, text) { |
| L | const | 1145 | no | const L = normLang(lang); |
| lines | const | 1146 | no | const lines = toLines(text); |
| cfg | const | 1148 | no | const cfg = commentCfg(L); |
| code | const | 1149 | no | const code = maskCode(lines, cfg, false); |
| out | const | 1150 | no | const out = []; |
| t | const | 1154 | no | const t = code[i]; |
| stmt | variable | 1158 | no | let stmt = t; |
| j | variable | 1159 | no | let j = i; |
| m | const | 1164 | no | const m = /^\\s*import\\s+(?:type\\s+)?(?:[\\s\\S]*?\\sfrom\\s+)?([&#39;&quot;])([^&#39;&quot;]+)\\1/.exec(stmt); |
| stmt | variable | 1169 | no | let stmt = t; |
| j | variable | 1170 | no | let j = i; |
| m | const | 1175 | no | const m = /^\\s*export\\s+[\\s\\S]*?\\sfrom\\s*([&#39;&quot;])([^&#39;&quot;]+)\\1/.exec(stmt); |
| dyn | const | 1179 | no | const dyn = /\\bimport\\s*\\(\\s*([&#39;&quot;])([^&#39;&quot;]+)\\1\\s*\\)/g; |
| dm | variable | 1180 | no | let dm; |
| req | const | 1184 | no | const req = /\\brequire\\s*\\(\\s*([&#39;&quot;])([^&#39;&quot;]+)\\1\\s*\\)/g; |
| rm | variable | 1185 | no | let rm; |
| t | const | 1195 | no | const t = code[i]; |
| m | variable | 1197 | no | let m = /^\\s*from\\s+([.\\w]+)\\s+import\\s+/.exec(t); |
| mod | const | 1205 | no | const mod = raw.trim().replace(/\\s+as\\s+\\w+$/, &#39;&#39;).trim(); |
| inBlock | variable | 1214 | no | let inBlock = false; |
| t | const | 1216 | no | const t = code[i]; |
| single | const | 1219 | no | const single = /^\\s*import\\s+(?:[A-Za-z_.]\\w*\\s+)?([&quot;`])([^&quot;`]+)\\1/.exec(t); |
| m | const | 1228 | no | const m = /^\\s*(?:[A-Za-z_.]\\w*\\s+)?([&quot;`])([^&quot;`]+)\\1/.exec(t); |
| t | const | 1236 | no | const t = code[i]; |
| m | variable | 1238 | no | let m = /^\\s*(?:pub\\s+)?use\\s+([^;]+);?/.exec(t); |
| m | const | 1251 | no | const m = /^\\s*#\\s*include\\s*[&lt;&quot;]([^&gt;&quot;]+)[&gt;&quot;]/.exec(code[i]); |
| m | const | 1259 | no | const m = /^\\s*(?:global\\s+)?using\\s+(?:static\\s+)?([A-Za-z_][\\w.]*)\\s*;/.exec(code[i]); |
| m | const | 1267 | no | const m = /^\\s*import\\s+(?:static\\s+)?([A-Za-z_][\\w.*]*)\\s*;?/.exec(code[i]); |
| m | variable | 1275 | no | let m = /^\\s*require_relative\\s+([&#39;&quot;])([^&#39;&quot;]+)\\1/.exec(code[i]); |
| m | const | 1284 | no | const m = /^\\s*(?:require_once\|require\|include_once\|include)\\s*\\(?\\s*([&#39;&quot;])([^&#39;&quot;]+)\\1/.exec(code[i]); if (m) out.push({ specifier: m[2], kind: &#39;include&#39;, line: i + 1 }); } return finalizeImports(out)… |
| extractAnnotations | function | 1298 | yes | export function extractAnnotations(lang, text) { |
| L | const | 1299 | no | const L = normLang(lang); |
| lines | const | 1300 | no | const lines = toLines(text); |
| cfg | const | 1302 | no | const cfg = commentCfg(L); |
| comments | const | 1303 | no | const comments = scanComments(lines, cfg); |
| out | const | 1304 | no | const out = []; |
| tagRe | const | 1305 | no | const tagRe = new RegExp(`@hq:(${ANNOTATION_KINDS.join(&#39;\|&#39;)})\\\\b`, &#39;gi&#39;); |
| raw | const | 1308 | no | const raw = comment.text; |
| hits | const | 1310 | no | const hits = [...raw.matchAll(tagRe)]; |
| hit | const | 1312 | no | const hit = hits[k]; |
| kind | const | 1313 | no | const kind = hit[1].toLowerCase(); |
| start | const | 1314 | no | const start = hit.index + hit[0].length; |
| rest | variable | 1316 | no | let rest = raw.slice(start, end); |
| owner | variable | 1318 | no | let owner = null; |
| paren | const | 1319 | no | const paren = /^\\s*\\(([^)]*)\\)/.exec(rest); |
| body | variable | 1324 | no | let body = rest.replace(/^\\s*:\\s*/, &#39;&#39;).trim(); |
| ref | variable | 1328 | no | let ref = null; |
| rm | const | 1330 | no | const rm = /([A-Za-z0-9_.\\/\\\\@-]+):(\\d+)(?:-(\\d+))?/.exec(body); |
| token | const | 1333 | no | const token = body.split(/\\s+/)[0]; |
| first | const | 1339 | no | const first = body.split(/\\s+/)[0].replace(/[,;:]+$/, &#39;&#39;); |
| ROUTE_METHOD_RE | const | 1355 | no | const ROUTE_METHOD_RE = /^\\s*([A-Za-z_$][\\w$]*)\\s*\\.\\s*(get\|post\|put\|patch\|delete\|all\|options\|head)\\s*\\(\\s*([&#39;&quot;`])([^&#39;&quot;`]+)\\3/; // Framework mount: &lt;receiver&gt;.use([&lt;prefix&gt;,] &lt;target&gt;) const MOUNT_RE… |
| MOUNT_RE | const | 1357 | no | const MOUNT_RE = /^\\s*([A-Za-z_$][\\w$]*)\\s*\\.\\s*use\\s*\\(\\s*(?:([&#39;&quot;`])([^&#39;&quot;`]*)\\2\\s*,\\s*)?([A-Za-z_$][\\w$]*)\\s*\\)/; |
| DECL_RE | const | 1359 | no | const DECL_RE = /^\\s*(?:export\\s+)?(?:const\|let\|var)\\s+([A-Za-z_$][\\w$]*)\\s*=/; |
| ROUTER_FACTORY_RE | const | 1361 | no | const ROUTER_FACTORY_RE = /\\bRouter\\s*\\(/; /** * extractRouteSurface — implemented routes plus the wiring that mounts them. * |
| extractRouteSurface | function | 1381 | yes | export function extractRouteSurface(lang, text) { |
| L | const | 1382 | no | const L = normLang(lang); |
| empty | const | 1383 | no | const empty = { routes: [], mounts: [], unmounted: [] }; |
| lines | const | 1385 | no | const lines = toLines(text); |
| cfg | const | 1387 | no | const cfg = commentCfg(L); |
| code | const | 1389 | no | const code = maskCode(lines, cfg, false); |
| routers | const | 1391 | no | const routers = new Set(); |
| mounts | const | 1392 | no | const mounts = []; |
| routes | const | 1393 | no | const routes = []; |
| t | const | 1396 | no | const t = code[i]; |
| decl | const | 1399 | no | const decl = DECL_RE.exec(t); |
| mount | const | 1402 | no | const mount = MOUNT_RE.exec(t); |
| route | const | 1407 | no | const route = ROUTE_METHOD_RE.exec(t); |
| mountedTargets | const | 1413 | no | const mountedTargets = new Set(mounts.map((m) =&gt; m.target)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-024-implemented-unmounted.mjs](../aii/fixtures/HQ-024-implemented-unmounted.mjs.md) | ../../lib/extract.mjs |
| [hq/aii/fixtures/HQ-033-platform-conditional-features.mjs](../aii/fixtures/HQ-033-platform-conditional-features.mjs.md) | ../../lib/extract.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./extract.mjs |
| [hq/test/extract.test.mjs](../test/extract.test.mjs.md) | ../lib/extract.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/extract.mjs — symbol, import and annotation extraction.
// CONTRACT (hq/CONTRACT.md): deterministic, dependency-free, 1-based lines.
//
// Design: every extractor is a pure function over `{lang, text}`. Comments and
// string literals are masked before symbol scanning so declarations inside
// comments/strings are never emitted. Annotations are scanned from a comment
// walk that is string-aware. Nothing here touches the filesystem or the clock.

const MAX_LINES = 30000;
const MAX_SIGNATURE = 240;
const MAX_ANNOTATION_TEXT = 500;

const KINDS = new Set([
  'function', 'class', 'method', 'const', 'type', 'interface', 'enum', 'route',
  'export', 'variable', 'struct', 'trait', 'module', 'table', 'view',
  'procedure', 'test',
]);

const ANNOTATION_KINDS = [
  'context', 'why', 'invariant', 'see', 'todo', 'owner', 'task', 'risk', 'deprecated',
];

// Statement-introducing words: never a return type at the start of a method
// declaration. (`void`, `static`, `public` are legal type/modifier words and
// deliberately absent.)
const STATEMENT_WORDS = new Set([
  'return', 'throw', 'new', 'else', 'if', 'for', 'while', 'switch', 'catch',
  'do', 'case', 'default', 'break', 'continue', 'yield', 'await', 'using',
  'delete', 'typeof', 'goto', 'sizeof', 'co_await', 'co_return', 'co_yield',
  'assert', 'raise', 'pass', 'include', 'require',
]);

// Structural/control words that must never surface as symbol names.
const CONTROL = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class',
  'const', 'let', 'var', 'import', 'from', 'use',
  'else', 'do', 'try', 'new', 'throw', 'case', 'default', 'break', 'continue',
  'typeof', 'instanceof', 'void', 'delete', 'yield', 'await', 'export',
  'extends', 'implements', 'package', 'def', 'end', 'then', 'begin', 'unless',
  'elif', 'except', 'finally', 'with', 'as', 'is', 'in', 'of', 'not', 'and',
  'or', 'assert', 'lambda', 'pass', 'raise', 'go', 'defer', 'select', 'range',
  'chan', 'struct', 'enum', 'interface', 'type', 'module', 'namespace', 'trait',
  'impl', 'fn', 'pub', 'static', 'public', 'private', 'protected', 'internal',
  'final', 'abstract', 'async', 'super', 'this', 'true', 'false', 'null',
  'undefined', 'override', 'virtual', 'sealed', 'readonly', 'where', 'match',
  'loop', 'until', 'foreach', 'using', 'record', 'init', 'func',
]);

// ---------------------------------------------------------------------------
// language helpers
// ---------------------------------------------------------------------------

function normLang(lang) {
  const l = String(lang ?? '').trim().toLowerCase();
  switch (l) {
    case 'js': case 'jsx': case 'node': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'cs': case 'c#': return 'csharp';
    case 'c++': case 'cc': case 'cxx': case 'h': case 'hpp': case 'hh': return 'cpp';
    case 'bash': case 'sh': case 'zsh': case 'shellscript': return 'shell';
    case 'ps1': case 'pwsh': case 'pwsh1': return 'powershell';
    case 'py': return 'python';
    default: return l;
  }
}

function commentCfg(lang) {
  switch (lang) {
    case 'python':
      return { line: ['#'], block: [] };
    case 'ruby':
      return { line: ['#'], block: [] };
    case 'shell':
      return { line: ['#'], block: [] };
    case 'powershell':
      return { line: ['#'], block: [{ start: '<#', end: '#>' }] };
    case 'lua':
      return { line: ['--'], block: [{ start: '--[[', end: ']]' }] };
    case 'sql':
      return { line: ['--'], block: [{ start: '/*', end: '*/' }] };
```

_First 80 of 1421 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
