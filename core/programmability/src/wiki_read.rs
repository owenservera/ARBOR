//! Bounded source-backed Wiki read model for native desktop projections.
//! @hq:capability vivim.rust-wiki-read-model@1
//! @hq:consumes vivim.host-wiki-projection@1
//! An observation is neither a journal writer nor an approval to edit.
use serde_json::Value;
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
    Ok(WikiRead { revision, digest, pages_total: pages.len(), pages: output })
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
