# System-wide configuration authority — R001
2026-11-25 | Founder direction: central for all VIVIM use across all existing and future components.

Canonical workstream and research: [UX, Settings & Configuration R002](https://github.com/owenservera/vivim-labs/blob/main/VIVIM%20V1.0/UX-SETTINGS-CONFIGURATION/README.md). Its location in V1.0 is historical; V1 is the first delivery milestone, not the scope boundary.

All ARBOR subsystems and new integrations must converge on shared typed configuration semantics: stable identifiers, authoritative domain, scope, defaults, validation, effective-value provenance, sensitivity, apply mode, dependencies, version/migration and recovery. Register both user-facing preferences and internal operational configuration; not every setting requires an editable UI control. Reuse existing capability metadata and domain stores, not a second competing registry or database. Host is sole effect/permission authority; GPUI is sole product renderer; authenticated PWA projects GPUI. Explicitly local presentation-only preferences never confer access. Distinguish desired values, observed status, grants, policy and secret references; never expose raw secrets. Configuration cannot grant authority implicitly.

Existing components: inventory keys, flags, env, persisted state, overrides, callers and writers; reconcile and migrate without disrupting working installs. Future components: include shared configuration descriptors and documented authoritative mutation/readback, not independent settings silos. Integrate onboarding, natural language, developer tooling and automation with the same semantics. No new provider admission gate.

This document records the owner mandate, not proof of implementation. Registry schema, migration mechanics and sequencing remain workstream deliverables. Coordinate changes with subsystem owners and preserve existing Host contracts.
