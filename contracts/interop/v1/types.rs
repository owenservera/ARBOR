//! Wave 1F pure contract mirror. Not linked into Cargo yet (Lane A/G ownership).
//! No authorization, source identity minting, receipt writing or I/O here.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SourceDomain { Development, Personal, Control, Ui }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceRef { pub id: String, pub domain: SourceDomain, pub owner_ref: Option<String>, pub revision: u64 }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Confidence { Rule, AcceptedPattern, SourceObserved, ModelProposed }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EvidenceRef { pub source: SourceRef, pub digest: String, pub confidence: Confidence }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventKind { Draft, Accept, Submit, Cancel, Approve, Receipt, Observation }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RevisionEvent { pub event_id: String, pub kind: EventKind, pub source: SourceRef, pub expected_revision: u64 }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostRisk { R0, R1, R2, R3 }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapabilityRef { pub id: String, pub owner: String, pub risk: Option<HostRisk>, pub source: SourceRef }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostJournalState { Planned, Approved, Uncertain, Applied, Failed }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewStatus { Candidate, Grounded, Ambiguous, Stale, Unavailable }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InertViewProjection { pub source: SourceRef, pub status: ViewStatus, pub actions: Vec<String> }
#[cfg(test)]
mod tests {
 use super::*;
 #[test] fn status_is_not_a_grant() {
   assert_ne!(HostJournalState::Uncertain, HostJournalState::Applied);
   assert_ne!(ViewStatus::Candidate, ViewStatus::Grounded);
 }
}
