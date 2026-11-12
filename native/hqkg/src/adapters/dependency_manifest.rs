//! @hq:context Optional versioned JSON manifest adapter for HQKG's std-only dependency protocol.
//! @hq:owner repos-hq
//! @hq:invariant Parsing untrusted metadata does not approve runtime execution or install anything.
use crate::control::{
    resolve_dependencies, Dependency, EnginePolicy, ResourceKind, Version, VersionRange,
};
use crate::{Error, Result};
use serde_json::{Map, Value};
use std::collections::BTreeMap;

const SCHEMA: &str = "hqkg.module-dependencies/1";
const MAX_MANIFEST_BYTES: usize = 256 * 1024;
const MAX_REQUIREMENTS: usize = 1024;

#[derive(Clone, Debug)]
pub struct ModuleManifest {
    pub id: String,
    pub slot: String,
    pub interface: String,
    pub version: Version,
    /// Declared, untrusted; this flag does NOT authorize production.
    pub declared_production_ready: bool,
    pub dependencies: Vec<Dependency>,
}
fn object<'a>(value: &'a Value) -> Result<&'a Map<String, Value>> {
    value
        .as_object()
        .ok_or_else(|| Error::Invalid("expected JSON object".into()))
}
fn text<'a>(map: &'a Map<String, Value>, key: &str) -> Result<&'a str> {
    map.get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| Error::Invalid(format!("required string: {key}")))
}
fn valid_id(s: &str) -> bool {
    !s.is_empty() && s.len() <= 256 && !s.chars().any(char::is_control)
}
fn bool_key(m: &Map<String, Value>, key: &str) -> Result<bool> {
    m.get(key)
        .and_then(Value::as_bool)
        .ok_or_else(|| Error::Invalid(format!("required boolean: {key}")))
}
fn kind(s: &str) -> ResourceKind {
    match s {
        "Engine" => ResourceKind::Engine,
        "Database" => ResourceKind::Database,
        "Dataset" => ResourceKind::Dataset,
        "Capability" => ResourceKind::Capability,
        "Schema" => ResourceKind::Schema,
        other => ResourceKind::Other(other.into()),
    }
}
pub fn parse_manifest(input: &[u8]) -> Result<ModuleManifest> {
    if input.is_empty() || input.len() > MAX_MANIFEST_BYTES {
        return Err(Error::Invalid("manifest size outside safe bounds".into()));
    }
    let parsed: Value = serde_json::from_slice(input)
        .map_err(|e| Error::Invalid(format!("invalid dependency manifest JSON: {e}")))?;
    let top = object(&parsed)?;
    if text(top, "schema")? != SCHEMA {
        return Err(Error::Unsupported(
            "unknown dependency-manifest schema".into(),
        ));
    }
    let module = object(
        top.get("module")
            .ok_or_else(|| Error::Invalid("missing module".into()))?,
    )?;
    let id = text(module, "id")?.to_owned();
    let slot = text(module, "slot")?.to_owned();
    let interface = text(module, "interface")?.to_owned();
    for v in [&id, &slot, &interface] {
        if !valid_id(v) {
            return Err(Error::Invalid("invalid manifest module identifier".into()));
        }
    }
    let version = Version::parse(text(module, "version")?)?;
    let declared_production_ready = bool_key(module, "production_ready")?;
    let records = top
        .get("requirements")
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid("manifest requirements array missing".into()))?;
    if records.len() > MAX_REQUIREMENTS {
        return Err(Error::Invalid("too many dependency declarations".into()));
    }
    let mut dependencies = Vec::new();
    for row in records {
        let m = object(row)?;
        let id = text(m, "id")?.to_owned();
        if !valid_id(&id) {
            return Err(Error::Invalid("invalid dependency ID".into()));
        }
        let raw_kind = text(m, "kind")?;
        if !["Engine", "Database", "Dataset", "Capability", "Schema"].contains(&raw_kind) {
            return Err(Error::Unsupported(format!(
                "unknown resource kind: {raw_kind}"
            )));
        }
        let lower = Version::parse(text(m, "min_inclusive")?)?;
        let upper = match m.get("max_exclusive") {
            Some(Value::String(s)) => Some(Version::parse(s)?),
            Some(Value::Null) | None => None,
            _ => {
                return Err(Error::Invalid(
                    "max_exclusive must be string or null".into(),
                ))
            }
        };
        let digest = match m.get("expected_sha256") {
            Some(Value::String(s)) => {
                if s.len() != 64
                    || !s
                        .bytes()
                        .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
                {
                    return Err(Error::Invalid(
                        "expected_sha256 must be 64 lowercase hex characters".into(),
                    ));
                }
                Some(s.clone())
            }
            Some(Value::Null) | None => None,
            _ => {
                return Err(Error::Invalid(
                    "expected_sha256 must be string or null".into(),
                ))
            }
        };
        let after = m
            .get("after")
            .and_then(Value::as_array)
            .ok_or_else(|| Error::Invalid("dependency after must be an array".into()))?
            .iter()
            .map(|x| {
                x.as_str()
                    .map(str::to_owned)
                    .ok_or_else(|| Error::Invalid("after must contain IDs".into()))
            })
            .collect::<Result<Vec<_>>>()?;
        dependencies.push(Dependency {
            id,
            kind: kind(raw_kind),
            version: VersionRange {
                min_inclusive: lower,
                max_exclusive: upper,
            },
            required: bool_key(m, "required")?,
            expected_sha256: digest,
            after,
        });
    }
    // Static syntax, duplicate and DAG check with all resources intentionally absent
    // and temporarily optional; no driver/DB/network side effects.
    let optional = dependencies
        .iter()
        .cloned()
        .map(|mut d| {
            d.required = false;
            d
        })
        .collect::<Vec<_>>();
    resolve_dependencies(&optional, &BTreeMap::new(), false)?;
    Ok(ModuleManifest {
        id,
        slot,
        interface,
        version,
        declared_production_ready,
        dependencies,
    })
}
impl ModuleManifest {
    /// External approval must be supplied by runtime owner; a manifest flag is inert.
    pub fn unapproved_engine_policy(&self) -> EnginePolicy {
        EnginePolicy {
            production_ready: false,
            dependencies: self.dependencies.clone(),
        }
    }
}
