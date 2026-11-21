//! Canonical metadata-only PWA/Host event candidate. Host resolves actor identity,
//! consent, current grants and source provenance before accepting an event.
//! Raw keystrokes, transcript bodies, bearer tokens and screenshots do not belong here.
use serde::{Deserialize, Serialize};

pub const ACTIVITY_SCHEMA: &str = "vivim.activity-event/1";
pub const MAX_EVENT_BYTES: usize = 4096;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ActorKind {
    Human,
    Agent,
    LocalExecutor,
    System,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Kind {
    DraftRevision,
    Tap,
    Gesture,
    Focus,
    Navigation,
    VoiceNoteReviewed,
    AgentProposal,
    HostReceipt,
    TestResult,
    UiObservation,
    UserCorrection,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Stage {
    Observed,
    Proposed,
    Admitted,
    Applied,
    Verified,
    Failed,
    Refused,
    Uncertain,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Privacy {
    Metadata,
    OwnerOnly,
    Restricted,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Consent {
    NotRequired,
    Granted,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Pointer {
    /// Local viewport fractions, not raw pixel/screen identifiers.
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActivityEvent {
    pub schema: String,
    pub event_id: String,
    pub session_id: String,
    pub actor_kind: ActorKind,
    /// Trusted Host must replace any browser-supplied actor reference.
    pub actor_ref: String,
    pub source_id: String,
    pub source_revision: u64,
    pub observed_at_ms: u64,
    pub correlation_id: String,
    #[serde(default)]
    pub causal_parent_id: Option<String>,
    #[serde(default)]
    pub target_id: Option<String>,
    pub kind: Kind,
    pub stage: Stage,
    pub privacy: Privacy,
    pub consent: Consent,
    #[serde(default)]
    pub payload_digest: Option<String>,
    #[serde(default)]
    pub text_length: Option<u32>,
    #[serde(default)]
    pub pointer: Option<Pointer>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EventError {
    InvalidSchema,
    InvalidIdentifier,
    InvalidRevision,
    MissingConsent,
    InvalidMetadata,
    Oversized,
    SensitiveCapture,
}

fn identifier(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
}
fn sha256_hex(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn exposed_text_target(s: &str) -> bool {
    let l = s.to_ascii_lowercase();
    [
        "password",
        "secret",
        "token",
        "credential",
        "payment",
        "card-number",
    ]
    .iter()
    .any(|fragment| l.contains(fragment))
}
impl ActivityEvent {
    /// Shape-only verification; NOT proof the browser is authorized or consent persisted.
    pub fn validate(&self) -> Result<(), EventError> {
        if self.schema != ACTIVITY_SCHEMA {
            return Err(EventError::InvalidSchema);
        }
        if !identifier(&self.event_id)
            || !identifier(&self.session_id)
            || !identifier(&self.actor_ref)
            || !identifier(&self.source_id)
            || !identifier(&self.correlation_id)
            || self
                .causal_parent_id
                .as_deref()
                .is_some_and(|s| !identifier(s))
            || self.target_id.as_deref().is_some_and(|s| !identifier(s))
        {
            return Err(EventError::InvalidIdentifier);
        }
        if self.source_revision == 0 || self.observed_at_ms == 0 {
            return Err(EventError::InvalidRevision);
        }
        if self.target_id.as_deref().is_some_and(exposed_text_target) {
            return Err(EventError::SensitiveCapture);
        }
        if matches!(
            self.kind,
            Kind::Tap | Kind::Gesture | Kind::VoiceNoteReviewed
        ) && self.consent != Consent::Granted
        {
            return Err(EventError::MissingConsent);
        }
        if self
            .payload_digest
            .as_deref()
            .is_some_and(|s| !sha256_hex(s))
        {
            return Err(EventError::InvalidMetadata);
        }
        if self.text_length.is_some()
            && !matches!(self.kind, Kind::DraftRevision | Kind::VoiceNoteReviewed)
        {
            return Err(EventError::InvalidMetadata);
        }
        if self.text_length.is_some_and(|n| n > 16_384) {
            return Err(EventError::InvalidMetadata);
        }
        if self.pointer.is_some() && !matches!(self.kind, Kind::Tap | Kind::Gesture) {
            return Err(EventError::InvalidMetadata);
        }
        if let Some(pointer) = &self.pointer {
            if self.target_id.is_none()
                || !pointer.x.is_finite()
                || !pointer.y.is_finite()
                || !(0.0..=1.0).contains(&pointer.x)
                || !(0.0..=1.0).contains(&pointer.y)
            {
                return Err(EventError::InvalidMetadata);
            }
        }
        if serde_json::to_vec(self).map_or(true, |bytes| bytes.len() > MAX_EVENT_BYTES) {
            return Err(EventError::Oversized);
        }
        Ok(())
    }
    pub fn from_json(raw: &str) -> Result<Self, EventError> {
        if raw.len() > MAX_EVENT_BYTES {
            return Err(EventError::Oversized);
        }
        let value: ActivityEvent =
            serde_json::from_str(raw).map_err(|_| EventError::InvalidMetadata)?;
        value.validate()?;
        Ok(value)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn good() -> ActivityEvent {
        ActivityEvent {
            schema: ACTIVITY_SCHEMA.into(),
            event_id: "e-1".into(),
            session_id: "s-1".into(),
            actor_kind: ActorKind::Human,
            actor_ref: "owner".into(),
            source_id: "pwa.input".into(),
            source_revision: 1,
            observed_at_ms: 1,
            correlation_id: "c-1".into(),
            causal_parent_id: None,
            target_id: Some("talk.composer".into()),
            kind: Kind::DraftRevision,
            stage: Stage::Observed,
            privacy: Privacy::OwnerOnly,
            consent: Consent::NotRequired,
            payload_digest: None,
            text_length: Some(4),
            pointer: None,
        }
    }
    #[test]
    fn accepts_bounded_metadata_only() {
        assert!(good().validate().is_ok());
    }
    #[test]
    fn refuses_raw_text_or_extra_fields() {
        let raw = serde_json::to_string(&good())
            .unwrap()
            .replace("\"eventId\"", "\"rawText\":\"secret\",\"eventId\"");
        assert_eq!(
            ActivityEvent::from_json(&raw),
            Err(EventError::InvalidMetadata)
        );
    }
    #[test]
    fn touch_requires_optin_and_valid_coordinates() {
        let mut e = good();
        e.kind = Kind::Tap;
        e.text_length = None;
        e.pointer = Some(Pointer { x: 0.5, y: 0.4 });
        assert_eq!(e.validate(), Err(EventError::MissingConsent));
        e.consent = Consent::Granted;
        assert!(e.validate().is_ok());
        e.pointer = Some(Pointer { x: 1.2, y: 0.3 });
        assert_eq!(e.validate(), Err(EventError::InvalidMetadata));
    }
    #[test]
    fn sensitive_target_is_not_recorded() {
        let mut e = good();
        e.target_id = Some("form.password".into());
        assert_eq!(e.validate(), Err(EventError::SensitiveCapture));
    }
}
