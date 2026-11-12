#![cfg(feature = "importer")]
use hqkg::adapters::dependency_manifest::parse_manifest;
#[test]
fn inert_example_parses_without_granting_production_authority() {
    let source = include_str!(
        "../../graph-kernel-integration/contracts/module-dependencies.example.v1.json"
    );
    let parsed = parse_manifest(source.as_bytes()).unwrap();
    assert_eq!(parsed.id, "language:spell");
    assert_eq!(parsed.dependencies.len(), 3);
    assert!(!parsed.declared_production_ready);
    assert!(!parsed.unapproved_engine_policy().production_ready);
}
#[test]
fn untrusted_ready_flag_does_not_grant_authority() {
    let s = r#"{"schema":"hqkg.module-dependencies/1","module":{"id":"m","slot":"m","interface":"test.v1","version":"1.0.0","production_ready":true},"requirements":[]}"#;
    let p = parse_manifest(s.as_bytes()).unwrap();
    assert!(p.declared_production_ready);
    assert!(!p.unapproved_engine_policy().production_ready);
}
#[test]
fn unknown_schema_and_cycle_fail() {
    let body = r#"{"schema":"hqkg.module-dependencies/1","module":{"id":"m","slot":"m","interface":"test.v1","version":"1.0.0","production_ready":false},"requirements":[{"id":"a","kind":"Engine","min_inclusive":"1.0.0","max_exclusive":"2.0.0","required":false,"expected_sha256":null,"after":["b"]},{"id":"b","kind":"Dataset","min_inclusive":"1.0.0","max_exclusive":"2.0.0","required":false,"expected_sha256":null,"after":["a"]}]}"#;
    assert!(parse_manifest(body.as_bytes()).is_err());
    assert!(parse_manifest(
        body.replace("hqkg.module-dependencies/1", "other/7")
            .as_bytes()
    )
    .is_err());
}
