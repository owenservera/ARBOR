//! Bounded source-backed Wiki read model for native desktop projections.
//! @hq:capability vivim.rust-wiki-read-model@1
//! @hq:capability vivim.rust-wiki-source-stamp@1
//! @hq:consumes vivim.host-wiki-projection@1
//! An observation is neither a journal writer nor an approval to edit.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

const SHOWN_PAGES: usize = 40;
const SHOWN_SECTIONS: usize = 12;
const SHOWN_LINKS: usize = 12;
const PREVIEW_CHARS: usize = 1200;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Section {
    pub title: String,
    pub text: String,
    pub truncated: bool,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Page {
    pub name: String,
    pub links: Vec<String>,
    pub sections: Vec<Section>,
    pub sections_total: usize,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WikiRead {
    pub revision: u64,
    pub digest: String,
    pub pages_total: usize,
    pub pages: Vec<Page>,
    pub captures: Option<Captures>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReadError { InvalidProjection, RevisionConflict }

fn name_ok(s: &str) -> bool {
    !s.is_empty() && s.chars().count() <= 160 && !s.chars().any(char::is_control)
}
fn preview(input: &str) -> (String, bool) {
    let mut chars = input.chars();
    let text: String = chars.by_ref().take(PREVIEW_CHARS).collect();
    let truncated = chars.next().is_some();
    (text, truncated)
}
pub fn read(wiki: &Value) -> Result<WikiRead, ReadError> {
    let revision = wiki["revision"].as_u64().ok_or(ReadError::InvalidProjection)?;
    let pages = wiki["pages"].as_object().ok_or(ReadError::InvalidProjection)?;
    let encoded = serde_json::to_vec(&wiki["pages"]).map_err(|_| ReadError::InvalidProjection)?;
    let digest = format!("{:x}", Sha256::digest(&encoded));
    let mut output = Vec::new();
    for (name, value) in pages.iter().take(SHOWN_PAGES) {
        if !name_ok(name) { return Err(ReadError::InvalidProjection); }
        let sections = value["sections"].as_object().ok_or(ReadError::InvalidProjection)?;
        let mut shown = Vec::new();
        for (title, body) in sections.iter().take(SHOWN_SECTIONS) {
            if !name_ok(title) { return Err(ReadError::InvalidProjection); }
            let content = body.as_str().ok_or(ReadError::InvalidProjection)?;
            let (text, truncated) = preview(content);
            shown.push(Section { title: title.clone(), text, truncated });
        }
        let mut links = Vec::new();
        if let Some(raw) = value.get("links") {
            let source = raw.as_array().ok_or(ReadError::InvalidProjection)?;
            for target in source.iter().take(SHOWN_LINKS) {
                let target = target.as_str().filter(|s| name_ok(s))
                    .ok_or(ReadError::InvalidProjection)?;
                if pages.contains_key(target) && !links.iter().any(|l| l == target) {
                    links.push(target.to_owned());
                }
            }
        }
        output.push(Page { name: name.clone(), links, sections: shown, sections_total: sections.len() });
    }
    let captures=capture_read(wiki,revision);
    Ok(WikiRead { revision, digest, pages_total: pages.len(), pages: output, captures })
}

/// Keep the last admitted source revision even when a Host read becomes unavailable.
#[derive(Default)]
pub struct RevisionGuard { last: Option<(u64, String)> }
impl RevisionGuard {
    pub fn accept(&mut self, revision: u64, digest: &str) -> Result<(), ReadError> {
        if digest.len() != 64 || !digest.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err(ReadError::InvalidProjection);
        }
        if let Some((previous_revision, previous_digest)) = &self.last {
            if revision < *previous_revision ||
                (revision == *previous_revision && digest != previous_digest) {
                return Err(ReadError::RevisionConflict);
            }
        }
        self.last = Some((revision, digest.to_owned()));
        Ok(())
    }
}

/// Portable identity of the real Host Wiki pages, not a signature or grant.
/// The full source is hashed even when the display model is truncated.
pub fn source_stamp(input: &Value) -> Value {
    match read(&input["wiki"]) {
        Ok(view) => json!({
            "schema": "vivim.wiki-source-stamp/1",
            "state": "computed",
            "revision": view.revision,
            "digest": view.digest,
            "pagesTotal": view.pages_total,
            "authority": "none",
            "executionAuthorized": false,
            "effectPerformed": false
        }),
        Err(_) => json!({
            "schema": "vivim.wiki-source-stamp/1",
            "state": "refused",
            "code": "INVALID_WIKI_SOURCE",
            "authority": "none",
            "executionAuthorized": false,
            "effectPerformed": false
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureCounts {
    pub notes: u64,
    pub open_tasks: u64,
    pub done_tasks: u64,
    pub unknown_tasks: u64,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureItem {
    pub kind: String,
    pub status: Option<String>,
    pub page: String,
    pub created_revision: u64,
    pub preview: String,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Captures {
    pub total: u64,
    pub omitted: u64,
    pub counts: CaptureCounts,
    pub recent: Vec<CaptureItem>,
}
fn capture_page(kind: &str, name: &str) -> bool {
    let Some(id) = name.strip_prefix(if kind == "task" { "task-" } else { "note-" }) else {return false;};
    id.len() == 32 && id.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}
fn capture_uuid(id: &str) -> bool {
    id.len() == 36 && id.bytes().enumerate().all(|(i,b)| {
        if [8,13,18,23].contains(&i) {b == b'-'}
        else {b.is_ascii_hexdigit()}
    })
}
fn capture_read(wiki: &Value, revision: u64) -> Option<Captures> {
    let c = wiki.get("personalCaptures")?;
    if c["schema"] != "vivim.personal-captures/1"
        || c["authority"] != "committed-wiki-read-only"
        || c["wikiRevision"].as_u64()? != revision {return None;}
    let total=c["total"].as_u64()?;
    let omitted=c["omitted"].as_u64()?;
    let items=c["items"].as_array().filter(|a|a.len()<=256)?;
    if total!=omitted.checked_add(items.len() as u64)? {return None;}
    let counts=&c["counts"];
    let full=CaptureCounts{
        notes:counts["notes"].as_u64()?,
        open_tasks:counts["openTasks"].as_u64()?,
        done_tasks:counts["doneTasks"].as_u64()?,
        unknown_tasks:counts["unknownTasks"].as_u64()?,
    };
    let sum=full.notes.checked_add(full.open_tasks)?
        .checked_add(full.done_tasks)?.checked_add(full.unknown_tasks)?;
    if sum!=total{return None;}
    let pages=wiki["pages"].as_object()?;
    let mut seen_pages=std::collections::HashSet::new();
    let mut seen_entries=std::collections::HashSet::new();
    let mut window=[0u64;4];
    let mut recent=Vec::new();
    for entry in items {
        let kind=entry["kind"].as_str().filter(|s|matches!(*s,"note"|"task"))?;
        let page=entry["page"].as_str().filter(|s|capture_page(kind,s))?;
        let uuid=entry["entryId"].as_str().filter(|s|capture_uuid(s))?;
        if !seen_pages.insert(page) || !seen_entries.insert(uuid) {return None;}
        let created=entry["createdRevision"].as_u64().filter(|n|*n>0&&*n<=revision)?;
        let section=if kind=="task" {"Task"}else{"Note"};
        if entry["section"]!=section{return None;}
        let document=pages.get(page)?;
        let text=document["sections"][section].as_str()?;
        let status=if kind=="task"{
            let actual=match document["sections"]["Status"].as_str(){
                Some("Open")=>"Open",Some("Done")=>"Done",_=>"Unknown"
            };
            if entry["status"]!=actual{return None;}
            Some(actual.to_owned())
        }else{None};
        let index=if kind=="note"{0}else{match status.as_deref(){
            Some("Open")=>1,Some("Done")=>2,_=>3
        }};
        window[index]+=1;
        let (preview,_)=preview(text);
        recent.push(CaptureItem{
            kind:kind.to_owned(),status,page:page.to_owned(),
            created_revision:created,preview
        });
    }
    if [full.notes,full.open_tasks,full.done_tasks,full.unknown_tasks]
        .iter().zip(window).any(|(a,b)|*a<b){return None;}
    recent.sort_by(|a,b|b.created_revision.cmp(&a.created_revision));
    recent.truncate(16);
    Some(Captures{total,omitted,counts:full,recent})
}
