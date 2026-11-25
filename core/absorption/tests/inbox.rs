use serde_json::json;
use vivim_absorption::{discovery::Scope,store::Inbox};
#[test]
fn durable_idempotent_and_integrity_checked() {
    let dir=std::env::temp_dir().join(format!("absorption-inbox-test-{}",std::process::id()));
    let _=std::fs::remove_dir_all(&dir);
    let scope=Scope{site_id:"example".into(),origin:"https://example.com".into()};
    let projection=json!({"schema":"vivim.studio-craft-intelligence/1","status":"external-evidence-readonly",
        "target":scope,"source":{"producer":"craft-anything","bundleDigest":null,
        "verificationAuthority":"unattested-external-report","coverage":"bounded-observations-only"},
        "counts":{"evidence":1,"controls":1,"observations":1,"states":0,"unknowns":0},
        "roles":[{"role":"button","count":1}],"evidence":[{"evidenceId":format!("ev_{}","a".repeat(64)),
        "operation":"web_page_show","confidence":"observed","coverage":"partial","limitations":0,"cleanRoom":true}],
        "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}});
    let bytes=serde_json::to_vec(&projection).unwrap();
    let first=Inbox::open(&dir).unwrap().ingest(&bytes,&scope).unwrap();
    let store=Inbox::open(&dir).unwrap();
    let second=store.ingest(&bytes,&scope).unwrap();
    assert_eq!(first["id"],second["id"]);
    assert_eq!(first["created"],true);assert_eq!(second["created"],false);
    let id=first["id"].as_str().unwrap();
    assert_eq!(store.read(id).unwrap()["discovery"]["scope"]["siteId"],"example");
    assert!(store.read("../outside").is_err());
    std::fs::write(dir.join(format!("{id}.json")),b"corrupt").unwrap();
    assert_eq!(store.read(id).unwrap_err(),"DIGEST_MISMATCH");
    std::fs::remove_dir_all(dir).unwrap();
}
