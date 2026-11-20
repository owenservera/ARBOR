# File: studio/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../projects/arbor.md) |
| Path | studio/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 9975 B |
| Lines | 134 |
| Hash | c998a0bbd9ba |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
<div align="center">

![VIVIM — Your AI. Your world.](assets/vivim-repo-banner.svg)

### Your webapps. Your data. Your AI world.

**Own your AI · Share your AI · Evolve your AI**

VIVIM is building a **local-first personal world for your webapps and AI**. Interact with the services you already use, bring useful information together on your own machine, and organize, search, and reuse it under your direction.

[**The vision**](#the-idea) · [**How it works**](#a-world-you-can-return-to) · [**What's available**](#what-exists-today) · [**Try the preview**](#try-the-developer-preview)

![Status: active development](https://img.shields.io/badge/status-active_development-508e72?style=flat-square)
![Approach: local-first](https://img.shields.io/badge/approach-local--first-3c7974?style=flat-square)
![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-456d70?style=flat-square)

</div>

---

## The idea

**Your data lives across the web. Your personal world shouldn't have to.**

Today your work is scattered across AI chats, documents, dashboards, feeds, and other webapps. Every service has its own interface, history, and context. Finding and connecting what matters means switching between them.

VIVIM is designed around a different starting point: **you, your webapps, and the information you choose to keep locally**.

Its ambition is to **interact with any webapp through a common, user-directed layer**, capture useful content with source context, and bring that information into one locally managed personal world. AI providers are an important first use case, not the limit of the platform. Universal compatibility is a goal, not a claim of verified support for every site.

| **Own your AI** | **Share your AI** | **Evolve your AI** |
| :--- | :--- | :--- |
| Bring selected webapp data, conversations, notes and artifacts into a locally managed world. | Choose which information to export or carry into another website, AI task or workflow. | Organize, annotate, connect and improve your own context over time. |
| **Your knowledge, beyond one provider.** | **Your choice, not automatic exposure.** | **Your work, increasingly useful.** |

> **My machine. My data. My AI.** A product direction built on local-first ownership, user choice and traceable sources — not a promise of absolute security or features that haven't shipped.

## A world you can return to

VIVIM's core experience is one connected journey, not four separate tools.

| Step | What it means for you |
| :--- | :--- |
| **01 · Return** | Open a conversation or piece of work you've actually saved. Read it with its original meaning and context intact. |
| **02 · Organize** | Keep the useful part in your own project, add notes, and relate it to other work. |
| **03 · Find** | Locate the idea, answer or artifact again — without remembering which provider or chat held it. |
| **04 · Take** | Carry selected knowledge into a new task or interaction, deliberately and with context. |

**One personal world. Many webapps. Your data stays under your direction.**

VIVIM Projects are *your* organization layer, not a claim that remote provider Projects have been imported or modified. The provider remains authoritative for its remote account and conversations; VIVIM preserves the local record and user-created context.

### What makes VIVIM different?

- **Webapp-wide ambition.** A reusable browser-based interaction and capture layer aims to work across AI chat, tables, feeds, forms, articles and more — subject to per-site behavior and permissions.
- **Local centralization.** Bring selected records from separate services into one personal data space on your machine, without claiming ownership of remote provider records.
- **Security-conscious control.** Dedicated browser profiles, local-only default server binding, explicit authorization for external actions and clear evidence provenance are part of the current approach. Raw capture still requires care.
- **Persistent by intent.** Saved local material should remain useful even when a provider is disconnected.
- **Source-grounded.** Know what was observed, imported, derived or written by you — including missing or uncertain content.
- **Human-directed.** Reading, selecting, sharing and external actions have distinct boundaries.
- **Provider-independent identity.** Your world is not defined by any single chatbot, browser or model.
- **Built for ownership.** Local storage, selected exports and recovery matter more than keeping everything inside one interface.

## What exists today?

<sup>Public development snapshot · October 2026. Source presence is not the same as a completed live-user acceptance test.</sup>

The code in this repository is the **VIVIM Harness** — the operating foundation for this product. It contains a local Studio UI, a CLI, browser-capture infrastructure and work toward an integrated personal world.

On Windows, a [per-user `vivim` command](scripts/windows/CLI-INSTALL.md) delegates lifecycle operations to the existing Studio launcher. It does not provide integrated Host/relay supervision or demonstrate cold-reboot acceptance.

| Capability | Current status |
| :--- | :--- |
| Browser-based webapp observation | **Implemented in source.** Chrome DevTools Protocol capture for authorized tabs, including DOM and network observations; site behavior and coverage vary. |
| Local data centralization | **Foundation present.** Locally stored evidence, derived records, and emerging personal-world views; universal webapp ingestion is not verified. |
| Saved conversations and world views | **Present in source.** Local views for saved material, projects, notes, find, transfer, relations and workspace are under active integration. |
| Native conversation content and provenance | **Partially integrated.** Rich content and source/coverage handling exist; fidelity varies with what was actually observed. |
| Webapp interaction | **Selective capability present.** Explicit browser actions and supported AI-provider flows exist; arbitrary websites do not automatically have working action recipes. |
| Full first-run experience and durable end-to-end user journey | **Still being validated and completed.** This is not yet a polished consumer release. |
| Multi-account support, whole-account history and automatic sync | **Not advertised as available.** Significant decisions and implementation work remain. |
```

_First 80 of 135 lines._

---

[HQ wiki](../../../index.md) · [Symbols](../../../symbols.md) · [Dependency graph](../../../graph.md) · [Documentation](../../../docs.md) · [Changes](../../../changes.md) · [Open tasks](../../../todos.md) · [Deprecated](../../../deprecated.md) · [Agent annotation protocol](../../../protocol.md) · [Glossary](../../../glossary.md) · [Using HQ](../../../context.md) · [Capabilities](../../../capabilities.md) · [Search index](../../../search.json) · [Browser view](../../../index.html)
