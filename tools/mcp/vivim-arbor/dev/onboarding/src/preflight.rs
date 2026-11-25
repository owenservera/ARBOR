//! Pure capability decision: observations supplied by authorized local adapters, never inferred
//! from a website login. No network calls, admin credentials, or browser effects.
#[derive(Clone,Copy,Debug,PartialEq,Eq)]
pub enum Fact { Unknown, Granted, Denied }
#[derive(Clone,Copy,Debug,PartialEq,Eq)]
pub enum Requirement { LinkedWorkspace, CustomMcp, TunnelManage, RestrictedRuntimeKey, TransportPolicy }
#[derive(Clone,Copy,Debug,PartialEq,Eq)]
pub enum Decision { Eligible, Discover(Requirement), NeedsAuthorization(Requirement) }
#[derive(Clone,Copy,Debug,PartialEq,Eq)]
pub struct Entitlement {
    pub linked_workspace: Fact,
    pub custom_mcp: Fact,
    pub tunnel_manage: Fact,
    pub restricted_runtime_key: Fact,
    pub transport_policy: Fact,
}
impl Entitlement {
    pub fn decision(self)->Decision{
        for (requirement,fact) in [
            (Requirement::LinkedWorkspace,self.linked_workspace),
            (Requirement::CustomMcp,self.custom_mcp),
            (Requirement::TunnelManage,self.tunnel_manage),
            (Requirement::RestrictedRuntimeKey,self.restricted_runtime_key),
            (Requirement::TransportPolicy,self.transport_policy),
        ]{match fact{Fact::Unknown=>return Decision::Discover(requirement),Fact::Denied=>return Decision::NeedsAuthorization(requirement),Fact::Granted=>{}}}
        Decision::Eligible
    }
}
#[cfg(test)]
mod tests{
    use super::*;
    fn granted()->Entitlement{Entitlement{linked_workspace:Fact::Granted,custom_mcp:Fact::Granted,tunnel_manage:Fact::Granted,restricted_runtime_key:Fact::Granted,transport_policy:Fact::Granted}}
    #[test]fn all_required(){assert_eq!(granted().decision(),Decision::Eligible);}
    #[test]fn chatgpt_login_is_not_tunnel_manage(){let mut e=granted();e.tunnel_manage=Fact::Unknown;assert_eq!(e.decision(),Decision::Discover(Requirement::TunnelManage));}
    #[test]fn runtime_key_permission_is_distinct(){let mut e=granted();e.restricted_runtime_key=Fact::Denied;assert_eq!(e.decision(),Decision::NeedsAuthorization(Requirement::RestrictedRuntimeKey));}
    #[test]fn incompatible_transport_policy_needs_authorization(){let mut e=granted();e.transport_policy=Fact::Denied;assert_eq!(e.decision(),Decision::NeedsAuthorization(Requirement::TransportPolicy));}
}
