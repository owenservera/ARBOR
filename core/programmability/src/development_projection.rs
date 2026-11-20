//! Read-only HQKG development projection shared across native desktop and product kernel.
//! @hq:capability vivim.rust-development-projection@1
//! @hq:consumes hqkg.development-query@1
//! No graph writes, credentials, Git subprocesses or Host execution rights.
use serde_json::{json,Value};
#[derive(Debug,Clone,Copy,PartialEq,Eq)]
pub enum ProjectionError { InvalidInput, Unavailable, InvalidProjection }
fn limit(s:&str)->String { s.chars().take(160).collect() }
fn required<'a>(v:&'a Value,field:&str)->Result<&'a str,ProjectionError>{
    v[field].as_str().filter(|s|!s.is_empty()).ok_or(ProjectionError::InvalidProjection)
}
fn hex_ref(key:&str)->bool{
    key.strip_prefix("hqg1:").is_some_and(|digest|digest.len()==64&&
        digest.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)))
}
pub fn valid_query(operation:&str,key:&str)->bool{
    if !matches!(operation,"sources"|"symbols"|"impact"|"wiring"|"compute")
        ||key.is_empty()||key.len()>180||key.chars().any(char::is_control){return false}
    if matches!(operation,"impact"|"wiring"|"compute"){hex_ref(key)}else{true}
}
pub fn render(operation:&str,data:&Value)->Result<String,ProjectionError>{
    if !matches!(operation,"sources"|"symbols"|"impact"|"wiring"|"compute")
        ||data["schema"]!="hqkg.development-query/1"
        ||data["authority"]!="read-only"
        ||data["operation"]!=operation {return Err(ProjectionError::InvalidProjection)}
    let epoch=data["epoch"].as_u64().ok_or(ProjectionError::InvalidProjection)?;
    let mut lines=vec![format!("HQKG · {operation} · epoch {epoch} · indexed observations only")];
    if operation=="compute"{
        if data["state"]!="computed"||data["computation"]!="source-backed-graph"
            ||data["executionAuthorized"]!=false||data["effectPerformed"]!=false{
            return Err(ProjectionError::InvalidProjection)
        }
        let rows=data["outputs"].as_array().ok_or(ProjectionError::InvalidProjection)?;
        for row in rows.iter().take(8){
            let result=&row["result"];
            if result["schema"]!="hqkg.development-transform/1"||result["authority"]!="none"{
                return Err(ProjectionError::InvalidProjection)
            }
            lines.push(format!("{} · {} · {} sources · {} imports · {} symbols · {} semantics · {} reverse dependencies",
                limit(required(row,"stepId")?),limit(required(result,"operation")?),
                result["sourceCount"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                result["importCount"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                result["symbolCount"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                result["semanticCount"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                result["dependentCount"].as_u64().ok_or(ProjectionError::InvalidProjection)?));
            if let Some(wires)=result["potentialWiring"].as_array(){
                for wire in wires.iter().take(12){
                    lines.push(format!("  Possible {} · {} · {}",
                        limit(required(wire,"role")?),limit(required(wire,"semanticId")?),
                        limit(required(wire,"peerPath")?)));
                }
            }
            if result["truncated"]==true{lines.push("  Dependency traversal capped; result is partial".into());}
            if let Some(sources)=result["sources"].as_array(){
                for item in sources.iter().take(4){
                    if let Some(path)=item["path"].as_str(){lines.push(format!("  {}",limit(path)));}
                }
            }
        }
        if rows.len()>8{lines.push(format!("{} more compute steps omitted",rows.len()-8))}
        return Ok(lines.join("\n"));
    }
    if data["state"]!="indexed-snapshot"{return Err(ProjectionError::Unavailable)}
    let result=&data["result"];
    match operation{
        "symbols"=>{
            let rows=result["symbols"].as_array().ok_or(ProjectionError::InvalidProjection)?;
            lines.push(format!("{} indexed matching symbols",rows.len()));
            for row in rows.iter().take(30){
                lines.push(format!("{} · {}:{} · symbol {} · file {}",
                    limit(required(row,"name")?),limit(required(row,"path")?),
                    row["line"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                    limit(required(row,"id")?),limit(required(row,"fileId")?)));
            }
            if rows.len()>30{lines.push(format!("{} more symbols omitted",rows.len()-30))}
            lines.push("Use the displayed file ID with Compute, Wiring or Impact; not the symbol ID.".into());
        }
        "sources"=>{
            let rows=result["anchors"].as_array().ok_or(ProjectionError::InvalidProjection)?;
            lines.push(format!("{} indexed semantic source anchors",rows.len()));
            for row in rows.iter().take(30){
                lines.push(format!("{} · {}:{} · {} · file {}",
                    limit(required(row,"annotation")?),limit(required(row,"path")?),
                    row["line"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                    limit(required(row,"state")?),limit(required(row,"fileId")?)));
            }
            if rows.len()>30{lines.push(format!("{} more source anchors omitted",rows.len()-30))}
        }
        "impact"=>{
            let rows=result["files"].as_array().ok_or(ProjectionError::InvalidProjection)?;
            lines.push(format!("{} indexed dependency-impact files",rows.len()));
            for row in rows.iter().take(40){
                lines.push(format!("Depth {} · {}",
                    row["depth"].as_u64().ok_or(ProjectionError::InvalidProjection)?,
                    limit(required(row,"path")?)));
            }
            if rows.len()>40{lines.push(format!("{} additional files omitted",rows.len()-40))}
            if result["truncated"]==true{lines.push("Impact traversal truncated by source budget".into());}
        }
        "wiring"=>{
            lines.push(format!("Source: {}",limit(required(&result["source"],"path")?)));
            for (title,field) in [
                ("Resolved transitive imports","imports"),
                ("Reverse import dependents","dependents"),
                ("Observed semantic identities","semanticObservations"),
                ("Possible producer/consumer wiring","potentialWiring")
            ] {
                let rows=result[field].as_array().ok_or(ProjectionError::InvalidProjection)?;
                lines.push(format!("{title} · {}",rows.len()));
                for row in rows.iter().take(16) {
                    let path=row["peerPath"].as_str().or_else(||row["path"].as_str());
                    let semantic=row["semanticId"].as_str();
                    let label=match (path,semantic){
                        (Some(path),Some(id))=>format!("{} · {}",limit(id),limit(path)),
                        (Some(path),None)=>limit(path),(None,Some(id))=>limit(id),
                        _=>String::new()
                    };
                    if !label.is_empty(){lines.push(format!("  {label}"))}
                }
                if rows.len()>16{lines.push(format!("  {} additional entries omitted",rows.len()-16))}
            }
            if result["truncated"]==true{lines.push("Some static relationships omitted at traversal bounds".into());}
        }
        _=>return Err(ProjectionError::InvalidInput),
    }
    Ok(lines.join("\n"))
}
/// Inert native/WASM transport for a validated graph response.
pub fn project(input:&Value)->Value{
    let operation=input["operation"].as_str().unwrap_or("");
    let invalid=|code:&str|json!({
        "schema":"vivim.development-projection/1","outcome":"refused",
        "code":code,"authority":"none","executionAuthorized":false,
        "effectPerformed":false
    });
    match render(operation,&input["response"]){
        Ok(text)=>json!({
            "schema":"vivim.development-projection/1","outcome":"computed",
            "text":text,"authority":"none","executionAuthorized":false,
            "effectPerformed":false
        }),
        Err(ProjectionError::Unavailable)=>invalid("GRAPH_UNAVAILABLE"),
        Err(_)=>invalid("INVALID_GRAPH_PROJECTION"),
    }
}
