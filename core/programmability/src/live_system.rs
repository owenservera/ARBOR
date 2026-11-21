//! One typed, revision-fenced representation of the live ARBOR system.
//! A materialized, bounded projection: NOT a database, grants engine, journal
//! or world authority. Existing Host and HQKG sources feed observations.
//! @hq:capability vivim.live-system-state@1
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeSet, HashSet};

pub const SCHEMA: &str = "vivim.live-system-state/1";
pub const EVENT_SCHEMA: &str = "vivim.live-system-event/1";
pub const MAX_REGIONS: usize = 128;
pub const MAX_REGION_BYTES: usize = 64 * 1024;
pub const MAX_EDITS: usize = 32;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Exposure {
    Public,
    Owner,
    Restricted,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RegionKind {
    Visual,
    Input,
    Knowledge,
    Execution,
    Devices,
    Authority,
    Diagnostics,
    Commands,
    Environment,
    Extensions,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Freshness {
    Current,
    Stale,
    Unavailable,
    Unknown,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Primitive {
    Text,
    Number,
    Boolean,
}

/// An allowlist from the trusted source. It does not grant an action.
/// The Host still resolves the action against its *current* catalog and grant.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WritableField {
    pub pointer: String,
    pub primitive: Primitive,
    pub action_id: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Region {
    pub id: String,
    pub kind: RegionKind,
    pub source_id: String,
    pub source_revision: u64,
    /// Distinct from source revision: availability can change without source data changing.
    pub view_revision: u64,
    pub observed_at_ms: u64,
    pub freshness: Freshness,
    pub exposure: Exposure,
    pub digest: String,
    pub data: Value,
    pub writable: Vec<WritableField>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LiveSystemState {
    pub schema: String,
    pub epoch: String,
    /// Logical publication order, not a cross-source atomic transaction.
    pub sequence: u64,
    pub regions: Vec<Region>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Observation {
    pub id: String,
    pub kind: RegionKind,
    pub source_id: String,
    pub source_revision: u64,
    pub observed_at_ms: u64,
    pub freshness: Freshness,
    pub exposure: Exposure,
    pub data: Value,
    pub writable: Vec<WritableField>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChangeEvent {
    pub schema: String,
    pub epoch: String,
    pub sequence: u64,
    pub region_id: String,
    pub prior_view_revision: u64,
    pub view_revision: u64,
    pub source_revision: u64,
    pub digest: String,
    pub freshness: Freshness,
    pub observed_at_ms: u64,
    pub correlation_id: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EditCandidate {
    pub region_id: String,
    pub source_id: String,
    pub expected_system_sequence: u64,
    pub expected_region_revision: u64,
    pub expected_source_revision: u64,
    pub pointer: String,
    pub action_id: String,
    pub old_value: Value,
    pub new_value: Value,
    pub correlation_id: String,
    pub effect_performed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Refusal {
    InvalidSnapshot,
    InvalidObservation,
    InvalidRegion,
    InvalidPointer,
    StaleSource,
    SameRevisionConflict,
    WrongEpoch,
    SourceChanged,
    ImmutableEdit,
    NotWritable,
    TooManyEdits,
    NoChange,
    Overflow,
    Unavailable,
}

fn id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b':' | b'_' | b'-'))
}
fn hex(s: &str) -> bool {
    s.len() == 64 && s.bytes().all(|b| b.is_ascii_hexdigit())
}
fn safe(v: &Value, depth: usize, count: &mut usize) -> bool {
    *count += 1;
    if depth > 16 || *count > 4096 {
        return false;
    }
    match v {
        Value::Null | Value::Bool(_) => true,
        Value::Number(n) => n.as_f64().is_some_and(f64::is_finite),
        Value::String(s) => s.len() <= 16_384 && !s.chars().any(|c| c == '\0'),
        Value::Array(a) => a.len() <= 512 && a.iter().all(|v| safe(v, depth + 1, count)),
        Value::Object(o) => {
            o.len() <= 512
                && o.keys().all(|k| {
                    k.len() <= 128
                        && !matches!(k.as_str(), "__proto__" | "prototype" | "constructor")
                })
                && o.values().all(|v| safe(v, depth + 1, count))
        }
    }
}
fn payload_valid(value: &Value) -> bool {
    serde_json::to_vec(value).is_ok_and(|v| v.len() <= MAX_REGION_BYTES) && safe(value, 0, &mut 0)
}
fn digest(v: &Value) -> String {
    format!(
        "{:x}",
        Sha256::digest(serde_json::to_vec(v).expect("serializable JSON"))
    )
}
fn pointer_valid(s: &str) -> bool {
    if !s.starts_with('/') || s.len() > 256 {
        return false;
    }
    let segments: Vec<_> = s[1..].split('/').collect();
    if segments.is_empty() || segments.len() > 16 {
        return false;
    }
    segments.iter().all(|p| {
        if p.is_empty() || p.len() > 64 {
            return false;
        }
        let decoded = p.replace("~1", "/").replace("~0", "~");
        if decoded.is_empty()
            || decoded.chars().any(char::is_control)
            || matches!(decoded.as_str(), "__proto__" | "prototype" | "constructor")
        {
            return false;
        }
        let mut chars = p.chars();
        while let Some(c) = chars.next() {
            if c == '~' && !matches!(chars.next(), Some('0' | '1')) {
                return false;
            }
        }
        true
    })
}
fn primitive_valid(kind: &Primitive, v: &Value) -> bool {
    match kind {
        Primitive::Text => v
            .as_str()
            .is_some_and(|s| s.len() <= 16_384 && !s.contains('\0')),
        Primitive::Number => v.as_f64().is_some_and(|n| n.is_finite() && n.abs() <= 1e12),
        Primitive::Boolean => v.is_boolean(),
    }
}
fn writable_valid(data: &Value, fields: &[WritableField], freshness: &Freshness) -> bool {
    if fields.len() > 32 || (matches!(freshness, Freshness::Unavailable) && !fields.is_empty()) {
        return false;
    }
    let mut seen = HashSet::new();
    fields.iter().all(|f| {
        id(&f.action_id)
            && pointer_valid(&f.pointer)
            && seen.insert(&f.pointer)
            && data
                .pointer(&f.pointer)
                .is_some_and(|v| primitive_valid(&f.primitive, v))
    })
}
impl Observation {
    pub fn validate(&self) -> Result<(), Refusal> {
        if !id(&self.id)
            || !id(&self.source_id)
            || self.observed_at_ms == 0
            || !payload_valid(&self.data)
            || !writable_valid(&self.data, &self.writable, &self.freshness)
            || (matches!(self.freshness, Freshness::Unavailable)
                && (!self.data.is_null() || !self.writable.is_empty()))
        {
            return Err(Refusal::InvalidObservation);
        }
        Ok(())
    }
}
impl LiveSystemState {
    pub fn new(epoch: &str) -> Result<Self, Refusal> {
        if !id(epoch) {
            return Err(Refusal::InvalidSnapshot);
        }
        Ok(Self {
            schema: SCHEMA.into(),
            epoch: epoch.into(),
            sequence: 0,
            regions: vec![],
        })
    }
    pub fn validate(&self) -> Result<(), Refusal> {
        if self.schema != SCHEMA
            || !id(&self.epoch)
            || self.regions.len() > MAX_REGIONS
            || self.sequence < self.regions.len() as u64
        {
            return Err(Refusal::InvalidSnapshot);
        }
        let mut seen = HashSet::new();
        for region in &self.regions {
            if !seen.insert(region.id.as_str())
                || region.view_revision == 0
                || region.view_revision > self.sequence
                || !hex(&region.digest)
                || region.digest != digest(&region.data)
                || (Observation {
                    id: region.id.clone(),
                    kind: region.kind.clone(),
                    source_id: region.source_id.clone(),
                    source_revision: region.source_revision,
                    observed_at_ms: region.observed_at_ms,
                    freshness: region.freshness.clone(),
                    exposure: region.exposure,
                    data: region.data.clone(),
                    writable: region.writable.clone(),
                })
                .validate()
                .is_err()
            {
                return Err(Refusal::InvalidRegion);
            }
        }
        Ok(())
    }
    pub fn integrate(
        &self,
        observation: Observation,
        correlation_id: &str,
    ) -> Result<(Self, Option<ChangeEvent>), Refusal> {
        self.validate()?;
        observation.validate()?;
        if !id(correlation_id) {
            return Err(Refusal::InvalidObservation);
        }
        let current = self.regions.iter().find(|r| r.id == observation.id);
        if let Some(previous) = current {
            if observation.source_id != previous.source_id || observation.kind != previous.kind {
                return Err(Refusal::SourceChanged);
            }
            if observation.source_revision < previous.source_revision {
                return Err(Refusal::StaleSource);
            }
            if observation.source_revision == previous.source_revision
                && (digest(&observation.data) != previous.digest
                    || observation.writable != previous.writable
                    || observation.exposure != previous.exposure)
            {
                return Err(Refusal::SameRevisionConflict);
            }
            if observation.observed_at_ms < previous.observed_at_ms {
                return Err(Refusal::StaleSource);
            }
            if observation.source_revision == previous.source_revision
                && observation.freshness == previous.freshness
            {
                return Ok((self.clone(), None));
            }
        } else if self.regions.len() >= MAX_REGIONS {
            return Err(Refusal::Overflow);
        }
        let sequence = self.sequence.checked_add(1).ok_or(Refusal::Overflow)?;
        let rev = current.map_or(1, |r| r.view_revision + 1);
        let changed = Region {
            id: observation.id.clone(),
            kind: observation.kind,
            source_id: observation.source_id,
            source_revision: observation.source_revision,
            view_revision: rev,
            observed_at_ms: observation.observed_at_ms,
            freshness: observation.freshness,
            exposure: observation.exposure,
            digest: digest(&observation.data),
            data: observation.data,
            writable: observation.writable,
        };
        let mut next = self.clone();
        if let Some(pos) = next.regions.iter().position(|r| r.id == changed.id) {
            next.regions[pos] = changed.clone();
        } else {
            next.regions.push(changed.clone());
            next.regions.sort_by(|a, b| a.id.cmp(&b.id));
        }
        next.sequence = sequence;
        let event = ChangeEvent {
            schema: EVENT_SCHEMA.into(),
            epoch: next.epoch.clone(),
            sequence,
            region_id: changed.id,
            prior_view_revision: current.map_or(0, |r| r.view_revision),
            view_revision: rev,
            source_revision: changed.source_revision,
            digest: changed.digest,
            freshness: changed.freshness,
            observed_at_ms: changed.observed_at_ms,
            correlation_id: correlation_id.into(),
        };
        Ok((next, Some(event)))
    }

    /// Scope is a vetted set of exact region IDs, not inferred from payload.
    /// Source-owned exposure is checked again at every projection.
    pub fn project(
        &self,
        max_exposure: Exposure,
        allowed_ids: &BTreeSet<String>,
    ) -> Result<Self, Refusal> {
        self.validate()?;
        let mut next = self.clone();
        next.regions
            .retain(|r| r.exposure <= max_exposure && allowed_ids.contains(&r.id));
        Ok(next)
    }
    /// A file edit can only propose existing allowlisted scalar changes.
    /// The file itself is never a grant, journal, or new canonical state.
    pub fn admit_edit(
        &self,
        edited: &Self,
        correlation_id: &str,
    ) -> Result<Vec<EditCandidate>, Refusal> {
        self.validate()?;
        if self.epoch != edited.epoch {
            return Err(Refusal::WrongEpoch);
        }
        if self.sequence != edited.sequence {
            return Err(Refusal::StaleSource);
        }
        // An external editor changes values, not the canonical digest.
        // Validate the normalized document only after restoring the old values.
        if !id(correlation_id) {
            return Err(Refusal::InvalidObservation);
        }
        if self.regions.len() != edited.regions.len() {
            return Err(Refusal::ImmutableEdit);
        }
        let mut normalized = edited.clone();
        let mut candidates = vec![];
        for (old, new) in self.regions.iter().zip(normalized.regions.iter_mut()) {
            if old.id != new.id {
                return Err(Refusal::ImmutableEdit);
            }
            for field in &old.writable {
                let prior = old
                    .data
                    .pointer(&field.pointer)
                    .ok_or(Refusal::InvalidRegion)?;
                let after = new
                    .data
                    .pointer(&field.pointer)
                    .ok_or(Refusal::ImmutableEdit)?;
                if prior == after {
                    continue;
                }
                if !matches!(old.freshness, Freshness::Current) {
                    return Err(Refusal::Unavailable);
                }
                if !primitive_valid(&field.primitive, after) {
                    return Err(Refusal::NotWritable);
                }
                candidates.push(EditCandidate {
                    region_id: old.id.clone(),
                    source_id: old.source_id.clone(),
                    expected_system_sequence: self.sequence,
                    expected_region_revision: old.view_revision,
                    expected_source_revision: old.source_revision,
                    pointer: field.pointer.clone(),
                    action_id: field.action_id.clone(),
                    old_value: prior.clone(),
                    new_value: after.clone(),
                    correlation_id: correlation_id.into(),
                    effect_performed: false,
                });
                if candidates.len() > MAX_EDITS {
                    return Err(Refusal::TooManyEdits);
                }
                *new.data
                    .pointer_mut(&field.pointer)
                    .ok_or(Refusal::ImmutableEdit)? = prior.clone();
            }
        }
        if normalized != *self {
            return Err(Refusal::ImmutableEdit);
        }
        normalized.validate()?;
        if candidates.is_empty() {
            return Err(Refusal::NoChange);
        }
        Ok(candidates)
    }
}

fn wrap<T: Serialize>(out: T) -> Value {
    json!({"schema":"vivim.live-system-computation/1","state":"computed",
        "authority":"none","executionAuthorized":false,"effectPerformed":false,"result":out})
}
fn refused(e: Refusal) -> Value {
    json!({"schema":"vivim.live-system-computation/1","state":"refused",
        "reason":format!("{e:?}"),"authority":"none",
        "executionAuthorized":false,"effectPerformed":false})
}

/// Same product-native dispatch path used by desktop and browser WASM.
pub fn dispatch(input: &Value) -> Value {
    if input["schema"] != "vivim.live-system-request/1" {
        return refused(Refusal::InvalidObservation);
    }
    let Some(op) = input["operation"].as_str() else {
        return refused(Refusal::InvalidObservation);
    };
    let parse = |key: &str| {
        serde_json::from_value::<LiveSystemState>(input[key].clone())
            .map_err(|_| Refusal::InvalidSnapshot)
    };
    let result = match op {
        "new" => LiveSystemState::new(input["epoch"].as_str().unwrap_or(""))
            .and_then(|s| serde_json::to_value(s).map_err(|_| Refusal::InvalidSnapshot)),
        "integrate" => parse("state").and_then(|s| {
            let obs: Observation = serde_json::from_value(input["observation"].clone())
                .map_err(|_| Refusal::InvalidObservation)?;
            let (next, event) = s.integrate(obs, input["correlationId"].as_str().unwrap_or(""))?;
            Ok(json!({"state":next,"event":event}))
        }),
        "project" => parse("state").and_then(|s| {
            let exposure: Exposure = serde_json::from_value(input["maxExposure"].clone())
                .map_err(|_| Refusal::InvalidObservation)?;
            let ids: BTreeSet<String> = serde_json::from_value(input["allowedIds"].clone())
                .map_err(|_| Refusal::InvalidObservation)?;
            s.project(exposure, &ids)
                .and_then(|s| serde_json::to_value(s).map_err(|_| Refusal::InvalidSnapshot))
        }),
        "admit-edit" => parse("state").and_then(|s| {
            let edited = parse("edited")?;
            let commands = s.admit_edit(&edited, input["correlationId"].as_str().unwrap_or(""))?;
            Ok(json!({"commands":commands}))
        }),
        _ => Err(Refusal::InvalidObservation),
    };
    match result {
        Ok(v) => wrap(v),
        Err(e) => refused(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn observation() -> Observation {
        Observation {
            id: "pwa.main".into(),
            kind: RegionKind::Visual,
            source_id: "host.renderer".into(),
            source_revision: 3,
            observed_at_ms: 100,
            freshness: Freshness::Current,
            exposure: Exposure::Owner,
            data: json!({"count":42,"text":"Hello"}),
            writable: vec![WritableField {
                pointer: "/count".into(),
                primitive: Primitive::Number,
                action_id: "ui.counter.set".into(),
            }],
        }
    }
    fn baseline() -> LiveSystemState {
        let (state, _) = LiveSystemState::new("session-1")
            .unwrap()
            .integrate(observation(), "observe-1")
            .unwrap();
        state
    }
    #[test]
    fn initial_and_idempotent_observation() {
        let s = baseline();
        assert_eq!(s.sequence, 1);
        assert_eq!(s.regions[0].view_revision, 1);
        let (same, event) = s.integrate(observation(), "again").unwrap();
        assert_eq!(same, s);
        assert_eq!(event, None);
    }
    #[test]
    fn changes_are_independently_revisioned() {
        let s = baseline();
        let mut next = observation();
        next.source_revision = 4;
        next.observed_at_ms = 101;
        next.data["count"] = json!(75);
        let (s2, event) = s.integrate(next, "input-2").unwrap();
        assert_eq!(s2.sequence, 2);
        assert_eq!(s2.regions[0].view_revision, 2);
        assert_eq!(event.unwrap().prior_view_revision, 1);
    }
    #[test]
    fn same_source_revision_conflict_is_not_silent() {
        let s = baseline();
        let mut next = observation();
        next.data["count"] = json!(123);
        next.observed_at_ms = 110;
        assert_eq!(s.integrate(next, "bad"), Err(Refusal::SameRevisionConflict));
    }
    #[test]
    fn unavailable_retains_state_transition_without_faking_data() {
        let s = baseline();
        let mut o = observation();
        o.observed_at_ms = 110;
        o.freshness = Freshness::Stale;
        o.writable.clear();
        // A source-owned writable catalog is part of source revision; it cannot
        // silently change without a newer revision.
        assert_eq!(
            s.integrate(o, "disconnect"),
            Err(Refusal::SameRevisionConflict)
        );
        let mut stale = observation();
        stale.observed_at_ms = 110;
        stale.freshness = Freshness::Stale;
        // Same data revision can change availability; materialization removes
        // write capability ONLY at the source's next revision.
        stale.source_revision = 4;
        stale.writable.clear();
        assert_eq!(
            s.integrate(stale, "disconnect").unwrap().0.regions[0].freshness,
            Freshness::Stale
        );
    }
    #[test]
    fn filter_never_leaks_restricted_regions() {
        let s = baseline();
        assert!(s
            .project(Exposure::Public, &BTreeSet::from(["pwa.main".into()]))
            .unwrap()
            .regions
            .is_empty());
        assert_eq!(
            s.project(Exposure::Owner, &BTreeSet::from(["pwa.main".into()]))
                .unwrap()
                .regions
                .len(),
            1
        );
    }
    #[test]
    fn single_edit_is_inert_and_fenced() {
        let s = baseline();
        let mut edited = s.clone();
        edited.regions[0].data["count"] = json!(75);
        let cmd = s.admit_edit(&edited, "edit-1").unwrap();
        assert_eq!(cmd.len(), 1);
        assert_eq!(cmd[0].action_id, "ui.counter.set");
        assert_eq!(cmd[0].new_value, json!(75));
        assert!(!cmd[0].effect_performed);
        assert_eq!(cmd[0].expected_system_sequence, 1);
    }
    #[test]
    fn immutable_and_stale_edits_are_refused() {
        let s = baseline();
        let mut edited = s.clone();
        edited.regions[0].data["text"] = json!("Injected");
        assert_eq!(s.admit_edit(&edited, "edit-1"), Err(Refusal::ImmutableEdit));
        let mut edited = s.clone();
        edited.sequence = 2;
        assert_eq!(s.admit_edit(&edited, "edit-1"), Err(Refusal::StaleSource));
    }
    #[test]
    fn additional_regions_do_not_require_visual_reload() {
        let s = baseline();
        let mut o = observation();
        o.id = "device.phone".into();
        o.kind = RegionKind::Devices;
        o.source_id = "host.device".into();
        o.data = json!({"connected":true});
        o.writable.clear();
        o.exposure = Exposure::Restricted;
        let (s2, event) = s.integrate(o, "phone-1").unwrap();
        assert_eq!(s2.regions.len(), 2);
        assert_eq!(
            s2.regions
                .iter()
                .find(|r| r.id == "pwa.main")
                .unwrap()
                .view_revision,
            1
        );
        assert_eq!(event.unwrap().region_id, "device.phone");
    }
    #[test]
    fn dispatch_supports_wasm_and_native_path() {
        let r = dispatch(&json!({"schema":"vivim.live-system-request/1",
            "operation":"new","epoch":"session-1"}));
        assert_eq!(r["state"], "computed");
        assert_eq!(r["result"]["sequence"], 0);
        assert_eq!(r["executionAuthorized"], false);
    }
    #[test]
    fn forbids_prototype_path_and_secretish_unchecked_types() {
        let mut o = observation();
        o.writable[0].pointer = "/__proto__/test".into();
        assert_eq!(o.validate(), Err(Refusal::InvalidObservation));
        o = observation();
        o.data = json!({"__proto__":7});
        assert_eq!(o.validate(), Err(Refusal::InvalidObservation));
    }
}
