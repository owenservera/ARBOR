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


// Read-only committed Wiki source chronology, reconstructed from compact Host
// journal identities. The Host hashes source content before transport; Rust
// owns current/superseded classification, windowing, and result projection.
// @hq:capability vivim.rust-wiki-change-projection@1
pub fn changes(input:&Value)->Value {
    let refuse=||json!({
        "schema":"vivim.wiki-changes-projection/1","outcome":"refused",
        "code":"INVALID_WIKI_CHANGES_SOURCE",
        "authority":"none","executionAuthorized":false,"effectPerformed":false
    });
    if input["schema"]!="vivim.wiki-change-source/1"||
       !input["currentOnly"].is_boolean(){return refuse()}
    let Some(entries)=input["entries"].as_array()else{return refuse()};
    if entries.len()>8192{return refuse()}
    let current_only=input["currentOnly"]==true;
    let mut latest=std::collections::HashMap::new();
    let mut identified=Vec::new();
    let mut previous_revision=None;
    let mut previous_sequence=None;
    for entry in entries {
        let Some(page)=entry["page"].as_str().filter(|s|!s.is_empty())
            else{return refuse()};
        let Some(section)=entry["section"].as_str().filter(|s|!s.is_empty())
            else{return refuse()};
        let Some(revision)=entry["expectedRevision"].as_u64()
            else{return refuse()};
        // These are already-committed Host journal entries in source order.
        // A reversed or duplicated revision could otherwise mark a stale
        // section as current because the last array element wins.
        // Fail closed rather than converting corrupt provenance into proof.
        if revision==u64::MAX||
            previous_revision.is_some_and(|old|revision<=old){return refuse()}
        previous_revision=Some(revision);
        if !matches!(entry["action"].as_str(),Some("set-section"|"capture-note"|"capture-task")){
            return refuse()
        }
        let Some(digest)=entry["contentDigest"].as_str().filter(|s|
            s.len()==64&&s.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)))
            else{return refuse()};
        let _=digest;
        let key=(page.to_owned(),section.to_owned());
        latest.insert(key,revision+1);
        if entry["entryId"].is_null()&&entry["sequence"].is_null(){continue}
        if !entry["entryId"].as_str().is_some_and(uuid)||
           !entry["sequence"].as_u64().is_some_and(|n|n>0&&n<=9_007_199_254_740_991)||
           !entry["receivedAt"].as_str().is_some_and(|s|!s.is_empty()){
            return refuse()
        }
        // Host sequence is a monotone journal identity shared with non-Wiki
        // events. Gaps are valid; duplicate or reversed identified entries are
        // not. Never project a corrupted sequence as a current-source receipt.
        let sequence=entry["sequence"].as_u64().expect("validated sequence");
        if previous_sequence.is_some_and(|old|sequence<=old){return refuse()}
        previous_sequence=Some(sequence);
        identified.push(entry);
    }
    let selected:Vec<&Value>=identified.into_iter().filter(|entry|{
        !current_only||latest.get(&(entry["page"].as_str().unwrap().to_owned(),
            entry["section"].as_str().unwrap().to_owned()))
            ==entry["expectedRevision"].as_u64().and_then(|revision|revision.checked_add(1)).as_ref()
    }).collect();
    let total=selected.len();
    let mut projected=Vec::new();
    for entry in selected.iter().skip(total.saturating_sub(24)) {
        let page=entry["page"].as_str().unwrap();
        let section=entry["section"].as_str().unwrap();
        let revision=entry["expectedRevision"].as_u64().unwrap();
        let current=latest.get(&(page.to_owned(),section.to_owned()))==Some(&(revision+1));
        let mut item=json!({
            "source":"host-product-journal","entryId":entry["entryId"],
            "sequence":entry["sequence"],"receivedAt":entry["receivedAt"],
            "kind":"committed-wiki-edit","contentDigest":entry["contentDigest"],
            "previousWikiRevision":revision,"wikiRevision":revision+1,
            "status":if current{"current-section-revision"}else{"superseded-section-revision"},
            "relationship":{"kind":"mutated-section","page":page,"section":section}
        });
        if let Some(kind)=entry["action"].as_str().unwrap().strip_prefix("capture-"){
            item["captureKind"]=json!(kind);
        }
        if !entry["sequenceBinding"].is_null(){
            item["sequenceBinding"]=entry["sequenceBinding"].clone();
        }
        projected.push(item);
    }
    json!({
        "schema":"vivim.wiki-changes-projection/1","outcome":"computed",
        "authority":"none","executionAuthorized":false,"effectPerformed":false,
        "total":total,"omitted":total.saturating_sub(projected.len()),"items":projected
    })
}


