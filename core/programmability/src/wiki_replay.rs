//! Host-owned product journal, replayed by deterministic Rust in the pure kernel.
//! No disk, tokens, mutation authority, grants, or effects. The Host validates
//! each stored envelope and supplies the ordered source records.
//! Property arrays preserve JS page/section order for exact pagesDigest parity.
use serde_json::{json, Value};
use std::collections::HashSet;

const SCHEMA:&str="vivim.wiki-journal-replay/1";
fn refused(code:&str)->Value{
    json!({"schema":SCHEMA,"outcome":"refused","code":code,
        "authority":"none","executionAuthorized":false,"effectPerformed":false})
}
fn name_ok(s:&str)->bool{
    let b=s.as_bytes();
    !b.is_empty()&&b.len()<=80&&b[0].is_ascii_alphabetic()&&
        b[1..].iter().all(|c|c.is_ascii_alphanumeric()||b" _.-".contains(c))
}
fn slug_ok(s:&str)->bool{
    let b=s.as_bytes();
    !b.is_empty()&&b.len()<=63&&b[0].is_ascii_alphabetic()&&
        b[1..].iter().all(|c|c.is_ascii_alphanumeric()||*c==b'-')&&
        !matches!(s.to_ascii_lowercase().as_str(),"__proto__"|"constructor"|"prototype")
}
fn fields(page:&Value)->Option<&Vec<Value>>{page.get("fields")?.as_array()}
fn fields_mut(page:&mut Value)->Option<&mut Vec<Value>>{page.get_mut("fields")?.as_array_mut()}
fn prop<'a>(page:&'a Value,key:&str)->Option<&'a Value>{
    fields(page)?.iter().find(|field|field[0]==key).and_then(|f|f.get(1))
}
fn prop_mut<'a>(page:&'a mut Value,key:&str)->Option<&'a mut Value>{
    fields_mut(page)?.iter_mut().find(|field|field[0]==key)
        .and_then(|f|f.as_array_mut()).and_then(|row|row.get_mut(1))
}
fn section_mut<'a>(page:&'a mut Value,section:&str)->Option<&'a mut Value>{
    prop_mut(page,"sections")?.as_array_mut()?.iter_mut()
        .find(|field|field[0]==section)
        .and_then(Value::as_array_mut).and_then(|row|row.get_mut(1))
}
fn has_section(page:&Value,section:&str)->bool{
    prop(page,"sections").and_then(Value::as_array)
        .is_some_and(|rows|rows.iter().any(|row|row[0]==section))
}
fn index(pages:&[Value],name:&str)->Option<usize>{
    let mut found=None;
    for (i,page) in pages.iter().enumerate(){
        if page["name"].as_str()?.eq_ignore_ascii_case(name){
            if found.is_some(){return None}
            found=Some(i);
        }
    }
    found
}
fn validate_pages(pages:&[Value])->bool{
    let mut seen=HashSet::new();
    for page in pages {
        let Some(name)=page["name"].as_str().filter(|s|name_ok(s))
            else{return false};
        if !seen.insert(name.to_ascii_lowercase()){return false}
        let Some(pairs)=fields(page)else{return false};
        let mut keys=HashSet::new();
        for field in pairs{
            let Some(pair)=field.as_array().filter(|v|v.len()==2)else{return false};
            let Some(key)=pair[0].as_str()else{return false};
            if !keys.insert(key){return false}
            if key=="sections"{
                let Some(sections)=pair[1].as_array()else{return false};
                let mut sections_seen=HashSet::new();
                for s in sections {
                    let Some(item)=s.as_array().filter(|v|v.len()==2)else{return false};
                    let Some(section)=item[0].as_str().filter(|s|name_ok(s))
                        else{return false};
                    if !sections_seen.insert(section)||!item[1].is_string(){return false}
                }
            }
        }
        if !keys.contains("sections"){return false}
    }
    true
}
fn edit_section(pages:&mut Vec<Value>,edit:&Value,revision:u64)->Result<(),&'static str>{
    let Some(action)=edit["action"].as_str()else{return Err("INVALID_EDIT")};
    let Some(page_name)=edit["page"].as_str().filter(|s|name_ok(s))
        else{return Err("INVALID_EDIT")};
    let Some(section)=edit["section"].as_str().filter(|s|name_ok(s))
        else{return Err("INVALID_EDIT")};
    let Some(content)=edit["content"].as_str()else{return Err("INVALID_EDIT")};
    if content.len()>3072{return Err("INVALID_EDIT")}
    match action {
        "set-section"=>{
            let Some(n)=pages.iter().position(|p|p["name"]==page_name)
                else{return Err("UNKNOWN_SECTION")};
            if !has_section(&pages[n],section){return Err("UNKNOWN_SECTION")}
            if page_name.starts_with("task-")&&page_name.len()==37&&
                page_name[5..].bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))&&
                section=="Status"&&has_section(&pages[n],"Task")&&
                !matches!(content,"Open"|"Done"){return Err("INVALID_TASK_STATUS")}
            let Some(slot)=section_mut(&mut pages[n],section)else{return Err("UNKNOWN_SECTION")};
            *slot=json!(content);
        },
        "capture-note"|"capture-task"=>{
            let task=action=="capture-task";
            let prefix=if task{"task-"}else{"note-"};
            if !page_name.starts_with(prefix)||page_name.len()!=prefix.len()+32||
                !page_name[prefix.len()..].bytes()
                    .all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b))||
                section!=(if task{"Task"}else{"Note"}){return Err("INVALID_CAPTURE")}
            if pages.len()>=256{return Err("PAGE_CAPACITY")}
            if pages.iter().any(|p|p["name"].as_str()
                .is_some_and(|old|old.eq_ignore_ascii_case(page_name))){
                return Err("PAGE_EXISTS")
            }
            let mut sections=vec![json!([section,content])];
            if task{sections.push(json!(["Status","Open"]));}
            pages.push(json!({"name":page_name,"fields":[["sections",sections]]}));
        },
        _=>return Err("INVALID_EDIT")
    }
    let _=revision;
    Ok(())
}
fn edit_structure(pages:&mut Vec<Value>,edit:&Value)->Result<(),&'static str>{
    match edit["action"].as_str(){
        Some("create-page")=>{
            let Some(name)=edit["page"].as_str().filter(|s|slug_ok(s))
                else{return Err("INVALID_STRUCTURE")};
            if pages.len()>=256{return Err("PAGE_CAPACITY")}
            if pages.iter().any(|p|p["name"].as_str()
                .is_some_and(|old|old.eq_ignore_ascii_case(name))){return Err("PAGE_EXISTS")}
            pages.push(json!({"name":name,"fields":[["sections",[["About",""]]]]}));
        },
        Some("move-page")=>{
            let Some(name)=edit["page"].as_str().filter(|s|name_ok(s))
                else{return Err("INVALID_STRUCTURE")};
            let Some(position)=edit["position"].as_str()
                else{return Err("INVALID_STRUCTURE")};
            let Some(from)=index(pages,name)else{return Err("UNKNOWN_PAGE")};
            if pages[from]["name"]!=name{return Err("NONCANONICAL_PAGE")}
            let to=match position{
                "top"=>0,"bottom"=>pages.len()-1,
                "up"=>from.saturating_sub(1),
                "down"=>(from+1).min(pages.len()-1),
                _=>return Err("INVALID_STRUCTURE")
            };
            if from==to{return Err("NO_CHANGE")}
            let moved=pages.remove(from);
            pages.insert(to,moved);
        },
        Some("link-pages")=>{
            let Some(from_name)=edit["from"].as_str().filter(|s|name_ok(s))
                else{return Err("INVALID_STRUCTURE")};
            let Some(to_name)=edit["to"].as_str().filter(|s|name_ok(s))
                else{return Err("INVALID_STRUCTURE")};
            let Some(from)=index(pages,from_name)else{return Err("UNKNOWN_PAGE")};
            let Some(to)=index(pages,to_name)else{return Err("UNKNOWN_PAGE")};
            if from==to{return Err("SELF_LINK")}
            if pages[from]["name"]!=from_name||pages[to]["name"]!=to_name{
                return Err("NONCANONICAL_PAGE")
            }
            let old=prop(&pages[from],"links");
            if old.is_some_and(|value|!value.is_array()){return Err("INVALID_LINKS")}
            let mut links=old.and_then(Value::as_array).cloned().unwrap_or_default();
            if links.len()>=128||links.iter().any(|link|link==to_name){return Err("DUPLICATE_LINK")}
            links.push(json!(to_name));
            if let Some(slot)=prop_mut(&mut pages[from],"links"){
                *slot=json!(links);
            }else{
                let Some(parts)=fields_mut(&mut pages[from])else{return Err("INVALID_PAGE")};
                parts.push(json!(["links",links]));
            }
        },
        _=>return Err("INVALID_STRUCTURE")
    }
    Ok(())
}
pub fn replay(input:&Value)->Value{
    if input["schema"]!="vivim.wiki-journal-replay-input/1"{
        return refused("INVALID_SOURCE")
    }
    let Some(mut revision)=input["wikiRevision"].as_u64()else{return refused("INVALID_REVISION")};
    let Some(mut pages)=input["pages"].as_array().cloned()else{return refused("INVALID_PAGES")};
    if pages.len()>256||!validate_pages(&pages){return refused("INVALID_PAGES")}
    let Some(records)=input["records"].as_array()else{return refused("INVALID_RECORDS")};
    let Some(seed_at)=input["seedAt"].as_str()else{return refused("INVALID_SEED")};
    let mut at=if seed_at.is_empty(){"1970-01-01T00:00:00.000Z".to_owned()}
        else{seed_at.to_owned()};
    let mut ids=HashSet::new();
    let mut chat=Vec::new();
    let mut product_revision=0u64;
    for (i,e) in records.iter().enumerate(){
        if !e["entryId"].is_null() {
            let Some(id)=e["entryId"].as_str()else{return refused("INVALID_ENTRY_ID")};
            if !ids.insert(id)||e["sequence"].as_u64()!=Some((i+1)as u64){
                return refused("INVALID_SEQUENCE")
            }
        }
        match e["kind"].as_str(){
            Some("chat-send")=>{
                let Some(received)=e["receivedAt"].as_str()else{return refused("INVALID_DATE")};
                let Some(actor)=e["actor"].as_str()else{return refused("INVALID_ACTOR")};
                let Some(text)=e["text"].as_str()else{return refused("INVALID_CHAT")};
                product_revision+=1;
                chat.push(json!({"actor":actor,
                    "who":if actor=="owner-browser"||actor=="human"{"user"}else{"system"},
                    "text":text,"schemaVersion":e["schemaVersion"],
                    "at":received,"intent":e["intent"],"revision":product_revision}));
                at=received.to_owned();
            },
            Some("wiki-edit")|Some("wiki-structure")=>{
                if e["expectedRevision"].as_u64()!=Some(revision){
                    return refused("STALE_WIKI_REVISION")
                }
                let result=if e["kind"]=="wiki-edit"{
                    edit_section(&mut pages,&e["edit"],revision)
                }else{
                    edit_structure(&mut pages,&e["edit"])
                };
                if let Err(code)=result{return refused(code)}
                revision+=1;product_revision+=1;
                let Some(received)=e["receivedAt"].as_str()else{return refused("INVALID_DATE")};
                at=received.to_owned();
            },
            Some("gate-decision")|Some("feedback-round")=>{},
            _=>return refused("INVALID_KIND"),
        }
    }
    json!({"schema":SCHEMA,"outcome":"computed","pages":pages,
        "chatEntries":chat,"wikiRevision":revision,
        "productRevision":product_revision,"journalRevision":records.len(),
        "lastAt":at,"authority":"none",
        "executionAuthorized":false,"effectPerformed":false})
}
