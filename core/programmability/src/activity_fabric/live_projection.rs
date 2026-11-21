//! Adapter projecting a bounded activity summary into the incumbent Rust
//! LiveSystemState Observation shape. No new persisted live-state authority.
use super::episode::TimelineProjection;
use serde_json::{json, Value};

pub const ACTIVITY_REGION_ID: &str = "pwa.activity";
pub const ACTIVITY_SOURCE_ID: &str = "host.activity-observer";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProjectError {
    Empty,
    InvalidRevision,
    TooManyRows,
    InvalidState,
    Restricted,
}
/// Caller supplies a Host-owned revision, not a browser-invented sequence.
pub fn as_live_observation(
    timeline: &TimelineProjection,
    host_revision: u64,
    observed_at_ms: u64,
    freshness: &str,
) -> Result<Value, ProjectError> {
    if timeline.schema != "vivim.activity-timeline/1"
        || timeline.authority != "none"
        || timeline.execution_authorized
        || timeline.effect_performed
    {
        return Err(ProjectError::InvalidState);
    }
    if timeline.rows.is_empty() {
        return Err(ProjectError::Empty);
    }
    if timeline.rows.len() > 512 {
        return Err(ProjectError::TooManyRows);
    }
    if timeline.rows.iter().any(|r| r.privacy == "restricted") {
        return Err(ProjectError::Restricted);
    }
    if host_revision == 0 || observed_at_ms == 0 {
        return Err(ProjectError::InvalidRevision);
    }
    if !matches!(freshness, "current" | "stale" | "unavailable" | "unknown")
        || freshness == "unavailable"
    {
        return Err(ProjectError::InvalidState);
    }
    let rows: Vec<_> = timeline
        .rows
        .iter()
        .rev()
        .take(24)
        .rev()
        .map(|r| {
            json!({
                "eventId":r.event_id,"kind":r.kind,"stage":r.stage,
                "actorKind":r.actor_kind,"targetId":r.target_id,
                "sourceId":r.source_id,"sourceRevision":r.source_revision,
                "observedAtMs":r.observed_at_ms,"correlationId":r.correlation_id,
                "parentPresent":r.parent_present
            })
        })
        .collect();
    let data = json!({
        "schema":"vivim.activity-summary/1",
        "observedCount":timeline.rows.len(),"duplicatesCollapsed":timeline.duplicates_collapsed,
        "gapCount":timeline.gaps.len(),
        "unresolvedParents":timeline.unresolved_parent_ids.len(),
        "recent":rows
    });
    Ok(json!({
        "id":ACTIVITY_REGION_ID,"kind":"diagnostics",
        "sourceId":ACTIVITY_SOURCE_ID,"sourceRevision":host_revision,
        "observedAtMs":observed_at_ms,"freshness":freshness,
        "exposure":"owner","data":data,"writable":[]
    }))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn requires_real_projection() {
        let t = TimelineProjection {
            schema: "vivim.activity-timeline/1".into(),
            rows: vec![],
            gaps: vec![],
            unresolved_parent_ids: vec![],
            duplicates_collapsed: 0,
            authority: "none",
            execution_authorized: false,
            effect_performed: false,
        };
        assert_eq!(
            as_live_observation(&t, 1, 1, "current"),
            Err(ProjectError::Empty)
        );
    }
}
