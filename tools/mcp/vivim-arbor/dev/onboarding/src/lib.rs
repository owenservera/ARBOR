//! Dev-only onboarding transition contract. No provider, browser, or process effects here.
//! Host owns durable claims, actual evidence collection, secure storage and execution.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Step {
    Entitlement, ProvisionPrivateTunnel, StoreRuntimeCredential, VerifyClient,
    StartHealthOnlyRuntime, ConnectChatGptPlugin, VerifyRemoteHealth,
    EnableOwnerScope, RefreshTools, VerifyRemoteCapability, PairPhone, VerifyPhone,
}
const STEPS: [Step; 12] = [
    Step::Entitlement, Step::ProvisionPrivateTunnel, Step::StoreRuntimeCredential,
    Step::VerifyClient, Step::StartHealthOnlyRuntime, Step::ConnectChatGptPlugin,
    Step::VerifyRemoteHealth, Step::EnableOwnerScope, Step::RefreshTools,
    Step::VerifyRemoteCapability, Step::PairPhone, Step::VerifyPhone,
];
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Binding {
    pub development_instance: String,
    pub device: String,
    pub account: String,
    pub workspace: String,
}
fn valid_id(s: &str) -> bool {
    !s.is_empty() && s.len() <= 128 &&
        s.bytes().all(|b| b.is_ascii_alphanumeric() || b"_-.".contains(&b))
}
impl Binding {
    fn valid(&self) -> bool {
        self.development_instance.starts_with("dev-") &&
        [&self.development_instance, &self.device, &self.account, &self.workspace]
            .into_iter().all(|s| valid_id(s))
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Outcome {
    Verified, // only a trusted Host adapter may construct a verified observation
    NeedsUserAuthorization,
    Unavailable,
    Unknown, // never replay an effect whose result is unknown
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EvidenceKind {
    AccountEntitlement, PrivateTunnelIdentity, ProtectedCredentialReference,
    PinnedClientIntegrity, LocalHealthOnly, PluginIdentity, RemoteHealthChallenge,
    HostOwnerScope, RefreshedCatalogue, RemoteCapabilityChallenge,
    AuthenticatedPhonePairing, PhoneChallenge,
}
impl Step {
    fn evidence(self) -> EvidenceKind {
        use EvidenceKind::*;
        match self {
            Self::Entitlement => AccountEntitlement,
            Self::ProvisionPrivateTunnel => PrivateTunnelIdentity,
            Self::StoreRuntimeCredential => ProtectedCredentialReference,
            Self::VerifyClient => PinnedClientIntegrity,
            Self::StartHealthOnlyRuntime => LocalHealthOnly,
            Self::ConnectChatGptPlugin => PluginIdentity,
            Self::VerifyRemoteHealth => RemoteHealthChallenge,
            Self::EnableOwnerScope => HostOwnerScope,
            Self::RefreshTools => RefreshedCatalogue,
            Self::VerifyRemoteCapability => RemoteCapabilityChallenge,
            Self::PairPhone => AuthenticatedPhonePairing,
            Self::VerifyPhone => PhoneChallenge,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Claim {
    pub step: Step,
    pub operation: String,
    pub binding: Binding,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Observation {
    pub claim: Claim,
    pub kind: EvidenceKind,
    pub outcome: Outcome,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Status { Offered, Skipped, InProgress, AwaitingAuthorization, Unavailable, Reconcile, Ready, Revoked }
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Error { InvalidBinding, InvalidOperation, InvalidState, ClaimPending, WrongClaim, WrongEvidence, ReusedOperation }
#[derive(Debug)]
pub struct Setup {
    binding: Binding,
    status: Status,
    cursor: usize,
    pending: Option<Claim>,
    used: Vec<String>,
}
impl Setup {
    pub fn new(binding: Binding) -> Result<Self, Error> {
        if !binding.valid() { return Err(Error::InvalidBinding); }
        Ok(Self { binding, status: Status::Offered, cursor: 0, pending: None, used: Vec::new() })
    }
    pub fn status(&self) -> Status { self.status }
    pub fn next_step(&self) -> Option<Step> {
        if self.status == Status::InProgress && self.pending.is_none() { STEPS.get(self.cursor).copied() } else { None }
    }
    pub fn pending(&self) -> Option<&Claim> { self.pending.as_ref() }
    pub fn enable(&mut self) -> Result<(), Error> {
        if !matches!(self.status, Status::Offered | Status::Skipped) { return Err(Error::InvalidState); }
        self.status = Status::InProgress;
        Ok(())
    }
    pub fn skip(&mut self) -> Result<(), Error> {
        if self.status != Status::Offered { return Err(Error::InvalidState); }
        self.status = Status::Skipped; Ok(())
    }
    pub fn claim(&mut self, operation: String) -> Result<Claim, Error> {
        if self.pending.is_some() { return Err(Error::ClaimPending); }
        let step = self.next_step().ok_or(Error::InvalidState)?;
        if operation.len() != 32 || !operation.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
            return Err(Error::InvalidOperation);
        }
        if self.used.contains(&operation) { return Err(Error::ReusedOperation); }
        let claim = Claim { step, operation, binding: self.binding.clone() };
        self.used.push(claim.operation.clone());
        self.pending = Some(claim.clone()); Ok(claim)
    }
    pub fn observe(&mut self, observation: Observation) -> Result<(), Error> {
        if self.pending.as_ref() != Some(&observation.claim) { return Err(Error::WrongClaim); }
        if observation.kind != observation.claim.step.evidence() { return Err(Error::WrongEvidence); }
        if !matches!(self.status, Status::InProgress | Status::Reconcile | Status::AwaitingAuthorization | Status::Unavailable) {
            return Err(Error::InvalidState);
        }
        match observation.outcome {
            Outcome::Verified => {
                self.pending = None;
                self.cursor += 1;
                self.status = if self.cursor == STEPS.len() { Status::Ready } else { Status::InProgress };
            }
            Outcome::NeedsUserAuthorization => self.status = Status::AwaitingAuthorization,
            Outcome::Unavailable => self.status = Status::Unavailable,
            Outcome::Unknown => self.status = Status::Reconcile,
        }
        Ok(())
    }
    /// Only after a trusted adapter has positively established that the claimed effect never
    /// happened (not a timeout) and the operator has authorized another attempt.
    pub fn confirm_not_applied(&mut self, claim: &Claim) -> Result<(), Error> {
        if self.pending.as_ref() != Some(claim) { return Err(Error::WrongClaim); }
        if !matches!(self.status, Status::Reconcile | Status::AwaitingAuthorization | Status::Unavailable) {
            return Err(Error::InvalidState);
        }
        self.pending = None;
        self.status = Status::InProgress; Ok(())
    }
    /// Local admission must be closed before this state is recorded by the Host.
    pub fn revoke(&mut self) { self.status = Status::Revoked; self.pending = None; }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn binding() -> Binding { Binding { development_instance:"dev-onboarding-1".into(), device:"device-1".into(), account:"account-1".into(), workspace:"workspace-1".into() } }
    fn setup() -> Setup { let mut s=Setup::new(binding()).unwrap(); s.enable().unwrap(); s }
    fn claim(s: &mut Setup, n: usize) -> Claim { s.claim(format!("{n:032x}")).unwrap() }
    fn observe(s: &mut Setup, c: Claim, outcome: Outcome) { let kind=c.step.evidence(); s.observe(Observation{claim:c,kind,outcome}).unwrap(); }
    #[test] fn opt_in_and_skip() { let mut s=Setup::new(binding()).unwrap();assert_eq!(s.next_step(),None);s.skip().unwrap();assert_eq!(s.next_step(),None);s.enable().unwrap();assert_eq!(s.next_step(),Some(Step::Entitlement)); }
    #[test] fn rejects_production_namespace() { let mut b=binding();b.development_instance="production".into();assert_eq!(Setup::new(b).unwrap_err(),Error::InvalidBinding); }
    #[test] fn all_verified_in_order() { let mut s=setup();for (i,step) in STEPS.iter().enumerate(){assert_eq!(s.next_step(),Some(*step));let c=claim(&mut s,i+1);observe(&mut s,c,Outcome::Verified);}assert_eq!(s.status(),Status::Ready);assert_eq!(s.next_step(),None); }
    #[test] fn entitlement_blocked_without_replay() { let mut s=setup();let c=claim(&mut s,1);observe(&mut s,c.clone(),Outcome::NeedsUserAuthorization);assert_eq!(s.status(),Status::AwaitingAuthorization);assert_eq!(s.next_step(),None);assert_eq!(s.claim("00000000000000000000000000000002".into()),Err(Error::ClaimPending));observe(&mut s,c,Outcome::Verified);assert_eq!(s.next_step(),Some(Step::ProvisionPrivateTunnel)); }
    #[test] fn unknown_effect_never_replayed() { let mut s=setup();let c=claim(&mut s,1);observe(&mut s,c.clone(),Outcome::Unknown);assert_eq!(s.status(),Status::Reconcile);assert_eq!(s.next_step(),None);observe(&mut s,c,Outcome::Verified);assert_eq!(s.next_step(),Some(Step::ProvisionPrivateTunnel)); }
    #[test] fn proven_nonapplication_allows_new_operation_only() { let mut s=setup();let c=claim(&mut s,1);observe(&mut s,c.clone(),Outcome::Unknown);s.confirm_not_applied(&c).unwrap();assert_eq!(s.claim(c.operation),Err(Error::ReusedOperation));let c2=claim(&mut s,2);assert_eq!(c2.step,Step::Entitlement); }
    #[test] fn foreign_account_and_operation_rejected() { let mut s=setup();let c=claim(&mut s,1);let mut wrong=c.clone();wrong.binding.account="other".into();assert_eq!(s.observe(Observation{claim:wrong,kind:EvidenceKind::AccountEntitlement,outcome:Outcome::Verified}),Err(Error::WrongClaim));let mut wrong=c;wrong.operation="00000000000000000000000000000002".into();assert_eq!(s.observe(Observation{claim:wrong,kind:EvidenceKind::AccountEntitlement,outcome:Outcome::Verified}),Err(Error::WrongClaim)); }
    #[test] fn local_health_cannot_prove_remote_health() { let mut s=setup();for i in 1..=6{let c=claim(&mut s,i);observe(&mut s,c,Outcome::Verified);}let c=claim(&mut s,7);assert_eq!(c.step,Step::VerifyRemoteHealth);assert_eq!(s.observe(Observation{claim:c,kind:EvidenceKind::LocalHealthOnly,outcome:Outcome::Verified}),Err(Error::WrongEvidence)); }
    #[test] fn phone_pairing_not_phone_acceptance() { let mut s=setup();for i in 1..=11{let c=claim(&mut s,i);observe(&mut s,c,Outcome::Verified);}assert_eq!(s.status(),Status::InProgress);assert_eq!(s.next_step(),Some(Step::VerifyPhone)); }
    #[test] fn revoke_rejects_late_evidence() { let mut s=setup();let c=claim(&mut s,1);s.revoke();assert_eq!(s.status(),Status::Revoked);assert_eq!(s.next_step(),None);assert_eq!(s.observe(Observation{claim:c,kind:EvidenceKind::AccountEntitlement,outcome:Outcome::Verified}),Err(Error::WrongClaim)); }
    #[test] fn invalid_operation_refused() { let mut s=setup();assert_eq!(s.claim("not-a-claim".into()),Err(Error::InvalidOperation));assert_eq!(s.next_step(),Some(Step::Entitlement)); }
}
