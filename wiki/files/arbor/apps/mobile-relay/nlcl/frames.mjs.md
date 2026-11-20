# File: apps/mobile-relay/nlcl/frames.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/frames.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8730 B |
| Lines | 223 |
| Hash | b080248d6986 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NCLL_VERSION | const | 10 | yes | export const NCLL_VERSION = &quot;0.1.0&quot;; |
| DEFAULT_FRAMES | const | 12 | yes | export const DEFAULT_FRAMES = [ |
| framesForWorld | function | 155 | yes | export function framesForWorld(world ) { |
| out | const | 156 | no | const out = []; |
| routed | const | 157 | no | const routed = new Set(world.ops.map((o) =&gt; o.op)); |
| contributed | const | 159 | no | const contributed = Array.isArray(world.frames) ? world.frames : []; |
| genericFrame | function | 172 | no | function genericFrame(op ) { |
| local | const | 173 | no | const local = op.split(&quot;@&quot;)[0] ?? op; |
| tail | const | 174 | no | const tail = local.split(/[.:]/).filter(Boolean).pop() ?? local; |
| verb | const | 175 | no | const verb = fold(tail); |
| verbHits | function | 190 | yes | export function verbHits(word , frames , world ) { |
| taught | const | 191 | no | const taught = new Map (); // word → op |
| hits | const | 193 | no | const hits = []; |
| taughtForFrame | const | 195 | no | const taughtForFrame = [...taught.entries()].filter(([, op]) =&gt; op === frame.op).map(([w]) =&gt; w); |
| cls | const | 196 | no | const cls = classifyVerb(word, frame.verbs, taughtForFrame); |
| g | const | 203 | no | const g = genericFrame(op); |
| closestVerbs | function | 212 | yes | export function closestVerbs(word , frames , world , cap = 5) { |
| taught | const | 213 | no | const taught = world.lexicon.map((e) =&gt; fold(e.word)); |
| pool | const | 214 | no | const pool = []; |
| scored | const | 217 | no | const scored = pool |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./text.mjs | import | 8 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) | ./frames.mjs |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./frames.mjs |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./frames.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./frames.mjs |
| [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) | ./frames.mjs |
| [apps/vivim-host/control/personal-semantics.mjs](../../vivim-host/control/personal-semantics.mjs.md) | ../../mobile-relay/nlcl/frames.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/frames.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/frames.ts — LANGUAGE DATA (D-218): every op the console speaks, as data.
// Frames version WITH the nlcl plugin (one atomic upgrade unit); taught words live in the
// vault (world.lexicon) and merge over these verbs. Pseudo-intents (surfaceOnly) are served
// by surfaces — the language layer may describe them, the router never routes them.

                                                      
import { classifyVerb, fold, lev,                     } from "./text.mjs";

export const NCLL_VERSION = "0.1.0";

export const DEFAULT_FRAMES            = [
  {
    op: "message.send@1",
    verbs: ["send", "mail", "forward", "reply", "write"],
    title: "send a message",
    family: "/",
    slots: [
      { role: "message", kind: "content", patient: true, required: true, payloadKey: "body" },
      { role: "to", kind: "entity", entityTypes: ["contact"], preps: ["to"], required: true, payloadKey: "to", family: "→" },
      { role: "subject", kind: "text", preps: ["about", "re", "subject", "regarding"], payloadKey: "subject" },
    ],
    reading: "Send {message} to {to}",
    examples: ["send this to Peter", "send 'quarterly numbers attached' to Maria", "forward it to Sarah"],
  },
  {
    op: "message.receive@1",
    verbs: ["simulate", "receive", "pretend", "imagine"],
    title: "simulate an incoming message (the ingestion op)",
    family: "/",
    slots: [
      { role: "from", kind: "entity", entityTypes: ["contact"], preps: ["from"], patient: true, required: true, payloadKey: "from" },
      { role: "body", kind: "content", preps: ["saying"], payloadKey: "body" },
    ],
    reading: "Simulate a message from {from}",
    examples: ["simulate a message from Peter saying 'hello'", "Peter messages me: the report is ready"],
  },
  {
    op: "message.list@1",
    verbs: ["list", "inbox", "mailbox", "show"],
    title: "list messages",
    family: "?",
    slots: [
      { role: "folder", kind: "enum", enumValues: ["inbox", "sent", "archive", "trash", "drafts"], preps: ["in", "from"], payloadKey: "folder" },
    ],
    reading: "List {folder} messages",
    examples: ["list my inbox", "show sent messages", "what is in my inbox?"],
  },
  {
    op: "message.search@1",
    verbs: ["search", "find", "grep", "look"],
    title: "search messages",
    family: "?",
    slots: [
      { role: "q", kind: "rest", required: true, payloadKey: "q" },
    ],
    reading: "Search messages for {q}",
    examples: ["search merkle", "find messages about the report"],
  },
  {
    op: "message.read@1",
    verbs: ["read", "open"],
    title: "read a message",
    family: "/",
    slots: [
      { role: "id", kind: "entity", entityTypes: ["message"], patient: true, required: true, payloadKey: "id" },
    ],
    reading: "Read {id}",
    examples: ["read the quarterly report", "open Peter's last message"],
  },
  {
    op: "message.move@1",
    verbs: ["move", "archive", "trash", "file", "put"],
    title: "move a message",
    family: "∆",
    slots: [
      { role: "id", kind: "entity", entityTypes: ["message"], patient: true, required: true, payloadKey: "id" },
      { role: "folder", kind: "enum", enumValues: ["inbox", "sent", "archive", "trash", "drafts"], preps: ["to", "into", "in"], required: true, payloadKey: "folder" },
    ],
    reading: "Move {id} to {folder}",
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
