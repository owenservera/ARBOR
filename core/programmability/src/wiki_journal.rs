//! Deterministic, read-only projections of already-committed Host Wiki captures.
//! @hq:capability vivim.rust-capture-projection@1
//! @hq:consumes vivim.host-product-journal@1
//! This module never reads a file, authorizes edits, or infers uncommitted tasks.
use serde_json::{json,Value};
use std::collections::HashSet;

const MAX_CAPTURE_ROWS: usize=256;
fn invalid()->Value {
    json!({"schema":"vivim.personal-captures/1","outcome":"refused",
      "code":"INVALID_CAPTURE_SOURCE","authority":"none",
      "executionAuthorized":false,"effectPerformed":false})
}
#[derive(Clone)]
struct Capture {
    kind: &'static str,
    page: String,
    section: &'static str,
    entry_id: String,
    created_revision: u64,
    status: Option<&'static str>,
}
impl Capture {
    fn category(&self)->usize {
        if self.kind=="note" {0} else {
            match self.status {
                Some("Open")=>1,
                Some("Done")=>2,
                _=>3,
            }
        }
    }
    fn to_json(&self)->Value {
        let mut row=json!({
            "kind":self.kind,"page":self.page,"section":self.section,
            "entryId":self.entry_id,"createdRevision":self.created_revision
        });
        if let Some(status)=self.status {row["status"]=json!(status)}
        row
    }
}
fn uuid(s:&str)->bool {
    s.len()==36 && s.bytes().enumerate().all(|(i,b)|{
        if [8,13,18,23].contains(&i){b==b'-'}
        else{b.is_ascii_hexdigit()}
    })
}
fn capture_page(kind:&str,name:&str)->bool {
    let prefix=if kind=="note"{"note-"}else{"task-"};
    name.strip_prefix(prefix).is_some_and(|id|
        id.len()==32&&id.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)))
}
pub fn captures(input:&Value)->Value {
    if input["schema"]!="vivim.capture-source/1" {return invalid()}
    let Some(wiki_revision)=input["wikiRevision"].as_u64()else{return invalid()};
    let Some(entries)=input["items"].as_array()else{return invalid()};
    if entries.len()>MAX_CAPTURE_ROWS{return invalid()}
    let mut seen_pages=HashSet::new();
    let mut seen_entries=HashSet::new();
    let mut collected=Vec::with_capacity(entries.len());
    for row in entries {
        let Some(kind)=row["kind"].as_str().filter(|k|matches!(*k,"note"|"task"))
            else{return invalid()};
        let Some(page)=row["page"].as_str().filter(|name|capture_page(kind,name))
            else{return invalid()};
        let Some(entry_id)=row["entryId"].as_str().filter(|id|uuid(id))
            else{return invalid()};
        let Some(created_revision)=row["createdRevision"].as_u64()
            .filter(|value|*value>0&&*value<=wiki_revision)
            else{return invalid()};
        if !seen_pages.insert(page)||!seen_entries.insert(entry_id){return invalid()}
        let section=if kind=="note"{"Note"}else{"Task"};
        if row["section"]!=section || row["sectionPresent"]!=true{return invalid()}
        let status=if kind=="task" {
            match row["status"].as_str(){
                Some("Open")=>Some("Open"),
                Some("Done")=>Some("Done"),
                Some("Unknown")=>Some("Unknown"),
                _=>return invalid(),
            }
        } else {
            if !row["status"].is_null(){return invalid()}
            None
        };
        collected.push(Capture {
            kind:if kind=="note"{"note"}else{"task"},
            page:page.to_owned(),section,entry_id:entry_id.to_owned(),
            created_revision,status
        });
    }
    let mut counts=[0usize;4];
    let mut reversed=collected;
    reversed.reverse();
    for row in &reversed{counts[row.category()]+=1;}
    let mut selected=HashSet::new();
    for row in reversed.iter().filter(|row|row.category()==1).take(128) {
        selected.insert(row.entry_id.clone());
    }
    for row in reversed.iter().filter(|row|row.category()==0).take(96) {
        selected.insert(row.entry_id.clone());
    }
    for row in &reversed{
        if selected.len()>=MAX_CAPTURE_ROWS{break}
        selected.insert(row.entry_id.clone());
    }
    let projected:Vec<Value>=reversed.iter()
        .filter(|row|selected.contains(&row.entry_id))
        .map(Capture::to_json).collect();
    json!({
        "schema":"vivim.personal-captures/1","authority":"committed-wiki-read-only",
        "wikiRevision":wiki_revision,"total":reversed.len(),
        "omitted":reversed.len().saturating_sub(projected.len()),
        "counts":{"notes":counts[0],"openTasks":counts[1],
                  "doneTasks":counts[2],"unknownTasks":counts[3]},
        "items":projected
    })
}
