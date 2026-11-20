//! Bounded source-backed Wiki read model for native desktop projections.
//! @hq:capability vivim.rust-wiki-read-model@1
//! @hq:capability vivim.rust-wiki-source-stamp@1
//! @hq:capability vivim.rust-wiki-source-transition@1
//! @hq:consumes vivim.host-wiki-projection@1
//! An observation is neither a journal writer nor an approval to edit.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

const SHOWN_PAGES: usize = 40;
const SHOWN_SECTIONS: usize = 12;
const SHOWN_LINKS: usize = 12;
const PREVIEW_CHARS: usize = 1200;
const SEARCH_PAGES: usize = 256;
const SEARCH_SECTIONS: usize = 512;
const SEARCH_CHARS_PER_SECTION: usize = 4096;

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
    pub search_index: Vec<SearchDocument>,
    pub indexed_pages: usize,
    pub index_truncated: bool,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReadError { InvalidProjection, RevisionConflict }

fn name_ok(s: &str) -> bool {
    !s.is_empty() && s.chars().count() <= 160 && !s.chars().any(char::is_control)
}
fn preview_chars(input: &str, limit:usize) -> (String, bool) {
    let mut chars=input.chars();
    let text:String=chars.by_ref().take(limit).collect();
    (text,chars.next().is_some())
}
fn preview(input: &str) -> (String, bool) { preview_chars(input,PREVIEW_CHARS) }
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
    let mut search_index=Vec::new();
    let mut indexed_pages=0;
    let mut index_truncated=false;
    'pages: for (name, value) in pages {
        if indexed_pages>=SEARCH_PAGES {
            index_truncated=true;
            break;
        }
        if !name_ok(name){return Err(ReadError::InvalidProjection)}
        let sections=value["sections"].as_object().ok_or(ReadError::InvalidProjection)?;
        search_index.push(SearchDocument {
            page:name.clone(),section:None,text:name.clone(),
        });
        indexed_pages+=1;
        for (title,body) in sections {
            if search_index.len().saturating_sub(indexed_pages)>=SEARCH_SECTIONS {
                index_truncated=true;
                break 'pages;
            }
            if !name_ok(title){return Err(ReadError::InvalidProjection)}
            let text=body.as_str().ok_or(ReadError::InvalidProjection)?;
            let (indexed,cut)=preview_chars(text,SEARCH_CHARS_PER_SECTION);
            if cut {index_truncated=true;}
            search_index.push(SearchDocument{
                page:name.clone(),section:Some(title.clone()),text:indexed,
            });
        }
    }
    let captures=capture_read(wiki,revision);
    Ok(WikiRead { revision, digest, pages_total: pages.len(), pages: output,
        captures, search_index, indexed_pages, index_truncated })
}

/// Keep the last admitted source revision even when a Host read becomes unavailable.
#[derive(Default)]
pub struct RevisionGuard { last: Option<(u64, String)> }
impl RevisionGuard {
    pub fn accept(&mut self, revision: u64, digest: &str) -> Result<(), ReadError> {
        if !valid_digest(digest) {
            return Err(ReadError::InvalidProjection);
        }
        if let Some((previous_revision, previous_digest)) = &self.last {
            compare_source(Some((*previous_revision,previous_digest.as_str())),
                (revision,digest))?;
        }
        self.last = Some((revision, digest.to_owned()));
        Ok(())
    }
}