// Rust computes exact pure Wiki structure transitions from Host-supplied current
// page identities and links. The Host alone persists the resulting journal edit.
// @hq:capability vivim.rust-wiki-structure-transition@1
fn valid_page_name(name:&str)->bool{
    let bytes=name.as_bytes();
    !bytes.is_empty()&&bytes.len()<=80&&bytes[0].is_ascii_alphabetic()&&
    bytes[1..].iter().all(|b|b.is_ascii_alphanumeric()||
        matches!(*b,b' '|b'_'|b'.'|b'-'))
}
fn valid_page_slug(name:&str)->bool{
    let bytes=name.as_bytes();
    !bytes.is_empty()&&bytes.len()<=63&&bytes[0].is_ascii_alphabetic()&&
    bytes[1..].iter().all(|b|b.is_ascii_alphanumeric()||*b==b'-')&&
    !matches!(name.to_ascii_lowercase().as_str(),"__proto__"|"constructor"|"prototype")
}
fn canonical<'a>(names:&'a [String],requested:&str)->Option<&'a str>{
    let mut matched=names.iter().filter(|name|name.eq_ignore_ascii_case(requested));
    let name=matched.next()?;
    if matched.next().is_some(){return None}
    Some(name.as_str())
}
pub fn structure_transition(input:&Value)->Value {
    let refuse=|code:&str|json!({
        "schema":"vivim.wiki-structure-transition/1","outcome":"refused",
        "code":code,"authority":"none","executionAuthorized":false,
        "effectPerformed":false
    });
    if input["schema"]!="vivim.wiki-structure-source/1"{return refuse("INVALID_SOURCE")}
    let Some(revision)=input["wikiRevision"].as_u64()else{return refuse("INVALID_SOURCE")};
    if revision==u64::MAX{return refuse("INVALID_SOURCE")}
    let Some(raw)=input["pages"].as_array()else{return refuse("INVALID_SOURCE")};
    if raw.len()>1024{return refuse("INVALID_SOURCE")}
    let mut names=Vec::new();
    let mut link_sets=std::collections::HashMap::new();
    for row in raw {
        let Some(name)=row["name"].as_str().filter(|n|valid_page_name(n))
            else{return refuse("INVALID_SOURCE")};
        if names.iter().any(|old:&String|old.eq_ignore_ascii_case(name)){
            return refuse("AMBIGUOUS_SOURCE_PAGE")
        }
        let links=match &row["links"] {
            Value::Null=>Vec::new(),
            Value::Array(items) if items.len()<=128=>{
                let mut found=Vec::new();
                for item in items {
                    let Some(target)=item.as_str().filter(|target|valid_page_name(target))
                        else{return refuse("INVALID_SOURCE")};
                    if found.iter().any(|old:&String|old.as_str()==target){
                        return refuse("INVALID_SOURCE")
                    }
                    found.push(target.to_owned());
                }
                found
            },
            _=>return refuse("INVALID_SOURCE"),
        };
        names.push(name.to_owned());
        link_sets.insert(name.to_owned(),links);
    }
    let edit=&input["edit"];
    let Some(action)=edit["action"].as_str()else{return refuse("INVALID_EDIT")};
    let mut order=names.clone();
    let (canonical_edit,patch)=match action {
        "create-page"=>{
            let Some(name)=edit["page"].as_str().filter(|name|valid_page_slug(name))
                else{return refuse("INVALID_EDIT")};
            if names.len()>=256{return refuse("PAGE_CAPACITY")}
            if names.iter().any(|existing|existing.eq_ignore_ascii_case(name)){
                return refuse("PAGE_EXISTS")
            }
            order.push(name.to_owned());
            (json!({"action":"create-page","page":name}),
             json!({"kind":"create-page","page":name,"order":order}))
        },
        "move-page"=>{
            let Some(name)=edit["page"].as_str().filter(|name|valid_page_name(name))
                else{return refuse("INVALID_EDIT")};
            let Some(position)=edit["position"].as_str().filter(|position|
                matches!(*position,"top"|"bottom"|"up"|"down"))
                else{return refuse("INVALID_EDIT")};
            let Some(page)=canonical(&names,name)else{return refuse("PAGE_UNKNOWN")};
            let Some(from)=names.iter().position(|name|name==page)
                else{return refuse("PAGE_UNKNOWN")};
            let to=match position {
                "top"=>0,"bottom"=>names.len()-1,
                "up"=>from.saturating_sub(1),
                "down"=>(from+1).min(names.len()-1),
                _=>return refuse("INVALID_EDIT")
            };
            if from==to{return refuse("PAGE_ALREADY_POSITIONED")}
            let moved=order.remove(from);
            order.insert(to,moved);
            (json!({"action":"move-page","page":page,"position":position}),
             json!({"kind":"move-page","page":page,"order":order}))
        },
        "link-pages"=>{
            let Some(source)=edit["from"].as_str().filter(|name|valid_page_name(name))
                else{return refuse("INVALID_EDIT")};
            let Some(target)=edit["to"].as_str().filter(|name|valid_page_name(name))
                else{return refuse("INVALID_EDIT")};
            let Some(from)=canonical(&names,source)else{return refuse("PAGE_UNKNOWN")};
            let Some(to)=canonical(&names,target)else{return refuse("PAGE_UNKNOWN")};
            if from==to{return refuse("SELF_LINK")}
            let Some(old_links)=link_sets.get(from)else{return refuse("INVALID_SOURCE")};
            if old_links.len()>=128||old_links.iter().any(|link|link==to){
                return refuse("LINK_EXISTS_OR_CAPACITY")
            }
            let mut links=old_links.clone();
            links.push(to.to_owned());
            (json!({"action":"link-pages","from":from,"to":to}),
             json!({"kind":"link-pages","from":from,"to":to,
                    "order":order,"links":links}))
        },
        _=>return refuse("INVALID_EDIT")
    };
    json!({
        "schema":"vivim.wiki-structure-transition/1","outcome":"computed",
        "previousRevision":revision,"wikiRevision":revision+1,
        "edit":canonical_edit,"patch":patch,
        "authority":"none","executionAuthorized":false,"effectPerformed":false
    })
}
