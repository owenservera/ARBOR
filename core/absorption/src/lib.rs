//! R001: semantic substrate only. No browser I/O or effect authority.
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Revision { pub id: String, pub version: u32 }

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Effect { Read, Mutate, External, Unknown }

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Contract {
    pub input_schema: String,
    pub output_schema: String,
    pub effect: Effect,
    pub invariants: BTreeSet<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Primitive {
    pub revision: Revision,
    pub contract: Contract,
    pub description: String,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Relation { Specializes, Composes, Related, Extension(String) }

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Edge { pub from: Revision, pub relation: Relation, pub to: Revision }

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Confidence { Observed, Derived, Inferred, Unknown }

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EvidenceRef {
    pub id: String,
    pub origin: String,
    pub confidence: Confidence,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Binding {
    pub application: String,
    pub origin: String,
    pub primitive: Revision,
    pub contract: Contract,
    pub adapter_revision: Revision,
    pub host_capability: String,
    pub evidence: Vec<EvidenceRef>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Error {
    InvalidRevision, EmptyField, ConflictingRevision, MissingPrimitive,
    InvalidEdge, ContractMismatch, MissingObservation, OriginMismatch,
    InvalidTransition, DuplicateTarget, MissingTarget,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Match { Exact(Vec<Revision>), Novel }

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Candidate(Binding);
impl Candidate {
    pub fn binding(&self) -> &Binding { &self.0 }
    /// Discovery can never confer execution authority.
    pub fn execution_authorized(&self) -> bool { false }
}

#[derive(Default)]
pub struct Registry {
    primitives: BTreeMap<Revision, Primitive>,
    edges: BTreeSet<Edge>,
}

fn nonempty(s: &str) -> bool { !s.trim().is_empty() }

fn valid_revision(r: &Revision) -> bool {
    r.version > 0 && r.id.split('.').count() >= 2 &&
        r.id.split('.').all(|p| !p.is_empty() &&
            p.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_' || b == b'-'))
}

fn valid_contract(c: &Contract) -> bool {
    nonempty(&c.input_schema) && nonempty(&c.output_schema) &&
        c.invariants.iter().all(|x| nonempty(x))
}

impl Registry {
    pub fn insert(&mut self, primitive: Primitive) -> Result<(), Error> {
        if !valid_revision(&primitive.revision) { return Err(Error::InvalidRevision); }
        if !valid_contract(&primitive.contract) || !nonempty(&primitive.description) {
            return Err(Error::EmptyField);
        }
        if let Some(old) = self.primitives.get(&primitive.revision) {
            return if old == &primitive { Ok(()) } else { Err(Error::ConflictingRevision) };
        }
        self.primitives.insert(primitive.revision.clone(), primitive);
        Ok(())
    }

    pub fn get(&self, revision: &Revision) -> Option<&Primitive> {
        self.primitives.get(revision)
    }

    pub fn link(&mut self, edge: Edge) -> Result<(), Error> {
        if !self.primitives.contains_key(&edge.from) || !self.primitives.contains_key(&edge.to) {
            return Err(Error::MissingPrimitive);
        }
        if edge.from == edge.to ||
            matches!(&edge.relation, Relation::Extension(s) if !nonempty(s)) {
            return Err(Error::InvalidEdge);
        }
        // Specialization must be acyclic; composition and related edges may cycle.
        if edge.relation == Relation::Specializes {
            let mut pending = vec![edge.to.clone()];
            let mut seen = BTreeSet::new();
            while let Some(current) = pending.pop() {
                if current == edge.from { return Err(Error::InvalidEdge); }
                if seen.insert(current.clone()) {
                    pending.extend(self.edges.iter().filter(|e|
                        e.relation == Relation::Specializes && e.from == current
                    ).map(|e| e.to.clone()));
                }
            }
        }
        self.edges.insert(edge);
        Ok(())
    }

    /// Exact structural equality only. Matching is a proposal, not proof of behavior.
    pub fn propose(&self, contract: &Contract) -> Match {
        let matches: Vec<_> = self.primitives.values()
            .filter(|p| &p.contract == contract)
            .map(|p| p.revision.clone()).collect();
        if matches.is_empty() { Match::Novel } else { Match::Exact(matches) }
    }

    pub fn candidate(&self, binding: Binding) -> Result<Candidate, Error> {
        let p = self.get(&binding.primitive).ok_or(Error::MissingPrimitive)?;
        if p.contract != binding.contract { return Err(Error::ContractMismatch); }
        if !valid_revision(&binding.adapter_revision) { return Err(Error::InvalidRevision); }
        if !nonempty(&binding.application) || !nonempty(&binding.origin) ||
            !nonempty(&binding.host_capability) { return Err(Error::EmptyField); }
        if binding.evidence.iter().any(|e| e.origin != binding.origin) {
            return Err(Error::OriginMismatch);
        }
        if binding.evidence.iter().any(|e| !nonempty(&e.id)) {
            return Err(Error::EmptyField);
        }
        if !binding.evidence.iter().any(|e| e.confidence == Confidence::Observed) {
            return Err(Error::MissingObservation);
        }
        Ok(Candidate(binding))
    }

    pub fn primitives(&self) -> impl Iterator<Item = &Primitive> {
        self.primitives.values()
    }

    pub fn edges(&self) -> impl Iterator<Item = &Edge> { self.edges.iter() }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Stage { Queued, Discovering, Observed, Classified, Packaged, Failed, Cancelled }

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Target {
    pub application: String,
    pub origin: String,
    pub wave: u8,
    pub provenance: String,
    pub stage: Stage,
}

#[derive(Default)]
pub struct Queue { targets: BTreeMap<String, Target> }
impl Queue {
    pub fn enqueue(&mut self, application: String, origin: String, wave: u8,
        provenance: String) -> Result<(), Error> {
        if !nonempty(&application) || !nonempty(&origin) || !nonempty(&provenance)
            || !(1..=10).contains(&wave) { return Err(Error::EmptyField); }
        if self.targets.contains_key(&application) ||
            self.targets.values().any(|t| t.origin == origin) {
            return Err(Error::DuplicateTarget);
        }
        self.targets.insert(application.clone(), Target {
            application, origin, wave, provenance, stage: Stage::Queued
        });
        Ok(())
    }
    pub fn transition(&mut self, application: &str, next: Stage) -> Result<(), Error> {
        use Stage::*;
        let target = self.targets.get_mut(application).ok_or(Error::MissingTarget)?;
        if !matches!((&target.stage, &next),
            (Queued, Discovering) | (Discovering, Observed) | (Observed, Classified) |
            (Classified, Packaged) | (Failed, Queued) |
            (Queued | Discovering | Observed | Classified, Failed | Cancelled)) {
            return Err(Error::InvalidTransition);
        }
        target.stage = next;
        Ok(())
    }
    pub fn get(&self, application: &str) -> Option<&Target> { self.targets.get(application) }
    pub fn targets(&self) -> impl Iterator<Item = &Target> { self.targets.values() }
}

pub mod discovery;

pub mod store;

pub mod uia;

pub mod handoff;
