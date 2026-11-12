use hqkg::control::*;
use hqkg::{
    ComputeEngine, EngineDescriptor, EngineOutput, EngineRegistry, EngineRequest, Error, Graph,
    Result,
};
use std::collections::BTreeMap;
use std::sync::Arc;

fn v(s: &str) -> Version {
    Version::parse(s).unwrap()
}
fn req(id: &str, required: bool) -> Dependency {
    Dependency {
        id: id.into(),
        kind: ResourceKind::Dataset,
        version: VersionRange {
            min_inclusive: v("1.0.0"),
            max_exclusive: Some(v("2.0.0")),
        },
        required,
        expected_sha256: None,
        after: vec![],
    }
}
fn resource(id: &str) -> Resource {
    Resource {
        id: id.into(),
        kind: ResourceKind::Dataset,
        version: v("1.2.3"),
        ready: true,
        sha256: Some("a".repeat(64)),
        generation: None,
    }
}
#[test]
fn semantic_versions_ranges_and_cycles() {
    assert_eq!(v("1.2.3").label(), "1.2.3");
    for invalid in ["1.2", "1.2.3-beta", "01.2.3", "-1.2.3", "1.2.4294967296"] {
        assert!(Version::parse(invalid).is_err());
    }
    let mut resources = BTreeMap::new();
    resources.insert("corpus".into(), resource("corpus"));
    let mut first = req("corpus", true);
    let mut second = req("stemmer", false);
    second.after.push("corpus".into());
    let x = resolve_dependencies(&[first.clone(), second.clone()], &resources, true).unwrap();
    assert_eq!(x.order, vec!["corpus", "stemmer"]);
    assert_eq!(x.pinned.len(), 1);
    assert_eq!(x.omitted_optional, vec!["stemmer"]);
    first.after.push("stemmer".into());
    assert!(resolve_dependencies(&[first, second], &resources, true).is_err());
}
#[test]
fn reject_missing_and_unpinned_data_in_production() {
    let mut resources = BTreeMap::new();
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, true).is_err());
    let mut r = resource("corpus");
    r.sha256 = None;
    resources.insert("corpus".into(), r);
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, true).is_err());
    assert!(resolve_dependencies(&[req("corpus", true)], &resources, false).is_ok());
}
#[test]
fn cas_configuration_and_immutable_history() {
    let mut c = CoreConfig::default();
    assert_eq!(c.mode, Mode::Production);
    assert!(c
        .patch(
            1,
            ConfigPatch {
                allow_experimental: Some(true),
                ..Default::default()
            }
        )
        .is_err());
    c.patch(
        1,
        ConfigPatch {
            mode: Some(Mode::Development),
            ..Default::default()
        },
    )
    .unwrap();
    let old = c.revision;
    assert!(c
        .patch(
            1,
            ConfigPatch {
                ..Default::default()
            }
        )
        .is_err());
    assert!(!c.patch(old, ConfigPatch::default()).unwrap().changed);
    let mut g = Graph::new();
    assert!(c.record_snapshot(&mut g).unwrap());
    assert!(!c.record_snapshot(&mut g).unwrap());
    assert_eq!(g.node_count(), 1);
}
#[test]
fn telemetry_ring_percentiles_and_quarantine() {
    let mut t = Telemetry::new(16).unwrap();
    for i in 1..=30 {
        t.emit(MetricEvent {
            sequence: 0,
            slot: "engine".into(),
            operation: "path".into(),
            outcome: if i % 7 == 0 {
                Outcome::Failed
            } else {
                Outcome::Success
            },
            elapsed_ms: i,
            generation: Some(1),
            config_revision: 1,
        })
        .unwrap();
    }
    assert_eq!(t.events().count(), 16);
    assert_eq!(t.dropped(), 14);
    let summary = t.summary("engine");
    assert_eq!(summary.max_ms, 30);
    assert!(summary.p95_ms >= 28);
    let mut health = HealthMonitor::default();
    assert_eq!(
        health.failure("x", "timeout", 2),
        RecoveryPlan::RetryReadOnlyAfterProbe
    );
    assert_eq!(
        health.failure("x", "timeout", 2),
        RecoveryPlan::QuarantineAndReview
    );
    assert!(health.ensure_runnable("x").is_err());
    health.success("x");
    assert!(health.ensure_runnable("x").is_err());
    assert!(health.release_after_verified_probe("x", false).is_err());
    health.release_after_verified_probe("x", true).unwrap();
    health.ensure_runnable("x").unwrap();
}
struct Echo;
impl ComputeEngine for Echo {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new("graph", "trusted-echo", "v1", &["echo"])
    }
    fn execute(&self, r: &EngineRequest) -> Result<EngineOutput> {
        if r.data == "fail" {
            return Err(Error::Conflict("fixture failure".into()));
        }
        Ok(EngineOutput {
            data: r.data.clone(),
        })
    }
}
#[test]
fn supervisor_tracks_runtime_pins_health_and_mode() {
    let registry = EngineRegistry::new();
    registry.install(Arc::new(Echo), None).unwrap();
    let mut supervisor = CoreSupervisor::new(&registry, CoreConfig::default()).unwrap();
    supervisor.policies.insert(
        "graph".into(),
        EnginePolicy {
            production_ready: true,
            dependencies: vec![req("dictionary", true)],
        },
    );
    assert!(supervisor.readiness("graph").is_err());
    supervisor
        .inventory
        .insert("dictionary".into(), resource("dictionary"));
    supervisor.readiness("graph").unwrap();
    let good = supervisor
        .execute_read_only(
            "graph",
            &EngineRequest {
                operation: "echo".into(),
                data: "ok".into(),
            },
        )
        .unwrap();
    assert_eq!(good.receipt.engine_generation, 1);
    assert_eq!(good.receipt.pinned_resources.len(), 1);
    assert_eq!(good.output.data, "ok");
    for _ in 0..3 {
        assert!(supervisor
            .execute_read_only(
                "graph",
                &EngineRequest {
                    operation: "echo".into(),
                    data: "fail".into()
                }
            )
            .is_err());
    }
    assert_eq!(
        supervisor.health.state("graph").status,
        HealthStatus::Quarantined
    );
    assert!(supervisor.readiness("graph").is_err());
    assert_eq!(supervisor.telemetry.summary("graph").count, 4);
}
