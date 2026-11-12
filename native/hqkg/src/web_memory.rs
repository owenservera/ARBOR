//! @hq:context Incremental, source-grounded, metadata-only web observations in the existing HQKG graph.
//! @hq:owner repos-hq
//! @hq:invariant Acknowledgements follow durable writes; this module never controls a browser.
use crate::{Edge, Error, Graph, Journal, Node, NodeKind, Result};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

pub const INPUT_SCHEMA: &str = "vivim.browser-companion/1";
pub const QUERY_SCHEMA: &str = "vivim.web-memory-query/1";
pub const ACK_SCHEMA: &str = "vivim.browser-companion-ack/1";
/// Durable tombstone schema written beside a revoked visit.
pub const REVOCATION_SCHEMA: &str = "vivim.web-memory-revocation/1";
/// Node id prefix of an observed web visit.
pub const VISIT_PREFIX: &str = "web:visit:";
/// Node id prefix of a revocation tombstone.
pub const REVOCATION_PREFIX: &str = "web:revocation:";
/// Ownership marker every browser-companion visit carries.
pub const VISIT_SOURCE: &str = "vivim.browser-companion";
pub const MAX_BATCH: usize = 32;
pub const MAX_BODY: usize = 64 * 1024;
/// Upper bound for the operator-supplied revocation reason.
pub const MAX_REASON: usize = 240;

