use hqkg::control::*;
use hqkg::{EngineRegistry, EngineRequest};
#[test]
fn bounded_telemetry_exports_only_structured_labels_and_no_payload() {
    let mut t = Telemetry::new(16).unwrap();
    assert!(t
        .emit(MetricEvent {
            sequence: 0,
            slot: "prompt secret".into(),
            operation: "text".into(),
            outcome: Outcome::Success,
            elapsed_ms: 1,
            generation: None,
            config_revision: 1
        })
        .is_err());
    t.emit(MetricEvent {
        sequence: 0,
        slot: "graph:main".into(),
        operation: "path".into(),
        outcome: Outcome::Success,
        elapsed_ms: 12,
        generation: Some(3),
        config_revision: 4,
    })
    .unwrap();
    let mut body = Vec::new();
    t.export_tsv(&mut body).unwrap();
    let payload = String::from_utf8(body).unwrap();
    assert!(payload.starts_with("hqkg.telemetry/1"));
    assert!(payload.contains("graph:main\tpath\tsuccess\t12\t3\t4"));
    assert!(!payload.contains("prompt secret"));
}
#[test]
fn preflight_dependency_rejection_is_recorded_without_execution() {
    let registry = EngineRegistry::new();
    let mut sup = CoreSupervisor::new(&registry, CoreConfig::default()).unwrap();
    let req = EngineRequest {
        operation: "query".into(),
        data: "SENSITIVE USER INPUT".into(),
    };
    assert!(sup.execute_read_only("unregistered", &req).is_err());
    assert_eq!(sup.telemetry.summary("unregistered").count, 1);
    assert_eq!(
        sup.telemetry.events().next().unwrap().outcome,
        Outcome::Rejected
    );
    let mut body = Vec::new();
    sup.telemetry.export_tsv(&mut body).unwrap();
    assert!(!String::from_utf8(body)
        .unwrap()
        .contains("SENSITIVE USER INPUT"));
}
