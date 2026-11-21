//! Host-fed pure activity fabric: no IO, grants, journal or side-effect authority.
pub mod event;
pub mod episode;
pub mod note;
pub mod learning;
pub mod live_projection;

use serde_json::{json, Value};

const RESPONSE_SCHEMA: &str = "vivim.activity-computation/1";

fn refused(reason: &str) -> Value {
    json!({"schema": RESPONSE_SCHEMA, "state": "refused", "reason": reason,
        "authority": "none", "executionAuthorized": false, "effectPerformed": false})
}
fn computed(result: Value) -> Value {
    json!({"schema": RESPONSE_SCHEMA, "state": "computed", "result": result,
        "authority": "none", "executionAuthorized": false, "effectPerformed": false})
}

/// Pure compute only. The caller MUST authenticate actor, source, consent,
/// approvals and receipt provenance before supplying trusted observations.
pub fn dispatch(operation: &str, input: &Value) -> Value {
    let events = || -> Result<Vec<event::ActivityEvent>, ()> {
        let raw = input.get("events").and_then(Value::as_array).ok_or(())?;
        if raw.is_empty() || raw.len() > episode::MAX_BATCH { return Err(()); }
        let parsed: Vec<event::ActivityEvent> =
            serde_json::from_value(Value::Array(raw.clone())).map_err(|_| ())?;
        if parsed.iter().any(|event| event.validate().is_err()) { return Err(()); }
        Ok(parsed)
    };
    match operation {
        "activity-timeline" => {
            let Ok(events) = events() else { return refused("INVALID_ACTIVITY_EVENTS"); };
            match episode::project(&events) {
                Ok(projection) => computed(json!(projection)),
                Err(_) => refused("ACTIVITY_TIMELINE_REFUSED"),
            }
        }
        "activity-note-proposal" => {
            let Ok(note) = serde_json::from_value::<note::ReviewedNote>(input["note"].clone())
                else { return refused("INVALID_REVIEWED_NOTE"); };
            let Ok(existing) = serde_json::from_value::<Vec<String>>(input["existingTitles"].clone())
                else { return refused("INVALID_EXISTING_TITLES"); };
            match note::propose(&note, &existing) {
                Ok(proposal) => computed(json!(proposal)),
                Err(_) => refused("NOTE_PROPOSAL_REFUSED"),
            }
        }
        "activity-semantic-handoff" => {
            let Ok(mappings) = serde_json::from_value::<Vec<learning::ConfirmedMapping>>(
                input["verifiedMappings"].clone()
            ) else { return refused("INVALID_CONFIRMED_MAPPINGS"); };
            let (Some(minimum), Some(version)) = (
                input["minConfirmations"].as_u64(), input["catalogVersion"].as_u64()
            ) else { return refused("INVALID_CONFIRMATION_POLICY"); };
            match learning::prepare_confirmed_input(&mappings, minimum, version) {
                Ok(candidate) => computed(candidate),
                Err(_) => refused("SEMANTIC_HANDOFF_REFUSED"),
            }
        }
        "activity-observation" => {
            let Ok(events) = events() else { return refused("INVALID_ACTIVITY_EVENTS"); };
            let Ok(timeline) = episode::project(&events)
                else { return refused("ACTIVITY_TIMELINE_REFUSED"); };
            let (Some(revision), Some(observed_at), Some(freshness)) = (
                input["hostRevision"].as_u64(), input["observedAtMs"].as_u64(),
                input["freshness"].as_str(),
            ) else { return refused("INVALID_SOURCE_FENCE"); };
            match live_projection::as_live_observation(
                &timeline, revision, observed_at, freshness,
            ) {
                Ok(observation) => computed(observation),
                Err(_) => refused("ACTIVITY_OBSERVATION_REFUSED"),
            }
        }
        _ => refused("UNKNOWN_ACTIVITY_OPERATION"),
    }
}

#[cfg(test)]
mod dispatch_tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn refuses_untrusted_metadata_instead_of_fabricating_authority() {
        let out = dispatch("activity-timeline", &json!({"events": [
            {"schema":"vivim.activity-event/1","rawText":"secret"}
        ]}));
        assert_eq!(out["state"], "refused");
        assert_eq!(out["executionAuthorized"], false);
        assert_eq!(out["effectPerformed"], false);
    }

    #[test]
    fn no_implicit_note_review_or_consent() {
        let out = dispatch("activity-note-proposal", &json!({"note":{
            "schema":"vivim.reviewed-design-note/1",
            "originEventId":"evt1","originSourceId":"pwa.notes",
            "originRevision":1,"reviewedByOwner":false,
            "consentToTrackerProposal":true,"kind":"task","text":"Add Wiki activity"
        },"existingTitles":[]}));
        assert_eq!(out["state"], "refused");
    }
}
