"""VIVIM PC-only offline media language worker.

This is the small Python adapter to already-installed native AI libraries,
not a standalone app, API server, file catalog, or Host authorization source.
Only the Host passes owner-resolved temp-file paths. Never downloads models.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
import wave

VALID_LANG = re.compile(r"^[a-z]{2,3}(?:-[A-Z]{2})?$")
MAX_TRANSCRIPT_CHARS = 160_000
MAX_SEGMENTS = 5000


def report(stage: str, **extra: object) -> None:
    # Host consumes bounded stage markers; never emit private transcript text.
    print(json.dumps({"schema": "vivim.media-language-progress/1",
                      "stage": stage, **extra}, ensure_ascii=False), flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Offline VIVIM language conversion")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--model-cache", type=Path, required=True)
    parser.add_argument("--voice", type=Path, required=True)
    parser.add_argument("--source-language", default="en")
    parser.add_argument("--target-language", default="es-ES")
    parser.add_argument("--asr-model", default="base")
    args = parser.parse_args()
    if args.source_language != "en" or args.target_language != "es-ES":
        report("failed", code="LANGUAGE_PACK_UNAVAILABLE")
        return 2
    if not VALID_LANG.fullmatch(args.target_language):
        report("failed", code="LANGUAGE_INVALID")
        return 2
    # Host passes only its temporary job directory and pinned engine paths.
    # The worker independently requires real input files and preinstalled models.
    if not args.input.is_file() or args.input.stat().st_size < 44:
        report("failed", code="MEDIA_INPUT_UNAVAILABLE")
        return 2
    if not args.voice.is_file() or not args.voice.with_suffix(args.voice.suffix + ".json").is_file():
        report("failed", code="VOICE_MODEL_UNAVAILABLE")
        return 2
    if args.output.exists():
        report("failed", code="OUTPUT_ALREADY_EXISTS")
        return 2
    os.environ.setdefault("ARGOS_DEVICE_TYPE", "cpu")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    report("transcribing")
    from faster_whisper import WhisperModel
    model = WhisperModel(args.asr_model, device="cpu", compute_type="int8",
                         cpu_threads=4, download_root=str(args.model_cache),
                         local_files_only=True)
    segments, _ = model.transcribe(str(args.input), language="en", beam_size=3,
                                   vad_filter=True, condition_on_previous_text=False)
    texts = []
    total = 0
    for index, segment in enumerate(segments):
        if index >= MAX_SEGMENTS:
            report("failed", code="TRANSCRIPT_TOO_LARGE")
            return 2
        part = segment.text.strip()
        if part:
            total += len(part) + 1
            if total > MAX_TRANSCRIPT_CHARS:
                report("failed", code="TRANSCRIPT_TOO_LARGE")
                return 2
            texts.append(part)
    if not texts:
        report("failed", code="NO_SPEECH_RECOGNIZED")
        return 2
    transcript = " ".join(texts)

    report("translating", segments=len(texts))
    from argostranslate import translate
    try:
        translation = translate.get_translation_from_codes("en", "es")
        if translation is None:
            raise ValueError("language pack is not installed")
        # Translate bounded segments instead of one potentially huge string.
        translated = [translation.translate(text).strip() for text in texts]
    except Exception:
        report("failed", code="TRANSLATION_PACK_UNAVAILABLE")
        return 2
    if not all(translated):
        report("failed", code="TRANSLATION_EMPTY")
        return 2

    report("synthesizing")
    from piper import PiperVoice
    voice = PiperVoice.load(str(args.voice))
    # Preserve sentence boundaries so the Spanish sounds like narration.
    with wave.open(str(args.output), "wb") as wav:
        voice.synthesize_wav(" ".join(translated), wav)
    if not args.output.is_file() or args.output.stat().st_size < 64:
        report("failed", code="SYNTHESIS_EMPTY")
        return 2
    # Private transcript is never returned in status or sent to the phone.
    # The owning Host can later add a transcript receipt under the same policy.
    report("complete", bytes=args.output.stat().st_size,
           transcriptCharacters=len(transcript))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        # Never print source text, input paths, interpreter internals or secrets.
        report("failed", code="LOCAL_LANGUAGE_ENGINE_FAILED")
        sys.exit(1)
