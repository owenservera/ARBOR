use serde_json::{json, Value};
use vivim_absorption::discovery::*;
fn fixture() -> (Scope, Value, String) {
    let id = format!("ev_{}", "a".repeat(64));
    let scope = Scope { site_id: "example".into(), origin: "https://example.com".into() };
    let p = json!({
        "schema":"vivim.studio-craft-intelligence/1", "status":"external-evidence-readonly",
        "target":scope, "source":{"producer":"craft-anything","bundleDigest":null,
            "verificationAuthority":"unattested-external-report","coverage":"bounded-observations-only"},
        "counts":{"evidence":1,"controls":1,"observations":1,"states":0,"unknowns":0},
        "roles":[{"role":"button","count":1}],
        "evidence":[{"evidenceId":id,"operation":"web_page_inspect","confidence":"observed",
            "coverage":"partial","limitations":0,"cleanRoom":true}],
        "authority":{"executionAuthorized":false,"activationPermitted":false,"sendPermission":false}
    });
    (scope,p,id)
}
fn bytes(v: &Value) -> Vec<u8> { serde_json::to_vec(v).unwrap() }

#[test]
fn projection_remains_unattested() {
    let (scope, p, id) = fixture();
    let d = ingest_craft(&bytes(&p), &scope).unwrap();
    assert_eq!(d.source_trust, "unattested-external-report");
    assert_eq!(d.evidence[0].evidence_id, id);
    assert_eq!(d.roles["button"], 1);
    let request = serde_json::to_value(classification_request(&d, &[])).unwrap();
    assert_eq!(request["schema"], "vivim.absorption-classification/1");
}

#[test]
fn rejects_scope_mismatch_and_authority() {
    let (scope, mut p, _) = fixture();
    p["authority"]["sendPermission"] = json!(true);
    assert_eq!(ingest_craft(&bytes(&p), &scope).unwrap_err(), DiscoveryError::InvalidProjection);
    p["authority"]["sendPermission"] = json!(false);
    p["target"]["origin"] = json!("https://other.example");
    assert_eq!(ingest_craft(&bytes(&p), &scope).unwrap_err(), DiscoveryError::ScopeMismatch);
}

#[test]
fn proposal_must_reference_observed_evidence_and_exact_revision() {
    let (scope, p, id) = fixture();
    let d = ingest_craft(&bytes(&p), &scope).unwrap();
    let known = [KnownPrimitive {id:"navigation.open".into(), version:1, description:"Open a route".into()}];
    let mut proposal = json!({"candidates":[{"primitiveId":"navigation.open","version":1,"evidenceIds":[id]}]});
    assert_eq!(accept_proposals(&bytes(&proposal), &d, &known).unwrap().len(), 1);
    proposal["candidates"][0]["version"] = json!(2);
    assert_eq!(accept_proposals(&bytes(&proposal), &d, &known).unwrap_err(), DiscoveryError::InvalidProposal);
    proposal["candidates"][0]["version"] = json!(1);
    proposal["candidates"][0]["evidenceIds"] = json!(["invented"]);
    assert_eq!(accept_proposals(&bytes(&proposal), &d, &known).unwrap_err(), DiscoveryError::InvalidProposal);
}
