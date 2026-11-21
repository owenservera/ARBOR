//! Pure, explicit, user-reviewed note-to-tracker candidate. Never writes
//! REQUESTS.jsonl and never claims a Host authorization/receipt.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;

pub const NOTE_SCHEMA: &str = "vivim.reviewed-design-note/1";
pub const CANDIDATE_SCHEMA: &str = "vivim.tracker-task-proposal/1";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NoteError {
    InvalidSchema,
    NotReviewed,
    NotConsented,
    Empty,
    TooLong,
    UnsafeText,
    InvalidOrigin,
    TooManyExisting,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NoteKind {
    DesignNote,
    Task,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReviewedNote {
    pub schema: String,
    pub origin_event_id: String,
    pub origin_source_id: String,
    pub origin_revision: u64,
    pub reviewed_by_owner: bool,
    pub consent_to_tracker_proposal: bool,
    pub kind: NoteKind,
    pub text: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerProposal {
    pub schema: String,
    pub disposition: String,
    pub title: String,
    pub reviewed_text: String,
    pub content_digest: String,
    pub source_event_id: String,
    pub source_id: String,
    pub source_revision: u64,
    pub exact_title_matches: usize,
    pub authority: &'static str,
    pub execution_authorized: bool,
    pub effect_performed: bool,
}
fn id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn normalized(s: &str) -> String {
    s.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}
pub fn propose(
    note: &ReviewedNote,
    existing_titles: &[String],
) -> Result<TrackerProposal, NoteError> {
    if note.schema != NOTE_SCHEMA {
        return Err(NoteError::InvalidSchema);
    }
    if !note.reviewed_by_owner {
        return Err(NoteError::NotReviewed);
    }
    if !note.consent_to_tracker_proposal {
        return Err(NoteError::NotConsented);
    }
    if !id(&note.origin_event_id) || !id(&note.origin_source_id) || note.origin_revision == 0 {
        return Err(NoteError::InvalidOrigin);
    }
    if existing_titles.len() > 2000 {
        return Err(NoteError::TooManyExisting);
    }
    let text = note.text.trim();
    if text.is_empty() {
        return Err(NoteError::Empty);
    }
    if text.len() > 1200 {
        return Err(NoteError::TooLong);
    }
    if text
        .chars()
        .any(|c| c == '\0' || c.is_control() && c != '\n' && c != '\t')
    {
        return Err(NoteError::UnsafeText);
    }
    let title = text.lines().find(|l| !l.trim().is_empty()).unwrap_or("");
    let title = title
        .chars()
        .take(180)
        .collect::<String>()
        .trim()
        .to_string();
    if title.is_empty() {
        return Err(NoteError::Empty);
    }
    let unique: BTreeSet<String> = existing_titles.iter().map(|s| normalized(s)).collect();
    let duplicates = usize::from(unique.contains(&normalized(&title)));
    Ok(TrackerProposal {
        schema: CANDIDATE_SCHEMA.into(),
        disposition: if duplicates > 0 {
            "possible-duplicate".into()
        } else {
            "proposed".into()
        },
        title,
        reviewed_text: text.into(),
        content_digest: format!("{:x}", Sha256::digest(text.as_bytes())),
        source_event_id: note.origin_event_id.clone(),
        source_id: note.origin_source_id.clone(),
        source_revision: note.origin_revision,
        exact_title_matches: duplicates,
        authority: "none",
        execution_authorized: false,
        effect_performed: false,
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    fn note() -> ReviewedNote {
        ReviewedNote {
            schema: NOTE_SCHEMA.into(),
            origin_event_id: "event-1".into(),
            origin_source_id: "pwa.notes".into(),
            origin_revision: 2,
            reviewed_by_owner: true,
            consent_to_tracker_proposal: true,
            kind: NoteKind::DesignNote,
            text: "Add live Wiki activity\nShow input status".into(),
        }
    }
    #[test]
    fn proposes_inert_task_with_provenance() {
        let p = propose(&note(), &[]).unwrap();
        assert_eq!(p.title, "Add live Wiki activity");
        assert_eq!(p.disposition, "proposed");
        assert!(!p.execution_authorized && !p.effect_performed);
    }
    #[test]
    fn consent_and_review_are_separate() {
        let mut n = note();
        n.reviewed_by_owner = false;
        assert_eq!(propose(&n, &[]), Err(NoteError::NotReviewed));
        n.reviewed_by_owner = true;
        n.consent_to_tracker_proposal = false;
        assert_eq!(propose(&n, &[]), Err(NoteError::NotConsented));
    }
    #[test]
    fn exact_canonical_duplicate_is_flagged_not_silently_discarded() {
        let p = propose(&note(), &[" add  LIVE   wiki activity ".into()]).unwrap();
        assert_eq!(p.disposition, "possible-duplicate");
        assert_eq!(p.exact_title_matches, 1);
    }
    #[test]
    fn refuses_hidden_controls() {
        let mut n = note();
        n.text = "secret\0".into();
        assert_eq!(propose(&n, &[]), Err(NoteError::UnsafeText));
    }
}
