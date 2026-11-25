use std::collections::BTreeSet;
use vivim_absorption::*;

fn rev(id: &str) -> Revision { Revision { id: id.into(), version: 1 } }
fn contract() -> Contract {
    Contract { input_schema: "message.input@1".into(),
        output_schema: "message.receipt@1".into(), effect: Effect::External,
        invariants: BTreeSet::from(["explicit-recipient".into()]) }
}
fn primitive(id: &str, c: Contract) -> Primitive {
    Primitive { revision: rev(id), contract: c, description: id.into() }
}
fn binding(app: &str, origin: &str) -> Binding {
    Binding { application: app.into(), origin: origin.into(),
        primitive: rev("messaging.send"), contract: contract(),
        adapter_revision: rev("adapter.send"), host_capability: "host.message.send".into(),
        evidence: vec![EvidenceRef { id: "test-observation".into(), origin: origin.into(),
            confidence: Confidence::Observed }] }
}

// These are synthetic unit fixtures, not claims of live provider integration.
#[test]
fn multiple_applications_share_one_primitive_without_authority() {
    let mut r = Registry::default();
    r.insert(primitive("messaging.send", contract())).unwrap();
    for (app, origin) in [("facebook", "https://www.facebook.com"),
                         ("whatsapp", "https://web.whatsapp.com")] {
        let c = r.candidate(binding(app, origin)).unwrap();
        assert_eq!(c.binding().primitive, rev("messaging.send"));
        assert!(!c.execution_authorized());
    }
    assert_eq!(r.primitives().count(), 1);
    assert_eq!(r.propose(&contract()), Match::Exact(vec![rev("messaging.send")]));
}

#[test]
fn novel_contract_and_ambiguous_matches_are_preserved() {
    let mut r = Registry::default();
    r.insert(primitive("messaging.send", contract())).unwrap();
    let mut novel = contract();
    novel.invariants.insert("expiration".into());
    assert_eq!(r.propose(&novel), Match::Novel);
    r.insert(primitive("messaging.ephemeral", novel)).unwrap();
    r.insert(primitive("other.send", contract())).unwrap();
    assert_eq!(r.propose(&contract()), Match::Exact(vec![rev("messaging.send"), rev("other.send")]));
    r.link(Edge { from: rev("messaging.ephemeral"), relation: Relation::Specializes,
        to: rev("messaging.send") }).unwrap();
    assert_eq!(r.link(Edge { from: rev("messaging.send"), relation: Relation::Specializes,
        to: rev("messaging.ephemeral") }), Err(Error::InvalidEdge));
    assert_eq!(r.edges().count(), 1);
}

#[test]
fn revision_is_immutable_and_evidence_is_scoped() {
    let mut r = Registry::default();
    let p = primitive("messaging.send", contract());
    r.insert(p.clone()).unwrap();
    r.insert(p.clone()).unwrap();
    let mut changed = p;
    changed.description = "changed".into();
    assert_eq!(r.insert(changed), Err(Error::ConflictingRevision));
    let mut b = binding("app", "https://example.com");
    b.evidence[0].confidence = Confidence::Inferred;
    assert_eq!(r.candidate(b.clone()), Err(Error::MissingObservation));
    b.evidence[0].confidence = Confidence::Observed;
    b.evidence[0].origin = "https://other.example".into();
    assert_eq!(r.candidate(b.clone()), Err(Error::OriginMismatch));
    b.contract.effect = Effect::Read;
    assert_eq!(r.candidate(b), Err(Error::ContractMismatch));
}

#[test]
fn queue_disallows_duplicate_origins_and_skipped_stages() {
    let mut q = Queue::default();
    q.enqueue("a".into(), "https://example.com".into(), 1, "fixture".into()).unwrap();
    assert_eq!(q.enqueue("b".into(), "https://example.com".into(), 2, "fixture".into()), Err(Error::DuplicateTarget));
    assert_eq!(q.transition("a", Stage::Packaged), Err(Error::InvalidTransition));
    q.transition("a", Stage::Discovering).unwrap();
    q.transition("a", Stage::Failed).unwrap();
    q.transition("a", Stage::Queued).unwrap();
    for s in [Stage::Discovering, Stage::Observed, Stage::Classified, Stage::Packaged] {
        q.transition("a", s).unwrap();
    }
    assert_eq!(q.get("a").unwrap().stage, Stage::Packaged);
}
