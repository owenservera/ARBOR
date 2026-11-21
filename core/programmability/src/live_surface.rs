//! Revision-fenced, inert live PWA surface document and bidirectional edit admission.
//! A document is a *projection*, not an effect grant or a second world-state store.
//! File watchers / UI renderers submit candidates to Host; only Host commits effects.
//! @hq:capability vivim.live-surface-document@1
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

pub const SCHEMA: &str = "vivim.live-surface/1";
pub const MAX_NODES: usize = 2_048;
pub const MAX_EDIT_BATCH: usize = 32;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub device_scale: f64,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValueType {
    Text,
    Number,
    Boolean,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ActionKind {
    Activate,
    Focus,
    Submit,
    ScrollIntoView,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SurfaceNode {
    /// Stable renderer-supplied ID, never inferred from visible text.
    pub id: String,
    pub parent_id: Option<String>,
    pub role: String,
    pub label: Option<String>,
    pub text: Option<String>,
    pub actions: Vec<ActionKind>,
    pub visible: bool,
    pub enabled: bool,
    pub bounds: Option<Bounds>,
    pub value_type: Option<ValueType>,
    pub value: Option<Value>,
    /// Display capability only. Host must reauthorize every candidate.
    pub editable: bool,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InputStamp {
    pub sequence: u64,
    pub observed_revision: u64,
    pub correlation_id: String,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CaptureFrame {
    pub sequence: u64,
    pub observed_revision: u64,
    /// Opaque Host-managed local reference; never inline screenshot bytes.
    pub blob_ref: String,
    pub sha256: String,
    pub captured_at_ms: u64,
    pub redacted: bool,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LiveSurfaceDocument {
    pub schema: String,
    pub surface_id: String,
    pub revision: u64,
    pub route: String,
    pub viewport: Viewport,
    pub focused_node_id: Option<String>,
    /// An ordered, complete current visible + commandable component projection.
    pub nodes: Vec<SurfaceNode>,
    pub last_input: Option<InputStamp>,
    pub last_capture: Option<CaptureFrame>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AdmissionError {
    InvalidDocument,
    InvalidNode,
    InvalidValue,
    StaleRevision,
    ImmutableEdit,
    NotEditable,
    TooManyEdits,
    NoChange,
    WrongSurface,
    StaleObservation,
    UnsupportedAction,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetValueCandidate {
    pub surface_id: String,
    pub expected_revision: u64,
    pub target_id: String,
    pub value: Value,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InputEvent {
    pub surface_id: String,
    pub sequence: u64,
    pub observed_revision: u64,
    pub correlation_id: String,
    pub target_id: Option<String>,
    pub kind: InputKind,
    pub value: Option<Value>,
    pub sensitive: bool,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum InputKind {
    Text,
    Composition,
    Key,
    Click,
    Focus,
    Blur,
    Scroll,
    Submit,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActionCandidate {
    pub surface_id: String,
    pub expected_revision: u64,
    pub correlation_id: String,
    pub target_id: String,
    pub action: ActionKind,
}

fn id_ok(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-' | b'.' | b':'))
}
fn finite(n: f64) -> bool {
    n.is_finite() && n.abs() <= 1_000_000_000.0
}
fn bounds_ok(b: &Bounds) -> bool {
    finite(b.x)
        && finite(b.y)
        && finite(b.width)
        && finite(b.height)
        && b.width >= 0.0
        && b.height >= 0.0
}
fn value_ok(kind: &ValueType, v: &Value) -> bool {
    match kind {
        ValueType::Text => v.as_str().is_some_and(|s| {
            s.len() <= 16_384 && !s.chars().any(|c| (c as u32) < 32 && c != '\n' && c != '\t')
        }),
        ValueType::Number => v.as_f64().is_some_and(finite),
        ValueType::Boolean => v.is_boolean(),
    }
}
impl LiveSurfaceDocument {
    pub fn validate(&self) -> Result<(), AdmissionError> {
        if self.schema != SCHEMA
            || !id_ok(&self.surface_id)
            || self.revision == 0
            || self.route.len() > 4_096
            || self.viewport.width == 0
            || self.viewport.height == 0
            || self.viewport.width > 16_384
            || self.viewport.height > 16_384
            || !finite(self.viewport.scroll_x)
            || !finite(self.viewport.scroll_y)
            || !self.viewport.device_scale.is_finite()
            || !(0.1..=16.0).contains(&self.viewport.device_scale)
            || self.nodes.len() > MAX_NODES
        {
            return Err(AdmissionError::InvalidDocument);
        }
        let mut index = HashMap::new();
        for (i, n) in self.nodes.iter().enumerate() {
            if !id_ok(&n.id)
                || n.role.is_empty()
                || n.role.len() > 100
                || n.label.as_ref().is_some_and(|s| s.len() > 16_384)
                || n.text.as_ref().is_some_and(|s| s.len() > 65_536)
                || n.actions.len() > 8
                || n.bounds.as_ref().is_some_and(|b| !bounds_ok(b))
                || n.value
                    .as_ref()
                    .is_some_and(|v| n.value_type.as_ref().is_none_or(|kind| !value_ok(kind, v)))
                || (n.editable && (!n.enabled || n.value_type.is_none()))
                || index.insert(n.id.as_str(), i).is_some()
            {
                return Err(AdmissionError::InvalidNode);
            }
        }
        // Validate the parent tree, not just individual IDs.
        for n in &self.nodes {
            let mut seen = HashSet::new();
            let mut cursor = n.parent_id.as_deref();
            while let Some(parent) = cursor {
                if !seen.insert(parent) {
                    return Err(AdmissionError::InvalidNode);
                }
                let parent_node = self
                    .nodes
                    .get(*index.get(parent).ok_or(AdmissionError::InvalidNode)?)
                    .ok_or(AdmissionError::InvalidNode)?;
                cursor = parent_node.parent_id.as_deref();
            }
        }
        if self
            .focused_node_id
            .as_ref()
            .is_some_and(|id| !index.contains_key(id.as_str()))
            || self
                .last_input
                .as_ref()
                .is_some_and(|s| s.observed_revision > self.revision || !id_ok(&s.correlation_id))
            || self.last_capture.as_ref().is_some_and(|f| {
                f.observed_revision > self.revision
                    || f.blob_ref.is_empty()
                    || f.blob_ref.len() > 512
                    || f.sha256.len() != 64
                    || !f.sha256.bytes().all(|b| b.is_ascii_hexdigit())
            })
        {
            return Err(AdmissionError::InvalidDocument);
        }
        Ok(())
    }
}

/// Compare a watcher-observed edited JSON document against the last Host-emitted
/// revision. Only node.value is editable. The resulting candidates are INERT:
/// the Host must check grants, current state, and effect receipts independently.
pub fn admit_file_edit(
    current: &LiveSurfaceDocument,
    edited: &LiveSurfaceDocument,
) -> Result<Vec<SetValueCandidate>, AdmissionError> {
    current.validate()?;
    if current.surface_id != edited.surface_id {
        return Err(AdmissionError::WrongSurface);
    }
    if current.revision != edited.revision {
        return Err(AdmissionError::StaleRevision);
    }
    edited.validate()?;
    if current.nodes.len() != edited.nodes.len() {
        return Err(AdmissionError::ImmutableEdit);
    }
    let mut normalized = edited.clone();
    let mut candidates = Vec::new();
    for (original, changed) in current.nodes.iter().zip(edited.nodes.iter()) {
        if original.id != changed.id {
            return Err(AdmissionError::ImmutableEdit);
        }
        if original.value != changed.value {
            if !original.editable {
                return Err(AdmissionError::NotEditable);
            }
            let value = changed.value.as_ref().ok_or(AdmissionError::InvalidValue)?;
            if !original
                .value_type
                .as_ref()
                .is_some_and(|kind| value_ok(kind, value))
            {
                return Err(AdmissionError::InvalidValue);
            }
            candidates.push(SetValueCandidate {
                surface_id: current.surface_id.clone(),
                expected_revision: current.revision,
                target_id: original.id.clone(),
                value: value.clone(),
            });
            if candidates.len() > MAX_EDIT_BATCH {
                return Err(AdmissionError::TooManyEdits);
            }
        }
    }
    for (before, after) in current.nodes.iter().zip(normalized.nodes.iter_mut()) {
        after.value = before.value.clone();
    }
    if normalized != *current {
        return Err(AdmissionError::ImmutableEdit);
    }
    if candidates.is_empty() {
        return Err(AdmissionError::NoChange);
    }
    Ok(candidates)
}
pub fn admit_json_edit(
    current: &LiveSurfaceDocument,
    bytes: &[u8],
) -> Result<Vec<SetValueCandidate>, AdmissionError> {
    if bytes.len() > 4 * 1024 * 1024 {
        return Err(AdmissionError::InvalidDocument);
    }
    let edited: LiveSurfaceDocument =
        serde_json::from_slice(bytes).map_err(|_| AdmissionError::InvalidDocument)?;
    admit_file_edit(current, &edited)
}

/// Admit a user/agent UI interaction as an inert candidate. The Host still
/// checks grants and routes the action to the renderer, then records the receipt.
pub fn admit_action(
    document: &LiveSurfaceDocument,
    target_id: &str,
    action: ActionKind,
    correlation_id: &str,
) -> Result<ActionCandidate, AdmissionError> {
    document.validate()?;
    if !id_ok(correlation_id) {
        return Err(AdmissionError::InvalidValue);
    }
    let node = document
        .nodes
        .iter()
        .find(|n| n.id == target_id)
        .ok_or(AdmissionError::InvalidNode)?;
    if !node.visible || !node.enabled || !node.actions.contains(&action) {
        return Err(AdmissionError::UnsupportedAction);
    }
    Ok(ActionCandidate {
        surface_id: document.surface_id.clone(),
        expected_revision: document.revision,
        correlation_id: correlation_id.into(),
        target_id: target_id.into(),
        action,
    })
}

/// An input belongs to this surface and may point only at a current node.
/// Sensitive values should remain redacted in durable event files.
pub fn observe_input(
    document: &LiveSurfaceDocument,
    event: &InputEvent,
) -> Result<InputStamp, AdmissionError> {
    document.validate()?;
    if document.surface_id != event.surface_id {
        return Err(AdmissionError::WrongSurface);
    }
    if event.observed_revision != document.revision
        || document
            .last_input
            .as_ref()
            .is_some_and(|prior| event.sequence <= prior.sequence)
    {
        return Err(AdmissionError::StaleObservation);
    }
    if !id_ok(&event.correlation_id)
        || event
            .target_id
            .as_ref()
            .is_some_and(|id| !document.nodes.iter().any(|n| n.id == *id))
        || event
            .value
            .as_ref()
            .is_some_and(|v| serde_json::to_vec(v).map_or(true, |bytes| bytes.len() > 16_384))
    {
        return Err(AdmissionError::InvalidValue);
    }
    Ok(InputStamp {
        sequence: event.sequence,
        observed_revision: event.observed_revision,
        correlation_id: event.correlation_id.clone(),
    })
}

/// Captures can lag behind the newest UI revision; they must never claim
/// a future revision or silently replace a newer frame.
pub fn observe_capture(
    document: &LiveSurfaceDocument,
    frame: &CaptureFrame,
) -> Result<(), AdmissionError> {
    document.validate()?;
    if frame.observed_revision > document.revision
        || document
            .last_capture
            .as_ref()
            .is_some_and(|last| frame.sequence <= last.sequence)
    {
        return Err(AdmissionError::StaleObservation);
    }
    let mut next = document.clone();
    next.last_capture = Some(frame.clone());
    next.validate()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn surface() -> LiveSurfaceDocument {
        LiveSurfaceDocument {
            schema: SCHEMA.into(),
            surface_id: "pwa:main".into(),
            revision: 7,
            route: "/chat".into(),
            viewport: Viewport {
                width: 900,
                height: 700,
                scroll_x: 0.0,
                scroll_y: 0.0,
                device_scale: 1.0,
            },
            focused_node_id: Some("count".into()),
            nodes: vec![
                SurfaceNode {
                    id: "root".into(),
                    parent_id: None,
                    role: "main".into(),
                    label: None,
                    text: None,
                    actions: vec![],
                    visible: true,
                    enabled: true,
                    bounds: None,
                    value_type: None,
                    value: None,
                    editable: false,
                },
                SurfaceNode {
                    id: "count".into(),
                    parent_id: Some("root".into()),
                    role: "spinbutton".into(),
                    label: Some("Count".into()),
                    text: None,
                    actions: vec![ActionKind::Focus],
                    visible: true,
                    enabled: true,
                    bounds: None,
                    value_type: Some(ValueType::Number),
                    value: Some(json!(42)),
                    editable: true,
                },
                SurfaceNode {
                    id: "title".into(),
                    parent_id: Some("root".into()),
                    role: "text".into(),
                    label: Some("Title".into()),
                    text: Some("Welcome".into()),
                    actions: vec![],
                    visible: true,
                    enabled: true,
                    bounds: None,
                    value_type: Some(ValueType::Text),
                    value: Some(json!("Welcome")),
                    editable: false,
                },
            ],
            last_input: None,
            last_capture: None,
        }
    }
    #[test]
    fn number_edit_yields_inert_candidate() {
        let current = surface();
        let mut edit = current.clone();
        edit.nodes[1].value = Some(json!(75));
        let commands = admit_file_edit(&current, &edit).unwrap();
        assert_eq!(commands.len(), 1);
        assert_eq!(commands[0].target_id, "count");
        assert_eq!(commands[0].expected_revision, 7);
        assert_eq!(commands[0].value, json!(75));
    }
    #[test]
    fn immutable_fields_cannot_be_edited() {
        let current = surface();
        let mut edit = current.clone();
        edit.route = "/admin".into();
        edit.nodes[1].value = Some(json!(75));
        assert_eq!(
            admit_file_edit(&current, &edit),
            Err(AdmissionError::ImmutableEdit)
        );
    }
    #[test]
    fn read_only_nodes_cannot_be_changed() {
        let current = surface();
        let mut edit = current.clone();
        edit.nodes[2].value = Some(json!("Spoofed"));
        assert_eq!(
            admit_file_edit(&current, &edit),
            Err(AdmissionError::NotEditable)
        );
    }
    #[test]
    fn stale_and_malformed_values_are_rejected() {
        let current = surface();
        let mut edit = current.clone();
        edit.revision = 6;
        assert_eq!(
            admit_file_edit(&current, &edit),
            Err(AdmissionError::StaleRevision)
        );
        edit.revision = 7;
        edit.nodes[1].value = Some(json!("wrong"));
        assert_eq!(
            admit_file_edit(&current, &edit),
            Err(AdmissionError::InvalidNode)
        );
    }
    #[test]
    fn duplicate_ids_and_cycles_are_rejected() {
        let mut x = surface();
        x.nodes[2].id = "count".into();
        assert_eq!(x.validate(), Err(AdmissionError::InvalidNode));
        let mut y = surface();
        y.nodes[0].parent_id = Some("title".into());
        assert_eq!(y.validate(), Err(AdmissionError::InvalidNode));
    }
    #[test]
    fn input_and_capture_align_to_revision() {
        let mut current = surface();
        let event = InputEvent {
            surface_id: "pwa:main".into(),
            sequence: 1,
            observed_revision: 7,
            correlation_id: "key:1".into(),
            target_id: Some("count".into()),
            kind: InputKind::Key,
            value: None,
            sensitive: false,
        };
        current.last_input = Some(observe_input(&current, &event).unwrap());
        assert_eq!(
            observe_input(&current, &event),
            Err(AdmissionError::StaleObservation)
        );
        let frame = CaptureFrame {
            sequence: 1,
            observed_revision: 6,
            blob_ref: "capture:1".into(),
            sha256: "a".repeat(64),
            captured_at_ms: 123,
            redacted: true,
        };
        assert_eq!(observe_capture(&current, &frame), Ok(()));
        current.last_capture = Some(frame.clone());
        assert_eq!(
            observe_capture(&current, &frame),
            Err(AdmissionError::StaleObservation)
        );
    }
    #[test]
    fn commandable_actions_are_revision_fenced() {
        let current = surface();
        let cmd = admit_action(&current, "count", ActionKind::Focus, "focus:1").unwrap();
        assert_eq!(cmd.expected_revision, 7);
        assert_eq!(cmd.target_id, "count");
        assert_eq!(
            admit_action(&current, "title", ActionKind::Activate, "click:1"),
            Err(AdmissionError::UnsupportedAction)
        );
    }
    #[test]
    fn json_roundtrip_and_candidate_are_consistent() {
        let current = surface();
        let mut edit = current.clone();
        edit.nodes[1].value = Some(json!(75));
        let bytes = serde_json::to_vec_pretty(&edit).unwrap();
        let cmd = admit_json_edit(&current, &bytes).unwrap();
        assert_eq!(cmd[0].value, json!(75));
    }
}
