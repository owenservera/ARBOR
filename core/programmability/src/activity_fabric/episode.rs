//! Pure bounded activity timeline: preserves arrival order and explicit causal
//! references; never invents a global transaction sequence from timestamps.
use super::event::{ActivityEvent, EventError};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

pub const MAX_BATCH: usize = 512;
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProjectionError {
    Empty,
    TooMany,
    InvalidEvent(EventError),
    ContradictoryId,
    RegressingSource,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Gap {
    pub source_id: String,
    pub after_revision: u64,
    pub before_revision: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineRow {
    pub event_id: String,
    pub actor_kind: String,
    pub source_id: String,
    pub source_revision: u64,
    pub observed_at_ms: u64,
    pub correlation_id: String,
    pub causal_parent_id: Option<String>,
    pub parent_present: bool,
    pub kind: String,
    pub stage: String,
    pub privacy: String,
    pub target_id: Option<String>,
    pub text_length: Option<u32>,
    pub pointer_present: bool,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineProjection {
    pub schema: String,
    pub rows: Vec<TimelineRow>,
    pub gaps: Vec<Gap>,
    pub unresolved_parent_ids: Vec<String>,
    pub duplicates_collapsed: usize,
    pub authority: &'static str,
    pub execution_authorized: bool,
    pub effect_performed: bool,
}
fn label<T: serde::Serialize>(v: &T) -> String {
    // Exactly the serde kebab-case tag that browser and Rust contracts share.
    serde_json::to_value(v)
        .ok()
        .and_then(|value| value.as_str().map(str::to_string))
        .unwrap_or_else(|| "unknown".into())
}
pub fn project(events: &[ActivityEvent]) -> Result<TimelineProjection, ProjectionError> {
    if events.is_empty() {
        return Err(ProjectionError::Empty);
    }
    if events.len() > MAX_BATCH {
        return Err(ProjectionError::TooMany);
    }
    let mut by_id: HashMap<&str, &ActivityEvent> = HashMap::new();
    let mut revisions: HashMap<&str, u64> = HashMap::new();
    let mut rows = Vec::with_capacity(events.len());
    let mut gaps = Vec::new();
    let mut duplicates = 0;
    for e in events {
        e.validate().map_err(ProjectionError::InvalidEvent)?;
        if let Some(previous) = by_id.get(e.event_id.as_str()) {
            if *previous != e {
                return Err(ProjectionError::ContradictoryId);
            }
            duplicates += 1;
            continue;
        }
        by_id.insert(e.event_id.as_str(), e);
        if let Some(previous) = revisions.insert(e.source_id.as_str(), e.source_revision) {
            if e.source_revision < previous {
                return Err(ProjectionError::RegressingSource);
            }
            if e.source_revision > previous.saturating_add(1) {
                gaps.push(Gap {
                    source_id: e.source_id.clone(),
                    after_revision: previous,
                    before_revision: e.source_revision,
                });
            }
        }
        rows.push(TimelineRow {
            event_id: e.event_id.clone(),
            actor_kind: label(&e.actor_kind),
            source_id: e.source_id.clone(),
            source_revision: e.source_revision,
            observed_at_ms: e.observed_at_ms,
            correlation_id: e.correlation_id.clone(),
            causal_parent_id: e.causal_parent_id.clone(),
            parent_present: false,
            kind: label(&e.kind),
            stage: label(&e.stage),
            privacy: label(&e.privacy),
            target_id: e.target_id.clone(),
            text_length: e.text_length,
            pointer_present: e.pointer.is_some(),
        });
    }
    let ids: HashSet<String> = rows.iter().map(|e| e.event_id.clone()).collect();
    let mut unresolved = Vec::new();
    for row in &mut rows {
        row.parent_present = row
            .causal_parent_id
            .as_deref()
            .is_some_and(|id| ids.contains(id));
        if let Some(parent) = row.causal_parent_id.as_deref() {
            if !row.parent_present && !unresolved.iter().any(|id: &String| id == parent) {
                unresolved.push(parent.to_string());
            }
        }
    }
    Ok(TimelineProjection {
        schema: "vivim.activity-timeline/1".into(),
        rows,
        gaps,
        unresolved_parent_ids: unresolved,
        duplicates_collapsed: duplicates,
        authority: "none",
        execution_authorized: false,
        effect_performed: false,
    })
}
/// Read-only causally linked selection for future replay inspector. This is NOT
/// replay of an effect and never calls the Host dispatcher.
pub fn select_episode(projection: &TimelineProjection, correlation: &str) -> Vec<TimelineRow> {
    projection
        .rows
        .iter()
        .filter(|r| r.correlation_id == correlation)
        .cloned()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::super::event::{ActorKind, Consent, Kind, Privacy, Stage};
    use super::*;
    fn e(id: &str, rev: u64) -> ActivityEvent {
        ActivityEvent {
            schema: "vivim.activity-event/1".into(),
            event_id: id.into(),
            session_id: "s".into(),
            actor_kind: ActorKind::Human,
            actor_ref: "owner".into(),
            source_id: "pwa.input".into(),
            source_revision: rev,
            observed_at_ms: 1000 + rev,
            correlation_id: "c".into(),
            causal_parent_id: None,
            target_id: Some("composer".into()),
            kind: Kind::DraftRevision,
            stage: Stage::Observed,
            privacy: Privacy::Metadata,
            consent: Consent::NotRequired,
            payload_digest: None,
            text_length: Some(2),
            pointer: None,
        }
    }
    #[test]
    fn deduplicates_retry_without_fake_revision() {
        let p = project(&[e("a", 1), e("a", 1), e("b", 2)]).unwrap();
        assert_eq!(p.rows.len(), 2);
        assert_eq!(p.duplicates_collapsed, 1);
        assert_eq!(p.gaps.len(), 0);
        assert!(!p.execution_authorized);
    }
    #[test]
    fn gap_and_missing_parent_stay_explicit() {
        let mut other = e("b", 4);
        other.causal_parent_id = Some("unknown".into());
        let p = project(&[e("a", 1), other]).unwrap();
        assert_eq!(p.gaps.len(), 1);
        assert_eq!(p.unresolved_parent_ids, vec!["unknown"]);
    }
    #[test]
    fn rejects_conflicting_duplicate() {
        assert_eq!(
            project(&[e("a", 1), e("a", 2)]),
            Err(ProjectionError::ContradictoryId)
        );
    }
    #[test]
    fn rejects_stale_source() {
        assert_eq!(
            project(&[e("a", 2), e("b", 1)]),
            Err(ProjectionError::RegressingSource)
        );
    }
    #[test]
    fn does_not_replay_effects() {
        let p = project(&[e("a", 1)]).unwrap();
        assert_eq!(select_episode(&p, "c").len(), 1);
        assert!(!p.effect_performed);
    }
}
