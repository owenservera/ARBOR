//! A pure, inert file-level language-conversion contract for the ONE VIVIM
//! workspace surface. PC Host owns effects; GPUI and phone PWA project the
//! same source-backed job. No file access, model calls or authorization here.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const MEDIA_LANGUAGE_SCHEMA: &str = "vivim.workspace-media-language/1";

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceMedia {
    /// Opaque Host-resolved workspace file identity, never a filesystem path.
    pub file_id: String,
    pub revision: u64,
    pub sha256: String,
    pub kind: MediaKind,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind { Audio, Video }

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaOutput { AudioMp3, AudioWav, DubbedMp4 }

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaLanguageRequest {
    pub source: WorkspaceMedia,
    /// None requests automatic language detection by the local recognition engine.
    pub source_language: Option<String>,
    /// BCP-47 language, e.g. es-ES. Must be backed by an installed language pack.
    pub target_language: String,
    /// Host-selected local voice identity, not a user-supplied model path.
    pub voice_id: String,
    pub output: MediaOutput,
    /// Pinned implementation/model bundle, so cached derivatives cannot silently
    /// survive an engine upgrade. Host resolves this to installed executables.
    pub engine_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MediaLanguageRefusal {
    InvalidFileId,
    InvalidRevision,
    InvalidDigest,
    InvalidLanguage,
    SameLanguage,
    InvalidVoice,
    InvalidEngine,
    OutputSourceMismatch,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreparedMediaLanguage {
    pub schema: &'static str,
    pub source_file_id: String,
    pub source_revision: u64,
    pub target_language: String,
    pub output: MediaOutput,
    /// Deterministic key for a *derived* workspace asset; not a permission or
    /// job handle. The original asset is never overwritten.
    pub derivative_key: String,
    pub effect_authorized: bool,
    pub effect_performed: bool,
}

fn opaque_id(value: &str) -> bool {
    !value.is_empty() && value.len() <= 128 &&
        value.bytes().all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}

fn digest_sha256(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn language_tag(value: &str) -> bool {
    let mut parts = value.split('-');
    let Some(language) = parts.next() else { return false; };
    if !(2..=3).contains(&language.len()) || !language.bytes().all(|b| b.is_ascii_lowercase()) {
        return false;
    }
    match (parts.next(), parts.next()) {
        (None, None) => true,
        (Some(region), None) => region.len() == 2 && region.bytes().all(|b| b.is_ascii_uppercase()),
        _ => false,
    }
}

/// Validates an already-resolved workspace file reference and an inert request.
/// Host must still check owner, current revision, file bytes, installed engines,
/// grants, effects and receipts at execution time. This is NOT authorization.
pub fn prepare_media_language(
    request: &MediaLanguageRequest,
) -> Result<PreparedMediaLanguage, MediaLanguageRefusal> {
    use MediaLanguageRefusal::*;
    if !opaque_id(&request.source.file_id) { return Err(InvalidFileId); }
    if request.source.revision == 0 { return Err(InvalidRevision); }
    if !digest_sha256(&request.source.sha256) { return Err(InvalidDigest); }
    if !language_tag(&request.target_language) ||
        request.source_language.as_deref().is_some_and(|tag| !language_tag(tag)) {
        return Err(InvalidLanguage);
    }
    if request.source_language.as_deref() == Some(request.target_language.as_str()) {
        return Err(SameLanguage);
    }
    if !opaque_id(&request.voice_id) { return Err(InvalidVoice); }
    if !opaque_id(&request.engine_id) { return Err(InvalidEngine); }
    if request.output == MediaOutput::DubbedMp4 && request.source.kind != MediaKind::Video {
        return Err(OutputSourceMismatch);
    }
    // serde_json encodes a fixed-order tuple; no ambiguous delimiter concatenation.
    let identity = serde_json::to_vec(&(
        MEDIA_LANGUAGE_SCHEMA,
        &request.source.file_id,
        request.source.revision,
        &request.source.sha256,
        request.source.kind,
        &request.source_language,
        &request.target_language,
        &request.voice_id,
        request.output,
        &request.engine_id,
    )).expect("serializing plain request metadata cannot fail");
    let derivative_key = format!("{:x}", Sha256::digest(identity));
    Ok(PreparedMediaLanguage {
        schema: MEDIA_LANGUAGE_SCHEMA,
        source_file_id: request.source.file_id.clone(),
        source_revision: request.source.revision,
        target_language: request.target_language.clone(),
        output: request.output,
        derivative_key,
        effect_authorized: false,
        effect_performed: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> MediaLanguageRequest {
        MediaLanguageRequest {
            source: WorkspaceMedia {
                file_id: "workspace-file-123".into(),
                revision: 7,
                sha256: "a".repeat(64),
                kind: MediaKind::Audio,
            },
            source_language: Some("en".into()),
            target_language: "es-ES".into(),
            voice_id: "piper.es_ES.default".into(),
            output: MediaOutput::AudioMp3,
            engine_id: "offline-bundle-v1".into(),
        }
    }
    #[test]
    fn prepared_audio_is_inert_and_keeps_immutable_source_identity() {
        let result = prepare_media_language(&sample()).unwrap();
        assert_eq!(result.schema, MEDIA_LANGUAGE_SCHEMA);
        assert_eq!(result.source_file_id, "workspace-file-123");
        assert_eq!(result.source_revision, 7);
        assert!(!result.effect_authorized && !result.effect_performed);
        assert_eq!(result.derivative_key.len(), 64);
        assert_eq!(result, prepare_media_language(&sample()).unwrap());
    }
    #[test]
    fn language_and_voice_and_revision_change_derivative_identity() {
        let baseline = prepare_media_language(&sample()).unwrap().derivative_key;
        for changed in [
            MediaLanguageRequest { target_language: "fr-FR".into(), ..sample() },
            MediaLanguageRequest { voice_id: "piper.es_ES.alternative".into(), ..sample() },
            MediaLanguageRequest { engine_id: "offline-bundle-v2".into(), ..sample() },
            MediaLanguageRequest { source: WorkspaceMedia {
                revision: 8, ..sample().source }, ..sample() },
        ] {
            assert_ne!(baseline, prepare_media_language(&changed).unwrap().derivative_key);
        }
    }
    #[test]
    fn rejects_paths_and_stale_or_unproven_assets() {
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            source: WorkspaceMedia { file_id: "../secret.mp3".into(), ..sample().source },
            ..sample()
        }), Err(MediaLanguageRefusal::InvalidFileId));
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            source: WorkspaceMedia { revision: 0, ..sample().source }, ..sample()
        }), Err(MediaLanguageRefusal::InvalidRevision));
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            source: WorkspaceMedia { sha256: "unknown".into(), ..sample().source }, ..sample()
        }), Err(MediaLanguageRefusal::InvalidDigest));
    }
    #[test]
    fn rejects_invalid_language_and_video_only_output_for_audio() {
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            target_language: "../../etc".into(), ..sample()
        }), Err(MediaLanguageRefusal::InvalidLanguage));
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            source_language: Some("es-ES".into()), ..sample()
        }), Err(MediaLanguageRefusal::SameLanguage));
        assert_eq!(prepare_media_language(&MediaLanguageRequest {
            output: MediaOutput::DubbedMp4, ..sample()
        }), Err(MediaLanguageRefusal::OutputSourceMismatch));
        assert!(prepare_media_language(&MediaLanguageRequest {
            source: WorkspaceMedia { kind: MediaKind::Video, ..sample().source },
            output: MediaOutput::DubbedMp4, ..sample()
        }).is_ok());
    }
}
