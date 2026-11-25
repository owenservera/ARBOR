use serde_json::json;
use vivim_absorption::{discovery::Scope,store::Inbox,handoff::{Handoff,Candidate}};
#[test]
fn uia_handoff_references_exact_persisted_source(){
    let dir=std::env::temp_dir().join(format!("absorption-uia-test-{}",std::process::id()));
    let _=std::fs::remove_dir_all(&dir);
    let store=Inbox::open(&dir).unwrap();
    let scope=Scope{site_id:"facebook".into(),origin:"https://www.facebook.com".into()};
    let raw=serde_json::to_vec(&json!({"schema":"vivim.facebook-uia-observation/1","site":"facebook",
        "executionAuthorized":false,"privateContentPersisted":false,
        "observations":[{"surface":"messaging","nodes":20,"controls":["test-control"]}]})).unwrap();
    let r=store.ingest_facebook_uia(&raw,&scope).unwrap();
    let id=r["id"].as_str().unwrap();
    let record=store.read(id).unwrap();
    assert_eq!(record["observations"][0]["controlCount"],1);
    assert!(!record.to_string().contains("test-control"));
    let mut h=Handoff{schema:"vivim.absorption-semantic-handoff/1".into(),scope,source_id:id.into(),
        candidates:vec![Candidate{primitive_id:"messaging.conversation.list".into(),surface_id:"messenger".into(),evidence_refs:vec!["uia:0".into()]}]};
    let receipt=store.ingest_handoff(&h).unwrap();
    let result=store.read(receipt["id"].as_str().unwrap()).unwrap();
    assert_eq!(result["status"],"proposed-not-verified");
    h.candidates[0].evidence_refs=vec!["uia:99".into()];
    assert_eq!(store.ingest_handoff(&h).unwrap_err(),"HANDOFF_CANDIDATE_INVALID");
    std::fs::remove_dir_all(dir).unwrap();
}