/// Portable revision transition check for native desktop and browser clients.
/// Callers retain the identity fence only within their current authorized session.
fn valid_digest(value:&str)->bool {
    value.len()==64 &&
        value.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))
}
fn compare_source(previous:Option<(u64,&str)>, next:(u64,&str))->Result<(),ReadError>{
    if !valid_digest(next.1){return Err(ReadError::InvalidProjection);}
    if let Some((revision,digest))=previous {
        if !valid_digest(digest){return Err(ReadError::InvalidProjection);}
        if next.0<revision||(next.0==revision&&next.1!=digest){
            return Err(ReadError::RevisionConflict);
        }
    }
    Ok(())
}
pub fn source_transition(input:&Value)->Value{
    let refused=|code:&str|json!({
        "schema":"vivim.wiki-source-transition/1","outcome":"refused",
        "code":code,"authority":"none","executionAuthorized":false,
        "effectPerformed":false
    });
    let current=&input["current"];
    let Some(revision)=current["revision"].as_u64()else{return refused("INVALID_CURRENT");};
    let Some(digest)=current["digest"].as_str()else{return refused("INVALID_CURRENT");};
    let previous=&input["previous"];
    let previous=if previous.is_null(){None}else{
        let Some(old_revision)=previous["revision"].as_u64()else{return refused("INVALID_PREVIOUS");};
        let Some(old_digest)=previous["digest"].as_str()else{return refused("INVALID_PREVIOUS");};
        Some((old_revision,old_digest))
    };
    match compare_source(previous,(revision,digest)){
        Ok(())=>json!({
            "schema":"vivim.wiki-source-transition/1","outcome":"accepted",
            "authority":"none","executionAuthorized":false,"effectPerformed":false
        }),
        Err(ReadError::RevisionConflict)=>refused("SOURCE_REVISION_CONFLICT"),
        Err(ReadError::InvalidProjection)=>refused("INVALID_SOURCE_IDENTITY"),
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchDocument {
    pub page: String,
    pub section: Option<String>,
    pub text: String,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchHit {
    pub page: String,
    pub section: Option<String>,
    pub excerpt: String,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchRead {
    pub revision: u64,
    pub digest: String,
    pub scanned_pages: usize,
    pub pages_total: usize,
    pub indexed_sections: usize,
    pub index_truncated: bool,
    pub matches: usize,
    pub hits: Vec<SearchHit>,
}
/// Query the admitted, deliberately bounded Wiki read surface.
pub fn search_view(view: &WikiRead, query: &str, limit: usize) -> Option<SearchRead> {
    let term=query.trim();
    if term.is_empty() || term.chars().count()>160
       || term.chars().any(char::is_control) || !(1..=24).contains(&limit) {
        return None;
    }
    let needle=term.to_lowercase();
    let mut hits=Vec::new();
    let mut matches=0usize;
    for document in &view.search_index {
        let label=document.section.as_deref().unwrap_or(&document.page);
        let title_match=label.to_lowercase().contains(&needle);
        let text_match=document.section.is_some() && document.text.to_lowercase().contains(&needle);
        if !title_match&&!text_match{continue}
        matches+=1;
        if hits.len()<limit {
            // Match offsets are mapped through Unicode scalar positions, never
            // sliced at arbitrary UTF-8 bytes. The index itself is bounded.
            let lowered=document.text.to_lowercase();
            let offset=lowered.find(&needle)
                .map(|byte|lowered[..byte].chars().count()).unwrap_or(0);
            let start=offset.saturating_sub(40);
            let prefix=if start>0{"…"}else{""};
            let excerpt=format!("{}{}",prefix,
                document.text.chars().skip(start).take(238).collect::<String>());
            hits.push(SearchHit{
                page:document.page.clone(),section:document.section.clone(),
                excerpt
            });
        }
    }
    Some(SearchRead {
        revision:view.revision,digest:view.digest.clone(),
        scanned_pages:view.indexed_pages,pages_total:view.pages_total,
        indexed_sections:view.search_index.len().saturating_sub(view.indexed_pages),
        index_truncated:view.index_truncated,matches,hits,
    })
}
/// Same bounded source-backed search for Host native transport and browser WASM.
pub fn source_search(input: &Value) -> Value {
    let refusal=||json!({
        "schema":"vivim.wiki-source-search/1","outcome":"refused",
        "code":"INVALID_WIKI_SEARCH","authority":"none",
        "executionAuthorized":false,"effectPerformed":false
    });
    let Some(query)=input["query"].as_str()else{return refusal()};
    let Ok(view)=read(&input["wiki"])else{return refusal()};
    let Some(found)=search_view(&view,query,24)else{return refusal()};
    let rows:Vec<Value>=found.hits.iter().map(|hit|json!({
        "page":hit.page,"section":hit.section,"excerpt":hit.excerpt,
    })).collect();
    json!({
        "schema":"vivim.wiki-source-search/1","outcome":"computed",
        "wikiRevision":found.revision,"wikiDigest":found.digest,
        "scannedPages":found.scanned_pages,"totalPages":found.pages_total,
        "indexedSections":found.indexed_sections,"indexTruncated":found.index_truncated,
        "matches":found.matches,"results":rows,
        "scope":"bounded-source-index","authority":"none",
        "executionAuthorized":false,"effectPerformed":false
    })
}


// Exact, bounded revision-to-revision Wiki change projection over Host-observed
// source. Never turns an observed change into an authorization or journal event.
// @hq:capability vivim.rust-wiki-source-delta@1
const MAX_SOURCE_DELTA_EVENTS:usize=48;
fn complete_delta_pages(wiki:&Value)->Option<&serde_json::Map<String,Value>>{
    let pages=wiki["pages"].as_object()?;
    for (name,page) in pages {
        if !name_ok(name){return None}
        let sections=page["sections"].as_object()?;
        for (title,body) in sections {
            if !name_ok(title)||!body.is_string(){return None}
        }
        if let Some(links)=page.get("links") {
            if !links.as_array()?.iter().all(|target|
                target.as_str().is_some_and(name_ok)){return None}
        }
    }
    Some(pages)
}
pub fn source_delta(input:&Value)->Value{
    let refused=|code:&str|json!({
        "schema":"vivim.wiki-source-delta/1","outcome":"refused",
        "code":code,"authority":"none","executionAuthorized":false,
        "effectPerformed":false
    });
    let current=&input["current"];
    let Ok(next)=read(current)else{return refused("INVALID_CURRENT_SOURCE")};
    let Some(current_pages)=complete_delta_pages(current)
        else{return refused("INVALID_CURRENT_SOURCE")};
    let current_stamp=json!({"revision":next.revision,"digest":next.digest,
        "pagesTotal":next.pages_total});
    let previous=&input["previous"];
    if previous.is_null(){
        return json!({
            "schema":"vivim.wiki-source-delta/1","outcome":"baseline",
            "from":null,"to":current_stamp,"changedPages":0,
            "addedPages":0,"removedPages":0,"changedSections":0,
            "changedLinks":0,"totalEvents":0,"omittedEvents":0,"events":[],
            "authority":"none","executionAuthorized":false,"effectPerformed":false
        });
    }
    let Ok(old)=read(previous)else{return refused("INVALID_PREVIOUS_SOURCE")};
    let Some(old_pages)=complete_delta_pages(previous)
        else{return refused("INVALID_PREVIOUS_SOURCE")};
    if let Err(reason)=compare_source(
        Some((old.revision,&old.digest)),(next.revision,&next.digest)){
        return refused(match reason {
            ReadError::RevisionConflict=>"SOURCE_REVISION_CONFLICT",
            ReadError::InvalidProjection=>"INVALID_SOURCE_IDENTITY",
        })
    }
    let previous_stamp=json!({"revision":old.revision,"digest":old.digest,
        "pagesTotal":old.pages_total});
    let mut changed_pages=0usize;
    let mut added_pages=0usize;
    let mut removed_pages=0usize;
    let mut changed_sections=0usize;
    let mut changed_links=0usize;
    let mut total_events=0usize;
    let mut events=Vec::new();
    // Only source names and change kinds leave Rust, never private section text.
    let mut record=|kind:&str,page:&str,section:Option<&str>|{
        total_events+=1;
        if events.len()<MAX_SOURCE_DELTA_EVENTS {
            let mut row=json!({"kind":kind,"page":page});
            if let Some(section)=section{row["section"]=json!(section)}
            events.push(row);
        }
    };
    let pages:std::collections::BTreeSet<&str>=old_pages.keys()
        .chain(current_pages.keys()).map(String::as_str).collect();
    for page in pages {
        match (old_pages.get(page),current_pages.get(page)){
            (None,Some(_))=>{
                changed_pages+=1;added_pages+=1;
                record("page-added",page,None);
            },
            (Some(_),None)=>{
                changed_pages+=1;removed_pages+=1;
                record("page-removed",page,None);
            },
            (Some(before),Some(after))=>{
                let mut changed=false;
                if before.get("links")!=after.get("links"){
                    changed=true;changed_links+=1;
                    record("links-changed",page,None);
                }
                // complete_delta_pages checked every page's section map.
                let left=before["sections"].as_object().expect("validated sections");
                let right=after["sections"].as_object().expect("validated sections");
                let sections:std::collections::BTreeSet<&str>=left.keys()
                    .chain(right.keys()).map(String::as_str).collect();
                for section in sections {
                    let kind=match (left.get(section),right.get(section)){
                        (None,Some(_))=>Some("section-added"),
                        (Some(_),None)=>Some("section-removed"),
                        (Some(a),Some(b)) if a!=b=>Some("section-changed"),
                        _=>None,
                    };
                    if let Some(kind)=kind{
                        changed=true;changed_sections+=1;
                        record(kind,page,Some(section));
                    }
                }
                if changed{changed_pages+=1}
            },
            _=>{},
        }
    }
    json!({
        "schema":"vivim.wiki-source-delta/1",
        "outcome":if total_events==0{"unchanged"}else{"changed"},
        "from":previous_stamp,"to":current_stamp,
        "changedPages":changed_pages,"addedPages":added_pages,
        "removedPages":removed_pages,"changedSections":changed_sections,
        "changedLinks":changed_links,"totalEvents":total_events,
        "omittedEvents":total_events.saturating_sub(events.len()),
        "events":events,"authority":"none","executionAuthorized":false,
        "effectPerformed":false
    })
}
