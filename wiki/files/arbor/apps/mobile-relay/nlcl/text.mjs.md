# File: apps/mobile-relay/nlcl/text.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/text.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3669 B |
| Lines | 92 |
| Hash | 17fb25f85d7b |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fold | function | 6 | yes | export function fold(s ) { |
| lowered | const | 7 | no | const lowered = s.toLowerCase().normalize(&quot;NFD&quot;); |
| out | variable | 8 | no | let out = &quot;&quot;; |
| code | const | 10 | no | const code = ch.codePointAt(0) ; |
| unquote | function | 19 | yes | export function unquote(s ) { |
| t | const | 20 | no | const t = s.trim(); |
| pairs | const | 21 | no | const pairs = [[&quot;&#39;&quot;, &quot;&#39;&quot;], [&#39;&quot;&#39;, &#39;&quot;&#39;], [&quot;“&quot;, &quot;”&quot;], [&quot;‘&quot;, &quot;’&quot;], [&quot;«&quot;, &quot;»&quot;]]; |
| lev | function | 29 | yes | export function lev(a , b , cap = 2) { |
| n | const | 31 | no | const n = a.length, m = b.length; |
| prev | variable | 34 | no | let prev = new Array (m + 1); |
| cur | variable | 35 | no | let cur = new Array (m + 1); |
| best | variable | 39 | no | let best = cur[0]; |
| cost | const | 41 | no | const cost = a[i - 1] === b[j - 1] ? 0 : 1; |
| swap | const | 46 | no | const swap = prev; prev = cur; cur = swap; |
| classifyVerb | function | 54 | yes | export function classifyVerb(norm , builtinVerbs , taughtVerbs ) { |
| words | function | 70 | yes | export function words(s ) { |
| slug | function | 75 | yes | export function slug(s ) { |
| f | const | 76 | no | const f = fold(s); |
| out | variable | 77 | no | let out = &quot;&quot;; |
| prettifyLocalPart | function | 86 | yes | export function prettifyLocalPart(local ) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/ground.mjs](./ground.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/lexer.mjs](./lexer.mjs.md) | ./text.mjs |
| [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) | ./text.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/text.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/text.ts — deterministic text utilities. No regex backtracking traps,
// no locale dependence, no clocks, no randomness (N1).

/** Lowercase + strip diacritics + collapse inner whitespace. Peter/Péter/pETER → "peter". */
export function fold(s        )         {
  const lowered = s.toLowerCase().normalize("NFD");
  let out = "";
  for (const ch of lowered) {
    const code = ch.codePointAt(0) ;
    if (code >= 0x0300 && code <= 0x036f) continue; // combining diacritical marks
    if (ch === "\t" || ch === "\n") out += " ";
    else out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Strip leading/trailing quote marks and smart quotes. */
export function unquote(s        )         {
  const t = s.trim();
  const pairs                          = [["'", "'"], ['"', '"'], ["“", "”"], ["‘", "’"], ["«", "»"]];
  for (const [a, b] of pairs) {
    if (t.length >= 2 && t.startsWith(a) && t.endsWith(b)) return t.slice(a.length, t.length - b.length);
  }
  return t;
}

/** Bounded Levenshtein (returns > cap fast when clearly farther). */
export function lev(a        , b        , cap = 2)         {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const n = a.length, m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  let prev = new Array        (m + 1);
  let cur = new Array        (m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    let best = cur[0];
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    if (best > cap) return cap + 1;
    const swap = prev; prev = cur; cur = swap;
  }
  return prev[m];
}

/** True edit-distance match class for verb lookup (deterministic thresholds). */
                                                          

export function classifyVerb(norm        , builtinVerbs          , taughtVerbs          )                                               {
  if (builtinVerbs.includes(norm)) return { cls: "exact", verb: norm };
  if (taughtVerbs.includes(norm)) return { cls: "taught", verb: norm };
  // fuzzy only for words of length ≥ 5, distance ≤ 1 (a conservative, quiet autocorrect)
  if (norm.length >= 5) {
    for (const v of builtinVerbs) {
      if (Math.abs(v.length - norm.length) <= 1 && lev(norm, v, 1) <= 1) return { cls: "fuzzy", verb: v };
    }
    for (const v of taughtVerbs) {
      if (Math.abs(v.length - norm.length) <= 1 && lev(norm, v, 1) <= 1) return { cls: "fuzzy", verb: v };
    }
  }
  return null;
}

/** Split a folded phrase into words (for alias token matching). */
export function words(s        )           {
  return fold(s).split(/[\s,;]+/).filter(Boolean);
}

/** Deterministic slug: lowercase, diacritics stripped, non-alphanumerics → "-". */
export function slug(s        )         {
  const f = fold(s);
  let out = "";
  for (const ch of f) {
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (out.length > 0 && !out.endsWith("-")) out += "-";
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
