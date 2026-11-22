# VIVIM — Workspace media: Listen in another language

**Owner scope:** 2026-11-22. **Product action:** a user has an audio/video file **already in their VIVIM workspace** and wants to **hear it in another language**. This is a *file-level action*, not a standalone upload-and-convert app.

## Interaction (one canonical surface, phone-first)

- Audio/video file row or player: **Listen in…**; choose a target language and optionally a voice. The original file stays intact.
- One tap starts a Host-owned job on the **paired local PC**; the same job revision, progress, error, receipt and media output appear on GPUI and the mobile PWA.
- When ready, the player can switch **Original ↔ Translated**. A translated version is a new, provenance-linked **derived workspace media asset**. Never overwrite the original, and never ask the user to upload the same asset again.
- The phone can request conversion, play translated media, seek and download when authorized. The phone is a viewport/client; the default inference happens on the paired Windows PC. If PC is offline, show a truthful unavailable/queued state, never claim a cloud job ran.
- Initial language pack: English speech → Castilian Spanish audio (`es-ES`). The contract must accept other installed language packs (e.g., French, German, Spanish regional variants), not hard-code a single language into the media action. Unsupported languages are clearly disabled or explicitly fail.
- Audio source produces derived MP3 or WAV; video source can also produce dubbed MP4 while preserving source video. Later versions add timed alignment, multiple speakers and optionally captions.

## Host-owned execution

```
existing workspace file ID + source revision + content hash
    -> Host verifies owner/grant/source snapshot and installed local engines
    -> FFmpeg extract mono 16 kHz speech track (existing PC dependency)
    -> local ASR, with per-segment text + timestamps
    -> local language translation, preserving segment order
    -> local voice synthesizer, speech in requested target language
    -> FFmpeg output/optional remux to derived asset
    -> Host-owned job/asset receipt and revisioned media projections
    -> existing authenticated phone media streaming / seek / playback
```

**Reuse, don't duplicate:** existing Host approval/effect authority, media playback/stream guards, mobile relay, live-system revisions, authenticated pairing, Rust programmability/VEC and GPUI/phone projections. Never create a new server, second database, separate app surface, new provider account, or second source-of-truth catalog.

**Preliminary local CPU engine stack:** FFmpeg already installed on the Windows PC; use a lightweight Whisper.cpp ASR model, a local language-pair translation model (e.g., Argos), and a local Spanish voice (e.g., Piper) as version-pinned executable/model adapters. These adapters may be improved/replaced without changing the workspace contract. No silent paid/provider API fallback. Avoid running heavyweight models on the phone for v1.

## Contract and safety

- Pure Rust request/derived-cache identity is in `core/programmability/src/media_language.rs`. It validates opaque workspace file identity, source revision/digest, language/voice/engine IDs and output kind; it does not authorize or execute effects.
- Host must resolve file IDs to already-registered owner-controlled assets, recheck the source revision and bytes at execution, enforce file size/duration and disk budget, validate media content beyond extension, bound child process runtime/CPU/memory, and retain cancel/retry/progress/receipt state.
- Keep source media private and PC-local unless the owner explicitly requests sharing to paired mobile. No arbitrary filesystem paths from the phone, no external provider upload, no automatic cloning of someone's recognizable voice. Narration uses a normal licensed voice by default.
- Derived identity includes source hash/revision, source/target language, voice, output type and pinned engine version. Changing any of them invalidates the cache. Derived audio inherits the source's disclosure/access policy. Device download and playback must use existing Host-authenticated routes with range support.
- Audio-only conversion is translation + synthesis; it is not equivalent to subtitles, and should not be represented as a real-time translator until streaming and latency are measured.

## Acceptance and staged work

1. **Contract**: add pure Rust file-level request validation and deterministic derived identity, tests; no false job authorization (source present on ARBOR main).
2. **PC engine**: inspect installed tools/models and install isolated local model dependencies; implement local input -> translated output for a registered workspace asset with a Host receipt and cancellation. Test with real, non-sensitive sample audio.
3. **Host file integration**: resolve existing workspace assets into a bounded local worker, persist the derivative as an asset with source lineage, and stream output through existing authorized media path. No user-provided PC paths from phone.
4. **UI**: expose `Listen in…` on the *existing* canonical file/player action list in GPUI and mobile PWA; same revisioned job state and action IDs, not separate UI definitions.
5. **Physical proof**: Windows + phone, same source, select `es-ES`, hear Spanish audio in phone PWA, seek, switch original/translated, disconnect/reconnect, confirm source unchanged and same receipt. Keep status CODED/PUSHED/DEPLOYED/DEVICE VERIFIED separate.

**Current status:** contract and this product definition pushed to GitHub; no conversion worker, live UI or phone-device proof yet. Do not show a functional `Listen in…` action before its Host-backed implementation exists.