fn field<'a>(v: &'a Value, key: &str, max: usize) -> Result<&'a str> {
    let s = v
        .get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| Error::Invalid(format!("missing {key}")))?;
    if s.is_empty() || s.len() > max || s.chars().any(char::is_control) {
        return Err(Error::Invalid(format!("invalid {key}")));
    }
    Ok(s)
}
fn uuid(s: &str) -> bool {
    s.len() == 36
        && s.bytes().enumerate().all(|(i, c)| {
            if [8, 13, 18, 23].contains(&i) {
                c == b'-'
            } else {
                c.is_ascii_hexdigit()
            }
        })
}
pub fn valid_site(s: &str) -> bool {
    if s.len() > 253 || !s.contains('.') || s.ends_with(".local") || s.ends_with(".internal") {
        return false;
    }
    let labels = s.split('.').collect::<Vec<_>>();
    labels
        .last()
        .map_or(false, |x| x.bytes().any(|c| c.is_ascii_lowercase()))
        && labels.iter().all(|p| {
            !p.is_empty()
                && p.len() <= 63
                && !p.starts_with('-')
                && !p.ends_with('-')
                && p.bytes()
                    .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        })
}
fn private_site(host: &str) -> bool {
    const PRIVATE: &[&str] = &[
        "chatgpt.com",
        "openai.com",
        "claude.ai",
        "google.com",
        "whatsapp.com",
        "facebook.com",
        "instagram.com",
        "x.com",
        "twitter.com",
        "paypal.com",
        "stripe.com",
        "github.com",
    ];
    PRIVATE
        .iter()
        .any(|x| host == *x || host.ends_with(&format!(".{x}")))
        || host.starts_with("mail.")
        || host == "bank"
        || host.ends_with(".bank")
        || host.ends_with(".banking")
}
fn safe_path(path: &str) -> bool {
    if path == "/" {
        return true;
    }
    if !path.starts_with('/') || path.len() > 450 || path.contains('%') {
        return false;
    }
    let parts = path
        .split('/')
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>();
    if parts.len() > 8 {
        return false;
    }
    const PRIVATE: &[&str] = &[
        "account",
        "accounts",
        "auth",
        "authorize",
        "billing",
        "checkout",
        "chat",
        "chats",
        "c",
        "conversation",
        "conversations",
        "dashboard",
        "inbox",
        "login",
        "messages",
        "oauth",
        "payment",
        "payments",
        "private",
        "profile",
        "settings",
        "signin",
        "signup",
        "token",
        "user",
        "users",
        "api",
        "reset",
        "verify",
        "invite",
        "invitations",
        "callback",
        "order",
        "orders",
        "cart",
        "wallet",
        "transactions",
    ];
    const SECRET: &[&str] = &[
        "token",
        "secret",
        "session",
        "password",
        "passwd",
        "credential",
        "signature",
        "api-key",
        "api_key",
        "apikey",
        "bearer",
        "jwt",
        "authorization",
        "access-key",
        "access_key",
        "accesskey",
    ];
    for part in parts {
        let lower = part.to_ascii_lowercase();
        if part == "."
            || part == ".."
            || part.len() > 48
            || !part
                .as_bytes()
                .first()
                .map_or(false, |b| b.is_ascii_alphanumeric())
            || !part
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._~-".contains(&b))
            || PRIVATE.contains(&lower.as_str())
            || SECRET.iter().any(|s| lower.contains(s))
        {
            return false;
        }
        let mut digits = 0;
        let mut hex = 0;
        for b in part.bytes() {
            digits = if b.is_ascii_digit() { digits + 1 } else { 0 };
            hex = if b.is_ascii_hexdigit() { hex + 1 } else { 0 };
            if digits >= 6 || hex >= 16 {
                return false;
            }
        }
    }
    true
}
pub fn valid_url(host: &str, s: &str) -> bool {
    if s.len() > 1024
        || s.contains('?')
        || s.contains('#')
        || s.contains('@')
        || s.contains('\\')
        || s.bytes().any(|b| b < 32 || b == 127)
    {
        return false;
    }
    let Some(rest) = s
        .strip_prefix("https://")
        .or_else(|| s.strip_prefix("http://"))
    else {
        return false;
    };
    let Some(path) = rest.strip_prefix(host) else {
        return false;
    };
    (path.is_empty() || (safe_path(path) && (!private_site(host) || path == "/")))
        && (path.is_empty() || path.starts_with('/'))
}
pub fn valid_time(s: &str) -> bool {
    let b = s.as_bytes();
    if b.len() != 24
        || ![4, 7, 10, 13, 16, 19, 23]
            .iter()
            .zip([b'-', b'-', b'T', b':', b':', b'.', b'Z'])
            .all(|(i, x)| b[*i] == x)
    {
        return false;
    }
    if b.iter()
        .enumerate()
        .any(|(i, c)| ![4, 7, 10, 13, 16, 19, 23].contains(&i) && !c.is_ascii_digit())
    {
        return false;
    }
    let n = |start: usize, end: usize| s[start..end].parse::<u32>().unwrap_or(9999);
    let year = n(0, 4);
    let month = n(5, 7);
    let day = n(8, 10);
    let hour = n(11, 13);
    let minute = n(14, 16);
    let second = n(17, 19);
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if leap {
                29
            } else {
                28
            }
        }
        _ => 0,
    };
    year > 0 && day > 0 && day <= days && hour <= 23 && minute <= 59 && second <= 59
}
fn sha(text: &str) -> String {
    format!("{:x}", Sha256::digest(text.as_bytes()))
}
fn event_digest(v: &Visit) -> String {
    let mut hasher = Sha256::new();
    for item in [
        &v.installation,
        &v.session,
        &v.id,
        &v.at,
        &v.site,
        &v.url,
        &v.tab,
    ] {
        hasher.update((item.len() as u64).to_le_bytes());
        hasher.update(item.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}
#[derive(Clone, Debug)]
pub struct Visit {
    pub id: String,
    pub installation: String,
    pub session: String,
    pub at: String,
    pub site: String,
    pub url: String,
    pub tab: String,
    pub digest: String,
}
pub fn parse_batch(raw: &[u8]) -> Result<Vec<Visit>> {
    if raw.is_empty() || raw.len() > MAX_BODY {
        return Err(Error::Invalid("web feed batch too large".into()));
    }
    let body: Value = serde_json::from_slice(raw).map_err(|e| Error::Invalid(e.to_string()))?;
    if field(&body, "schema", 80)? != INPUT_SCHEMA {
        return Err(Error::Invalid("invalid web feed schema".into()));
    }
    let installation = field(&body, "installationId", 64)?;
    let session = field(&body, "sessionId", 64)?;
    if !uuid(installation) || !uuid(session) {
        return Err(Error::Invalid("invalid installation/session ID".into()));
    }
    let events = body
        .get("events")
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid("missing events".into()))?;
    if events.is_empty() || events.len() > MAX_BATCH {
        return Err(Error::Invalid("invalid event count".into()));
    }
    let mut visits = Vec::with_capacity(events.len());
    for event in events {
        if field(event, "type", 32)? != "visit.observed" {
            return Err(Error::Invalid("not a web visit".into()));
        }
        let id = field(event, "id", 64)?;
        if !uuid(id) {
            return Err(Error::Invalid("invalid event ID".into()));
        }
        let at = field(event, "at", 48)?;
        if !valid_time(at) {
            return Err(Error::Invalid("invalid observation time".into()));
        }
        let page = event
            .get("page")
            .ok_or_else(|| Error::Invalid("missing page".into()))?;
        let site = field(page, "site", 253)?;
        let url = field(page, "url", 1024)?;
        if !valid_site(site) || !valid_url(site, url) {
            return Err(Error::Invalid("unsafe web location".into()));
        }
        let tab = page
            .get("browserTabId")
            .and_then(Value::as_u64)
            .filter(|n| *n <= i32::MAX as u64)
            .ok_or_else(|| Error::Invalid("invalid tab ID".into()))?;
        let mut v = Visit {
            id: id.into(),
            installation: installation.into(),
            session: session.into(),
            at: at.into(),
            site: site.into(),
            url: url.into(),
            tab: tab.to_string(),
            digest: String::new(),
        };
        v.digest = event_digest(&v);
        visits.push(v);
    }
    Ok(visits)
}
fn visit_id(v: &Visit) -> String {
    visit_node_id(&v.installation, &v.id)
}

/// Shared key space of a visit node and its revocation tombstone:
/// `<installation>:<event id>`. Both are scoped by the owning installation.
fn web_key(installation: &str, event: &str) -> String {
    format!("{}:{}", installation, event)
}
fn visit_node_id(installation: &str, event: &str) -> String {
    format!("{}{}:{}", VISIT_PREFIX, installation, event)
}
fn revocation_node_id(installation: &str, event: &str) -> String {
    format!("{}{}:{}", REVOCATION_PREFIX, installation, event)
}

fn matches_existing(node: &Node, v: &Visit) -> bool {
    if let Some(existing) = node.properties.get("payloadDigest") {
        return existing == &v.digest;
    }
    // Compatibility for observations stored by the original snapshot-only importer.
    node.title == v.site
        && node.properties.get("url") == Some(&v.url)
        && node.properties.get("observedAt") == Some(&v.at)
}
fn site_node(site: &str) -> Node {
    Node::new(&format!("web:site:{}", sha(site)), NodeKind::Concept, site)
        .property("source", VISIT_SOURCE)
        .property("site", site)
}
fn visit_node(v: &Visit, cursor: u64) -> Node {
    Node::new(&visit_id(v), NodeKind::Document, &v.site)
        .property("source", VISIT_SOURCE)
        .property("url", &v.url)
        .property("observedAt", &v.at)
        .property("evidence", "browser-navigation-metadata")
        .property("payloadDigest", &v.digest)
        .property("installationId", &v.installation)
        .property("sessionId", &v.session)
        .property("eventId", &v.id)
        .property("browserTabId", &v.tab)
        .property("site", &v.site)
        .property("cursor", &cursor.to_string())
        .source(&format!("browser:{}:{}", v.installation, v.id))
}
/// Request to revoke one observed visit.
///
/// The ingest batch schema (`vivim.browser-companion/1`) is frozen by the Host
/// contract, so a revocation is an explicit command, never an event smuggled
/// into a visit batch.
#[derive(Clone, Debug, Default)]
pub struct RevocationRequest {
    /// Either the full visit node id (`web:visit:<installation>:<event>`) or
    /// the bare event id of the visit.
    pub id: String,
    /// Optional owning installation, used to disambiguate a bare event id.
    pub installation: Option<String>,
    /// Optional operator-supplied reason recorded on the tombstone.
    pub reason: Option<String>,
}
/// Outcome of one revocation request.
///
/// `revoked` is true only when a tombstone was durably written by this call.
/// `already_revoked` and `unknown` are idempotent no-ops: neither writes to
/// the journal nor moves the epoch.
#[derive(Clone, Debug)]
pub struct RevocationReceipt {
    pub revoked: bool,
    pub already_revoked: bool,
    pub unknown: bool,
    pub visit_id: Option<String>,
    pub installation: Option<String>,
    pub event_id: Option<String>,
    pub epoch: u64,
    pub cursor: u64,
}
impl RevocationReceipt {
    pub fn json(&self) -> Value {
        json!({"schema":REVOCATION_SCHEMA,
            "revoked":self.revoked,"alreadyRevoked":self.already_revoked,
            "unknown":self.unknown,"visitId":self.visit_id,
            "installationId":self.installation,"eventId":self.event_id,
            "epoch":self.epoch,"cursor":self.cursor})
    }
}
/// The additive tombstone written beside a revoked visit.
///
/// The visit node itself stays in the graph: revocation is query-level and
/// phone-level absence, not a rewrite of committed history. A graph-level
/// search for the revoked id can still find the visit node.
fn revocation_node(installation: &str, event: &str, reason: Option<&str>) -> Node {
    let mut node = Node::new(
        &revocation_node_id(installation, event),
        NodeKind::Concept,
        "revoked web visit",
    )
    .property("source", VISIT_SOURCE)
    .property("revocationSchema", REVOCATION_SCHEMA)
    .property("installationId", installation)
    .property("eventId", event)
    .property("revokedVisit", &visit_node_id(installation, event))
    .source(&format!("browser:{}:{}", installation, event));
    if let Some(reason) = reason {
        node = node.property("reason", reason);
    }
    node
}
fn valid_reason(reason: &str) -> Result<()> {
    if reason.len() > MAX_REASON || reason.chars().any(char::is_control) {
        return Err(Error::Invalid("invalid revocation reason".into()));
    }
    Ok(())
}
#[derive(Debug)]
pub struct Receipt {
    pub accepted_ids: Vec<String>,
    pub inserted: usize,
    pub duplicates: usize,
    pub epoch: u64,
    pub cursor: u64,
}
impl Receipt {
    pub fn json(&self) -> Value {
        json!({"schema":ACK_SCHEMA,"acceptedIds":self.accepted_ids,
            "accepted":self.accepted_ids.len(),"inserted":self.inserted,
            "duplicates":self.duplicates,"epoch":self.epoch,"cursor":self.cursor})
    }
}
pub struct WebMemory {
    journal: Journal,
    graph: Graph,
    bytes: u64,
    cursor: u64,
    /// Revoked visit keys (`<installation>:<event id>`). A revoked visit is
    /// never returned by `query` again.
    revoked: BTreeSet<String>,
}
impl WebMemory {
    pub fn open(journal: Journal) -> Result<Self> {
        let status = journal.status()?;
        if status.trailing_bytes != 0 {
            return Err(Error::Corrupt(format!(
                "journal has {} torn bytes; inspect and run hqkg-control repair-tail",
                status.trailing_bytes
            )));
        }
        let graph = journal.load()?;
        let count = graph
            .nodes()
            .filter(|n| n.id.starts_with(VISIT_PREFIX))
            .count() as u64;
        let cursor = graph
            .nodes()
            .filter_map(|n| {
                n.properties
                    .get("cursor")
                    .and_then(|s| s.parse::<u64>().ok())
            })
            .max()
            .unwrap_or(0)
            .max(count);
        // Revocation tombstones survive in the same journal as the visits, so
        // a restart keeps every revocation in force.
        let revoked = graph
            .nodes()
            .filter_map(|n| n.id.strip_prefix(REVOCATION_PREFIX))
            .filter(|key| match key.split_once(':') {
                Some((installation, event)) => uuid(installation) && uuid(event),
                None => false,
            })
            .map(str::to_string)
            .collect::<BTreeSet<String>>();
        Ok(Self {
            journal,
            graph,
            bytes: status.verified_bytes,
            cursor,
            revoked,
        })
    }
    pub fn graph(&self) -> &Graph {
        &self.graph
    }
    pub fn bytes(&self) -> u64 {
        self.bytes
    }
    pub fn cursor(&self) -> u64 {
        self.cursor
    }
    /// Validate all events and all ID conflicts before writing one durable delta.
    pub fn accept(&mut self, visits: &[Visit]) -> Result<Receipt> {
        if visits.is_empty() || visits.len() > MAX_BATCH {
            return Err(Error::Invalid("invalid event count".into()));
        }
        let mut delta = Graph::new();
        let mut inserted = 0;
        let mut next_cursor = self.cursor;
        for v in visits {
            if !uuid(&v.id)
                || !valid_site(&v.site)
                || !valid_url(&v.site, &v.url)
                || !valid_time(&v.at)
                || !uuid(&v.installation)
                || !uuid(&v.session)
                || v.digest != event_digest(v)
                || v.tab
                    .parse::<u64>()
                    .ok()
                    .filter(|n| *n <= i32::MAX as u64)
                    .map_or(true, |n| n.to_string() != v.tab)
            {
                return Err(Error::Invalid("invalid visit".into()));
            }
            let key = visit_id(v);
            // A revoked visit is never resurrected by a stale replay: the
            // tombstone outranks any later batch carrying the same event.
            if self.revoked.contains(&key[VISIT_PREFIX.len()..]) {
                continue;
            }
            if let Some(previous) = self.graph.node(&key).or_else(|| delta.node(&key)) {
                if !matches_existing(previous, v) {
                    return Err(Error::Conflict(
                        "same event ID has conflicting contents".into(),
                    ));
                }
                continue;
            }
            next_cursor = next_cursor
                .checked_add(1)
                .ok_or_else(|| Error::Invalid("web cursor overflow".into()))?;
            let site = site_node(&v.site);
            // Validate graph ID collisions before a durable write: a failed
            // in-memory projection after fsync would otherwise poison replay.
            if let Some(old_site) = self.graph.node(&site.id) {
                if old_site.kind != site.kind
                    || old_site.title != site.title
                    || old_site.properties != site.properties
                    || old_site.sources != site.sources
                {
                    return Err(Error::Conflict("web site node collision".into()));
                }
            }
            let edge_id = format!("web:edge:{}", sha(&key));
            if self.graph.edge(&edge_id).is_some() {
                return Err(Error::Conflict("web edge ID collision".into()));
            }
            if delta.node(&site.id).is_none() {
                delta.put_node(site.clone())?;
            }
            delta.put_node(visit_node(v, next_cursor))?;
            delta.put_edge(Edge::new(&edge_id, &key, "visited-site", &site.id))?;
            inserted += 1;
        }
        if inserted > 0 {
            // Write+fsync the additive frame before updating memory or producing an ACK.
            let after = self.journal.append_delta(&delta, self.bytes)?;
            for n in delta.nodes() {
                if self.graph.node(&n.id).is_none() {
                    self.graph.put_node(n.clone())?;
                }
            }
            for e in delta.edges() {
                if self.graph.edge(&e.id).is_none() {
                    self.graph.put_edge(e.clone())?;
                }
            }
            self.bytes = after;
            self.cursor = next_cursor;
        }
        Ok(Receipt {
            accepted_ids: visits.iter().map(|v| v.id.clone()).collect(),
            inserted,
            duplicates: visits.len() - inserted,
            epoch: self.graph.epoch(),
            cursor: self.cursor,
        })
    }
    /// Revoke one observed visit.
    ///
    /// The revocation is an additive tombstone node in the same journal: one
    /// fsynced delta frame, O(1), no graph snapshot rewrite. The visit node
    /// itself stays in the graph, so a graph-level search for the revoked id
    /// can still find it; the guarantee is query-level and phone-level absence.
    ///
    /// Idempotency: revoking an already revoked visit writes nothing and
    /// returns `already_revoked`; revoking an unknown id writes nothing and
    /// returns `unknown`. Neither moves the epoch. Only a first revocation
    /// writes a tombstone and bumps the journal epoch.
    ///
    /// Exact scope of the absence guarantee:
    ///
    /// * Every `query` page of this journal omits the revoked visit, before
    ///   and after any restart, and a stale replay of the same event cannot
    ///   put it back.
    /// * The phone reads the Host projection of that page, so a revoked visit
    ///   can never reach a phone again through this source.
    /// * A visit the Host already projected into its own ledger before the
    ///   revocation stays in that ledger until the Host's own retraction path
    ///   removes it. This journal carries no retraction id list, so that
    ///   Host-side removal is a Host effect, not a Rust one.
    /// * The visit node itself is still in the graph. A graph-level search for
    ///   the revoked id can find it; that residual is deliberate.
    pub fn revoke(&mut self, req: &RevocationRequest) -> Result<RevocationReceipt> {
        if let Some(reason) = &req.reason {
            valid_reason(reason)?;
        }
        let target = self.resolve_revocation_target(req)?;
        let Some((installation, event, node_id)) = target else {
            return Ok(RevocationReceipt {
                revoked: false,
                already_revoked: false,
                unknown: true,
                visit_id: None,
                installation: None,
                event_id: None,
                epoch: self.graph.epoch(),
                cursor: self.cursor,
            });
        };
        let key = web_key(&installation, &event);
        if self.revoked.contains(&key) {
            return Ok(RevocationReceipt {
                revoked: false,
                already_revoked: true,
                unknown: false,
                visit_id: Some(node_id),
                installation: Some(installation),
                event_id: Some(event),
                epoch: self.graph.epoch(),
                cursor: self.cursor,
            });
        }
        // Ownership: only a browser-companion visit may be revoked, and the
        // node's own provenance must agree with the requested scope.
        let node = self
            .graph
            .node(&node_id)
            .ok_or_else(|| Error::Invalid("unknown visit id".into()))?;
        if let Some(source) = node.properties.get("source") {
            if source != VISIT_SOURCE {
                return Err(Error::Conflict(
                    "visit is not owned by the browser companion".into(),
                ));
            }
        }
        if let Some(owner) = node.properties.get("installationId") {
            if owner != &installation {
                return Err(Error::Conflict(
                    "visit ownership does not match the requested installation".into(),
                ));
            }
        }
        if let Some(event_id) = node.properties.get("eventId") {
            if event_id != &event {
                return Err(Error::Conflict(
                    "visit provenance does not match the requested event".into(),
                ));
            }
        }
        let mut delta = Graph::new();
        delta.put_node(revocation_node(
            &installation,
            &event,
            req.reason.as_deref(),
        ))?;
        // Write+fsync the additive frame before reporting the revocation.
        let after = self.journal.append_delta(&delta, self.bytes)?;
        for n in delta.nodes() {
            if self.graph.node(&n.id).is_none() {
                self.graph.put_node(n.clone())?;
            }
        }
        self.bytes = after;
        self.revoked.insert(key);
        Ok(RevocationReceipt {
            revoked: true,
            already_revoked: false,
            unknown: false,
            visit_id: Some(node_id),
            installation: Some(installation),
            event_id: Some(event),
            epoch: self.graph.epoch(),
            cursor: self.cursor,
        })
    }
    /// Resolve a revocation request to the visit it names.
    ///
    /// `None` means the id is well formed but names no visit in the graph.
    fn resolve_revocation_target(
        &self,
        req: &RevocationRequest,
    ) -> Result<Option<(String, String, String)>> {
        let raw = req.id.trim();
        if raw.is_empty() {
            return Err(Error::Invalid("revoke requires --id".into()));
        }
        if let Some(scope) = &req.installation {
            if !uuid(scope) {
                return Err(Error::Invalid("invalid installation id".into()));
            }
        }
        if let Some(rest) = raw.strip_prefix(VISIT_PREFIX) {
            let (installation, event) = rest
                .split_once(':')
                .ok_or_else(|| Error::Invalid("invalid visit id".into()))?;
            if !uuid(installation) || !uuid(event) {
                return Err(Error::Invalid("invalid visit id".into()));
            }
            if let Some(scope) = &req.installation {
                if scope != installation {
                    return Err(Error::Invalid(
                        "installation does not match the visit id".into(),
                    ));
                }
            }
            let node_id = visit_node_id(installation, event);
            if self.graph.node(&node_id).is_none() {
                return Ok(None);
            }
            return Ok(Some((installation.to_string(), event.to_string(), node_id)));
        }
        if !uuid(raw) {
            return Err(Error::Invalid("invalid visit id".into()));
        }
        let mut found: Vec<(String, String)> = Vec::new();
        for node in self
            .graph
            .nodes()
            .filter(|n| n.id.starts_with(VISIT_PREFIX))
        {
            let Some((installation, event)) = node.id[VISIT_PREFIX.len()..].split_once(':') else {
                continue;
            };
            if event != raw {
                continue;
            }
            if let Some(scope) = &req.installation {
                if scope != installation {
                    continue;
                }
            }
            found.push((installation.to_string(), event.to_string()));
        }
        match found.len() {
            0 => Ok(None),
            1 => {
                let (installation, event) = &found[0];
                Ok(Some((
                    installation.clone(),
                    event.clone(),
                    visit_node_id(installation, event),
                )))
            }
            _ => Err(Error::Invalid(
                "ambiguous visit id; pass --installation".into(),
            )),
        }
    }
    pub fn query(&self, q: &Query) -> Result<Value> {
        if q.limit == 0 || q.limit > 100 {
            return Err(Error::Invalid("query limit must be 1..100".into()));
        }
        if let Some(site) = &q.site {
            if !valid_site(site) {
                return Err(Error::Invalid("invalid site".into()));
            }
        }
        for bound in [&q.since, &q.until] {
            if let Some(t) = bound {
                if !valid_time(t) {
                    return Err(Error::Invalid("invalid time filter".into()));
                }
            }
        }
        let mut legacy_cursor = 0u64;
        let mut omitted_unsafe = 0usize;
        let mut rows = BTreeMap::new();
        for node in self
            .graph
            .nodes()
            .filter(|n| n.id.starts_with(VISIT_PREFIX))
        {
            // A revoked visit is absent from every query page. It is withheld
            // on purpose, so it is not counted as an unsafe omission either.
            if self.revoked.contains(&node.id[VISIT_PREFIX.len()..]) {
                continue;
            }
            let cursor = match node.properties.get("cursor") {
                Some(s) => s
                    .parse::<u64>()
                    .map_err(|_| Error::Corrupt("invalid web cursor".into()))?,
                None => {
                    legacy_cursor += 1;
                    legacy_cursor
                }
            };
            if cursor <= q.after_cursor {
                continue;
            }
            let site = node
                .properties
                .get("site")
                .map(String::as_str)
                .unwrap_or(&node.title);
            let at = node
                .properties
                .get("observedAt")
                .ok_or_else(|| Error::Corrupt("visit missing observedAt".into()))?;
            let url = node
                .properties
                .get("url")
                .ok_or_else(|| Error::Corrupt("visit missing url".into()))?;
            if !valid_site(site) || !valid_url(site, url) {
                omitted_unsafe += 1;
                continue;
            }
            if q.site.as_deref().map_or(false, |s| s != site)
                || q.since.as_deref().map_or(false, |t| at.as_str() < t)
                || q.until.as_deref().map_or(false, |t| at.as_str() > t)
            {
                continue;
            }
            let provenance = node.sources.iter().next().cloned().unwrap_or_default();
            let installation = node
                .id
                .strip_prefix(VISIT_PREFIX)
                .and_then(|s| s.split_once(':'))
                .map(|p| p.0)
                .unwrap_or("");
            let event_id = node.id.rsplit(':').next().unwrap_or("");
            rows.insert(
                (cursor, node.id.clone()),
                json!({
                    "id":event_id,"installationId":installation,"site":site,
                    "url":url,"observedAt":at,"provenance":provenance,
                    "cursor":cursor,"verified":node.properties.contains_key("payloadDigest"),
                    "source":VISIT_SOURCE
                }),
            );
            // Keep at most one page plus one proof of a following page.
            // Time/site filters still scan the graph, but memory is O(limit).
            if rows.len() > q.limit + 1 {
                if let Some(last) = rows.keys().next_back().cloned() {
                    rows.remove(&last);
                }
            }
        }
        let has_more = rows.len() > q.limit;
        let next_cursor = rows
            .keys()
            .take(q.limit)
            .last()
            .map(|(cursor, _)| *cursor)
            .unwrap_or(q.after_cursor);
        let results = rows.into_values().take(q.limit).collect::<Vec<_>>();
        Ok(
            json!({"schema":QUERY_SCHEMA,"graphEpoch":self.graph.epoch(),
            "cursor":self.cursor,"nextCursor":next_cursor,"hasMore":has_more,
            "omittedUnsafe":omitted_unsafe,"results":results}),
        )
    }
}
#[derive(Default, Debug)]
pub struct Query {
    pub site: Option<String>,
    pub since: Option<String>,
    pub until: Option<String>,
    pub after_cursor: u64,
    pub limit: usize,
}
