# File: apps/mobile-relay/nlcl/project.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/project.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4456 B |
| Lines | 84 |
| Hash | ccbff485645b |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| projectTokens | function | 10 | yes | export function projectTokens(tokens , candidate , modifierTokenIdx , _notes ) { |
| roleByToken | const | 11 | no | const roleByToken = new Map (); |
| noteByToken | const | 12 | no | const noteByToken = new Map (); |
| slot | const | 18 | no | const slot = candidate.ir.slots[fs.role]; |
| label | variable | 20 | no | let label = fs.role; |
| note | variable | 21 | no | let note = slot.display; |
| isPrep | const | 35 | no | const isPrep = t.kind === &quot;word&quot; &amp;&amp; fs.preps.includes(t.norm); |
| isArrow | const | 36 | no | const isArrow = t.kind === &quot;arrow&quot; &amp;&amp; fs.family === &quot;→&quot;; |
| out | const | 46 | no | const out = []; |
| family | variable | 48 | no | let family = t.family; |
| note | variable | 49 | no | let note = noteByToken.get(t.i) ?? undefined; |
| role | variable | 50 | no | let role = roleByToken.get(t.i) ?? undefined; |
| projectEffects | function | 65 | yes | export function projectEffects(ir , world ) { |
| out | const | 66 | no | const out = []; |
| opView | const | 67 | no | const opView = world.ops.find((o) =&gt; o.op === ir.intent); |
| gate | const | 69 | no | const gate = |
| thenOp | const | 75 | no | const thenOp = (ir.payload )[&quot;then&quot;]?.[&quot;op&quot;]; |
| a | const | 77 | no | const a = world.ops.find((o) =&gt; o.op === thenOp); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./symbols.mjs | import | 7 | [apps/mobile-relay/nlcl/symbols.mjs](./symbols.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./project.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./project.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/project.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/project.ts — the feedback projection: tokens → live annotations, and
// the effect preview. This module is what makes the console feel ALIVE: every token gets a
// meaning, every intent gets a consequence, before anything executes.

                                                                                          
import { MODIFIER_WORDS, STOPWORDS, FAMILY_BY_CHAR } from "./symbols.mjs";

/** Annotate every token with family/role/notes — the live underlines. */
export function projectTokens(tokens         , candidate                  , modifierTokenIdx             , _notes          )              {
  const roleByToken = new Map                ();
  const noteByToken = new Map                ();
  if (candidate) {
    roleByToken.set(candidate.verbToken, "verb");
    noteByToken.set(candidate.verbToken, `${candidate.ir.intent} · ${candidate.verbCls} verb`);
    // exact per-slot attribution: each slot owns the tokens it consumed
    for (const fs of candidate.frame.slots) {
      const slot = candidate.ir.slots[fs.role];
      if (!slot) continue;
      let label = fs.role;
      let note = slot.display;
      if (fs.family === "→") label = `→ ${fs.role}`;
      if (slot.entityId) note = `${slot.display} (${slot.note ?? "grounded"})`;
      if (slot.contextRef) note = `${slot.display} (context)`;
      if (slot.matches && slot.matches.length > 1) note = `${slot.display} · ${slot.matches.length} match`;
      for (const ti of slot.tokens ?? []) {
        if (roleByToken.has(ti) && roleByToken.get(ti) !== `prep:${fs.role}`) continue;
        roleByToken.set(ti, roleByToken.get(ti)?.startsWith("prep:") ? roleByToken.get(ti)  : label);
        noteByToken.set(ti, note);
      }
      // prep tokens routed to this slot (the word "to" or an arrow) get the prep role
      if (fs.preps && fs.preps.length > 0) {
        for (const t of tokens) {
          if (t.i > candidate.verbToken && !roleByToken.has(t.i)) {
            const isPrep = t.kind === "word" && fs.preps.includes(t.norm);
            const isArrow = t.kind === "arrow" && fs.family === "→";
            if (isPrep || isArrow) {
              roleByToken.set(t.i, `prep:${fs.role}`);
              noteByToken.set(t.i, `routes "${fs.role}"`);
            }
          }
        }
      }
    }
  }
  const out              = [];
  for (const t of tokens) {
    let family = t.family;
    let note = noteByToken.get(t.i) ?? undefined;
    let role = roleByToken.get(t.i) ?? undefined;
    if (modifierTokenIdx.has(t.i)) { role = role ?? "modifier"; note = note ?? (t.kind === "word" ? `modifier (${MODIFIER_WORDS[t.norm] ?? "?"})` : "force/confirm marker"); }
    if (t.kind === "word" && STOPWORDS.includes(t.norm) && !role) { role = "filler"; }
    if (t.kind === "quote" && !role) { role = role ?? "literal"; note = note ?? `quoted text`; }
    if (family && FAMILY_BY_CHAR.has(family) && !role) {
      role = role ?? FAMILY_BY_CHAR.get(family) .name;
      note = note ?? FAMILY_BY_CHAR.get(family) .meaning;
    }
    out.push({ i: t.i, text: t.text, start: t.start, end: t.end, kind: t.kind, family, role, note });
  }
  void _notes;
  return out;
}

/** Effect preview: what executing this IR WILL do, including the law's gate (from WorldModel ops). */
export function projectEffects(ir    , world            )               {
  const out               = [];
  const opView = world.ops.find((o) => o.op === ir.intent);
  if (!opView) return out;
  const gate                     =
    opView.risk === "EXTERNAL_MUTATION" ? "consent" :
    opView.risk === "MUTATION" ? "journal" : "open";
  out.push({ op: opView.op, risk: opView.risk, provider: opView.provider, title: opView.title, gate });
  // rules preview the action's effect too
  if (ir.intent === "director.rule@1") {
    const thenOp = (ir.payload                              )["then"]?.["op"];
    if (thenOp) {
      const a = world.ops.find((o) => o.op === thenOp);
      if (a) {
        out.push({ op: a.op, risk: a.risk, provider: a.provider, title: `${a.title} (by the rule, under principal vivim.director)`, gate: a.risk === "EXTERNAL_MUTATION" ? "consent" : a.risk === "MUTATION" ? "journal" : "open" });
      }
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
