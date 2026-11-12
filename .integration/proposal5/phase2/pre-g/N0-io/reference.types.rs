//! PRE-G inert type mirror; not compiled or linked into Cargo. No duplicate scheduler or graph.
#[derive(Clone,Debug,PartialEq,Eq)]
pub enum SourceDomain { Development, Personal, Control, Ui }
#[derive(Clone,Debug,PartialEq,Eq)]
pub enum Confidence { Grounded, Tentative, Unknown }
#[derive(Clone,Debug,PartialEq,Eq)]
pub enum InputKind { DraftChanged, Submit, VoicePartial, VoiceFinal, Select, EditStructured, Attach, Approve, Reject, Cancel, Correct, FocusChanged, OfflineDraftReconcile }
#[derive(Clone,Debug,PartialEq,Eq)]
pub struct SourceRef { pub id:String, pub domain:SourceDomain, pub owner_ref:Option<String>, pub revision:u64 }
#[derive(Clone,Debug,PartialEq,Eq)]
pub struct GraphemeSafeSpan { pub scalar_start:usize, pub scalar_end:usize }
#[derive(Clone,Debug,PartialEq,Eq)]
pub struct InertInput {pub event_id:String,pub session_id:String,pub surface_id:String,pub kind:InputKind,pub sequence:u64,pub input_revision:u64,pub interaction_revision:u64,pub expected_revision:u64,pub text:Option<String>,pub span:Option<GraphemeSafeSpan>,pub source_refs:Vec<SourceRef>,pub audience:String,pub policy_version:String,pub engine_version:String,pub idempotency_key:Option<String>,pub content_digest:Option<String>}
#[derive(Clone,Debug,PartialEq,Eq)]
pub struct DerivedEvidence {pub derivation_id:String,pub reactor_id:String,pub input_revision:u64,pub graph_epoch:u64,pub engine_generation:u64,pub audience:String,pub source_ref:SourceRef,pub confidence:Confidence,pub input_refs:Vec<String>,pub ttl_revisions:u8,pub cancelled:bool}
/// Bound Actor from a verified Host/Tauri transport context, never from InertInput.
/// Intentionally absent: executable actions, permissions, Host claims and grants.
