# File: apps/mobile-relay/nlcl/lexer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/lexer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5912 B |
| Lines | 147 |
| Hash | 71296a4f09e3 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GLYPH_SET | const | 10 | no | const GLYPH_SET = new Set(FAMILY_GLYPHS); |
| ATTACH_GLYPHS | const | 11 | no | const ATTACH_GLYPHS = new Set([&quot;@&quot;, &quot;/&quot;, &quot;#&quot;, &quot;$&quot;]); // @peter /send #tag $var — prefix+word = one token |
| PUNCT | const | 12 | no | const PUNCT = new Set([&quot;,&quot;, &quot;;&quot;, &quot;:&quot;, &quot;(&quot;, &quot;)&quot;, &quot;[&quot;, &quot;]&quot;, &quot;{&quot;, &quot;}&quot;, &quot;…&quot;, &quot;\|&quot;]); |
| QUOTE_OPENS | const | 13 | no | const QUOTE_OPENS = new Set([&quot;&#39;&quot;, &#39;&quot;&#39;, &quot;“&quot;, &quot;‘&quot;, &quot;«&quot;]); |
| QUOTE_CLOSES | const | 14 | no | const QUOTE_CLOSES = { &quot;&#39;&quot;: &quot;&#39;&quot;, &#39;&quot;&#39;: &#39;&quot;&#39;, &quot;“&quot;: &quot;”&quot;, &quot;‘&quot;: &quot;’&quot;, &quot;«&quot;: &quot;»&quot; }; |
| WORD_CHARS | const | 15 | no | const WORD_CHARS = /[A-Za-z0-9À-ÿāăąćčďēĕėęěğġĥĩīĭįłńōŏőŕŗśŝşţũūŭůűźżž古希腊日本한국А-Яа-я0-9_.\\-&#39;]/; |
| scanWord | function | 18 | no | function scanWord(text , i ) { |
| j | variable | 19 | no | let j = i; |
| isWordStart | function | 24 | no | function isWordStart(text , i ) { |
| scanNumber | function | 28 | no | function scanNumber(text , i ) { |
| j | variable | 29 | no | let j = i; |
| isQuoteOpenerHere | function | 34 | no | function isQuoteOpenerHere(text , i ) { |
| c | const | 35 | no | const c = text[i]; |
| prev | const | 39 | no | const prev = i === 0 ? &quot; &quot; : text[i - 1]; |
| close | const | 41 | no | const close = QUOTE_CLOSES[c]; |
| next | const | 44 | no | const next = j + 1 &gt;= text.length ? &quot; &quot; : text[j + 1]; |
| lex | function | 55 | yes | export function lex(input ) { |
| tokens | const | 56 | no | const tokens = []; |
| syntaxNotes | const | 57 | no | const syntaxNotes = []; |
| text | const | 58 | no | const text = input; |
| i | variable | 59 | no | let i = 0; |
| idx | variable | 60 | no | let idx = 0; |
| push | function | 62 | no | const push = (t ) =&gt; { |
| c | const | 68 | no | const c = text[i]; |
| close | const | 84 | no | const close = QUOTE_CLOSES[c]; |
| j | variable | 85 | no | let j = i + 1; |
| inner | const | 87 | no | const inner = text.slice(i + 1, j); |
| family | const | 94 | no | const family = normalizeFamilyGlyph(c); |
| raw | const | 97 | no | const raw = text.slice(i, end); |
| word | const | 98 | no | const word = text.slice(i + 1, end); |
| kind | const | 99 | no | const kind = c === &quot;@&quot; ? &quot;ref&quot; : c === &quot;/&quot; ? &quot;cmd&quot; : c === &quot;#&quot; ? &quot;tag&quot; : &quot;var&quot;; |
| e | variable | 119 | no | let e = end; |
| raw | const | 121 | no | const raw = text.slice(i, e); |
| rawQuoteCount | function | 142 | no | const rawQuoteCount = (input.match(/[&#39;&quot;]/g) ?? []).length; |
| lexedQuoteCount | const | 143 | no | const lexedQuoteCount = tokens.filter((t) =&gt; t.kind === &quot;quote&quot;).length * 2; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./text.mjs | import | 7 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./symbols.mjs | import | 8 | [apps/mobile-relay/nlcl/symbols.mjs](./symbols.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./lexer.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./lexer.mjs |
| [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) | ./lexer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/lexer.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/lexer.ts — the deterministic scanner. Hand-rolled on purpose: no regex
// backtracking pathologies, full control over spans, keystroke-cheap. Zero allocations
// beyond the token array.

                                        
import { fold } from "./text.mjs";
import { FAMILY_GLYPHS, normalizeFamilyGlyph } from "./symbols.mjs";

const GLYPH_SET = new Set(FAMILY_GLYPHS);
const ATTACH_GLYPHS = new Set(["@", "/", "#", "$"]); // @peter /send #tag $var — prefix+word = one token
const PUNCT = new Set([",", ";", ":", "(", ")", "[", "]", "{", "}", "…", "|"]);
const QUOTE_OPENS = new Set(["'", '"', "“", "‘", "«"]);
const QUOTE_CLOSES                         = { "'": "'", '"': '"', "“": "”", "‘": "’", "«": "»" };
const WORD_CHARS = /[A-Za-z0-9À-ÿāăąćčďēĕėęěğġĥĩīĭįłńōŏőŕŗśŝşţũūŭůűźżž古希腊日本한국А-Яа-я0-9_.\-']/;

/** Word chars except trailing separators (strip trailing . _ - ' into punct tokens). */
function scanWord(text        , i        )                  {
  let j = i;
  while (j < text.length && WORD_CHARS.test(text[j])) j++;
  return { end: j };
}

function isWordStart(text        , i        )          {
  return WORD_CHARS.test(text[i]) && !/[0-9]/.test(text[i]);
}

function scanNumber(text        , i        )                  {
  let j = i;
  while (j < text.length && /[0-9]/.test(text[j])) j++;
  return { end: j };
}

function isQuoteOpenerHere(text        , i        )          {
  const c = text[i];
  if (!QUOTE_OPENS.has(c)) return false;
  if (c === "'" || c === '"') {
    // straight quotes only count when delimiting: opener at boundary, closer at boundary
    const prev = i === 0 ? " " : text[i - 1];
    if (/\w/.test(prev)) return false; // apostrophe inside a word (don't)
    const close = QUOTE_CLOSES[c];
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === close) {
        const next = j + 1 >= text.length ? " " : text[j + 1];
        if (/\w/.test(next)) return false;
        return true;
      }
      if (text[j] === " " && j === i + 1) continue; // allow leading space inside quotes
    }
    return false;
  }
  return true; // smart pairs are unambiguous openers
}

export function lex(input        )                                             {
  const tokens          = [];
  const syntaxNotes           = [];
  const text = input;
  let i = 0;
  let idx = 0;

  const push = (t                  )         => {
    tokens.push({ ...t, i: idx++ });
    return idx - 1;
  };

  while (i < text.length) {
    const c = text[i];

    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }

    // arrows first (multi-char): -> => → >
    if (text.startsWith("->", i) || text.startsWith("=>", i)) {
      push({ text: text.slice(i, i + 2), norm: "→", kind: "arrow", family: "→", start: i, end: i + 2 });
      i += 2; continue;
    }
    if (c === "→" || c === ">") {
      push({ text: c, norm: "→", kind: "arrow", family: "→", start: i, end: i + 1 });
      i += 1; continue;
    }
```

_First 80 of 148 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
