//! Read-only development intelligence against the existing graph.
//! @hq:capability hqkg.development-query@1
//! @hq:consumes hqkg.semantic-source-query@1
//! @hq:consumes hqkg.indexed-native-program@1
//! No graph mutations, personal data, provider calls or Host effect grants.
use hqkg::{Error,Graph,Journal,Result};
use hqkg::semantic_source;
use hqkg::native_program::{DevelopmentSession, SemanticProgram, SemanticTask};
use hqkg::development_relations;
use hqkg::engine::{Budget,CancellationToken,EngineRegistry};
use hqkg::development_engine::install_development_engine;
use hqkg::typed_dag::{GraphDomain,Namespace,RevisionToken,IncrementalCache,RunState,DagReport};
use vivim_programmability_core::{DataClass,PolicyLimits,Risk,Program,SourceRef,TransformStep,TransformKind,wire};
use serde_json::{json,Value};
use std::{fs,io::{self,Read},path::Path};
const SCHEMA:&str="hqkg.development-query/1";
fn open(path:&Path)->Result<Graph>{
    let meta=fs::symlink_metadata(path)?;
    if !path.is_absolute()||!meta.is_file()||meta.file_type().is_symlink(){
        return Err(Error::Invalid("development journal unavailable".into()))
    }
    Journal::new(path).load()
}
fn query(graph:&Graph,operation:&str,key:&str,extra:Option<&str>)->Result<Value>{
    let rows=match operation{
        "sources"=>{
            let result=semantic_source::sources(graph,key)?;
            let mut rows=Vec::new();
            for a in result.anchors{
                let file=graph.node(&a.file_id).ok_or_else(||Error::Corrupt("missing source".into()))?;
                rows.push(json!({"fileId":a.file_id,"path":a.path,"revision":file.version,
                    "digest":a.content_digest,"anchorId":a.anchor_id,"annotation":a.annotation_kind,
                    "state":a.state,"line":a.first_line,"occurrences":a.occurrence_count}));
            }
            json!({"anchors":rows})
        }
        "symbols"=>json!({"symbols":semantic_source::symbols(graph,key)?.into_iter().map(|s|json!({
            "id":s.id,"fileId":s.file_id,"path":s.path,"name":s.name,"kind":s.kind,"line":s.first_line,
            "occurrences":s.occurrence_count,"state":s.state,"digest":s.content_digest
        })).collect::<Vec<_>>()}),
        "wiring"=>{
            let node=graph.node(key).ok_or_else(||Error::Missing("indexed source file absent".into()))?;
            if node.kind.as_str()!="source-file"
                ||node.properties.get("hqkg.exchange.source").map(String::as_str)!=Some("repos-hq.index"){
                return Err(Error::Invalid("source-file graph identity required".into()))
            }
            let imports=development_relations::imports(graph,key,false,3)?;
            let dependents=development_relations::imports(graph,key,true,3)?;
            let semantics=development_relations::semantic(graph,key)?;
            let truncated=imports.truncated||dependents.truncated||semantics.truncated;
            json!({"source":{"fileId":key,"path":node.properties.get("source_path"),
                "revision":node.version,"digest":node.properties.get("content_sha256")},
                "imports":imports.nodes,"dependents":dependents.nodes,
                "semanticObservations":semantics.observations,
                "potentialWiring":semantics.potential_wiring,
                "truncated":truncated,
                "depthLimited":imports.depth_limited||dependents.depth_limited,
                "resultLimited":imports.result_limited||dependents.result_limited||semantics.truncated,
                "returnsToSource":imports.returns_to_source||dependents.returns_to_source,
                "evidence":"static-indexed-only"})
        }
        "impact"=>{
            let depth=extra.unwrap_or("3").parse().map_err(|_|Error::Invalid("invalid depth".into()))?;
            let result=semantic_source::impact(graph,key,depth)?;
            json!({"files":result.files.into_iter().map(|(path,depth)|json!({"path":path,"depth":depth})).collect::<Vec<_>>(),"truncated":result.truncated})
        }
        _=>return Err(Error::Invalid("unknown development operation".into()))
    };
    Ok(json!({"schema":SCHEMA,"state":"indexed-snapshot","authority":"read-only",
        "operation":operation,"epoch":graph.epoch(),"key":key,"result":rows}))
}
fn fixed_policy()->PolicyLimits{
    PolicyLimits{id:"development-preview".into(),revision:1,max_risk:Risk::R0,
        max_input_class:DataClass::Internal,max_output_class:DataClass::Internal,
        allowed_destinations:Default::default(),allow_effect_candidates:false}
}
fn compute_program(graph:&Graph,epoch:u64,program:&Program,operation:&str)->Result<Value>{
    let expected=RevisionToken{namespace:Namespace{domain:GraphDomain::Development,owner:"local-hq".into()},graph_epoch:epoch};
    let registry=EngineRegistry::new();
    // Use the source-backed graph engine, not the former fingerprint-only engine.
    install_development_engine(&registry,graph.clone())?;
    let mut cache=IncrementalCache::new();
    let report=hqkg::native_program::run_indexed_program(graph,&expected,program,&fixed_policy(),
        &registry,&mut cache,Budget::default(),&CancellationToken::new())?;
    format_report(report,epoch,program,operation)
}
fn format_report(report:DagReport,epoch:u64,program:&Program,operation:&str)->Result<Value>{
    if report.state!=RunState::Complete{
        return Err(Error::Conflict(format!("development computation incomplete: {:?}; step={}; reason={}",
            report.state, report.failed_step.as_deref().unwrap_or("none"), report.failure.as_deref().unwrap_or("not available"))))
    }
    let mut outputs=Vec::new();
    let mut complete=true;
    for out in report.outputs{
        let value:Value=serde_json::from_str(&out.data)
            .map_err(|_|Error::Corrupt("native graph engine returned invalid structured output".into()))?;
        if value["schema"]!="hqkg.development-transform/1"||value["authority"]!="none"
            ||value["executionAuthorized"]!=false||value["effectPerformed"]!=false
            ||value["graphEpoch"].as_u64()!=Some(epoch)||!value["truncated"].is_boolean(){
            return Err(Error::Corrupt("native graph transform contract mismatch".into()))
        }
        complete &= value["truncated"] == false;
        outputs.push(json!({"stepId":out.step_id,"generation":out.generation,
            "state":format!("{:?}",out.state).to_lowercase(),"result":value}));
    }
    Ok(json!({"schema":SCHEMA,"state":"computed","authority":"read-only",
        "operation":operation,"computation":"source-backed-graph","epoch":epoch,
        "programId":program.id,"programRevision":program.revision,
        "outputs":outputs,"complete":complete,"executionAuthorized":false,"effectPerformed":false}))
}
fn semantic_projection(compiled:SemanticProgram,report:DagReport,epoch:u64,semantic_id:&str,task:SemanticTask)->Result<Value>{
    let mut result=format_report(report,epoch,&compiled.program,"semantic-program")?;
    result["semanticId"]=json!(semantic_id);
    result["task"]=json!(task.name());
    result["semanticAnchor"]=json!({"id":compiled.anchor.anchor_id,"fileId":compiled.anchor.file_id,
        "path":compiled.anchor.path,"digest":compiled.anchor.content_digest,
        "annotation":compiled.anchor.annotation_kind,"state":compiled.anchor.state,
        "line":compiled.anchor.first_line,"occurrences":compiled.anchor.occurrence_count});
    Ok(result)
}
fn revision(epoch:u64)->RevisionToken{
    RevisionToken{namespace:Namespace{domain:GraphDomain::Development,owner:"local-hq".into()},graph_epoch:epoch}
}
fn semantic_program(graph:Graph,semantic_id:&str,task:SemanticTask)->Result<Value>{
    let expected=revision(graph.epoch());
    let mut session=DevelopmentSession::new(graph,expected.clone())?;
    let (compiled,report)=session.execute_semantic(&expected,semantic_id,task,&fixed_policy(),Budget::default(),&CancellationToken::new())?;
    semantic_projection(compiled,report,expected.graph_epoch,semantic_id,task)
}

/// One explicitly epoch-pinned finite batch, never an open-ended service.
/// No partial response on failure; no new process authority or source grant.
fn semantic_batch(graph:Graph,epoch:u64)->Result<Value>{
    const MAX_BATCH_BYTES:usize=16*1024;
    const MAX_BATCH_REQUESTS:usize=32;
    const MAX_BATCH_OUTPUT:usize=1024*1024;
    let mut input=String::new();
    io::stdin().lock().take((MAX_BATCH_BYTES+1) as u64).read_to_string(&mut input)?;
    if input.len()>MAX_BATCH_BYTES{return Err(Error::Invalid("semantic batch input exceeds budget".into()))}
    let batch:Value=serde_json::from_str(&input).map_err(|_|Error::Invalid("invalid semantic batch envelope".into()))?;
    let object=batch.as_object().filter(|o|o.len()==2 && o.contains_key("schema") && o.contains_key("requests"))
        .ok_or_else(||Error::Invalid("invalid semantic batch fields".into()))?;
    let rows=object["requests"].as_array().ok_or_else(||Error::Invalid("semantic batch requests must be an array".into()))?;
    if object["schema"]!="hqkg.semantic-batch/1"||rows.is_empty()||rows.len()>MAX_BATCH_REQUESTS{
        return Err(Error::Invalid("semantic batch schema or request count refused".into()))
    }
    let mut requests=Vec::new();
    for row in rows{
        let row=row.as_object().filter(|o|o.len()==2 && o.contains_key("semanticId") && o.contains_key("task"))
            .ok_or_else(||Error::Invalid("invalid semantic request fields".into()))?;
        let key=row["semanticId"].as_str().filter(|k|!k.is_empty()&&k.len()<=180)
            .ok_or_else(||Error::Invalid("invalid semantic batch key".into()))?;
        let task=row["task"].as_str().ok_or_else(||Error::Invalid("invalid semantic batch task".into()))?;
        requests.push((key.to_owned(),SemanticTask::parse(task)?));
    }
    let expected=revision(epoch);
    let mut session=DevelopmentSession::new(graph,expected.clone())?;
    let policy=fixed_policy();
    let cancel=CancellationToken::new();
    let mut results=Vec::new();
    let mut bytes=0usize;
    let start=std::time::Instant::now();
    let budget=Budget::default();
    for (key,task) in requests{
        let remaining=budget.max_elapsed_ms.saturating_sub(start.elapsed().as_millis());
        if remaining==0{return Err(Error::Invalid("semantic batch elapsed budget exhausted".into()))}
        let (compiled,report)=session.execute_semantic(&expected,&key,task,&policy,
            Budget{max_elapsed_ms:remaining,..budget},&cancel)?;
        let row=semantic_projection(compiled,report,epoch,&key,task)?;
        bytes=bytes.checked_add(row.to_string().len()).ok_or_else(||Error::Invalid("semantic batch output overflow".into()))?;
        if bytes>MAX_BATCH_OUTPUT{return Err(Error::Invalid("semantic batch output exceeds budget".into()))}
        results.push(row);
    }
    if start.elapsed().as_millis()>budget.max_elapsed_ms{return Err(Error::Invalid("semantic batch elapsed budget exhausted".into()))}
    let complete=results.iter().all(|r|r["complete"]==true);
    Ok(json!({"schema":"hqkg.semantic-batch/1","epoch":epoch,"authority":"read-only",
        "complete":complete,"results":results,"executionAuthorized":false,"effectPerformed":false}))
}
fn execute_program(graph:&Graph,epoch:u64)->Result<Value>{
    let mut input=String::new();
    io::stdin().lock().take(65_537).read_to_string(&mut input)?;
    let (program,_caller_policy)=wire::decode_json(&input).map_err(|e|Error::Invalid(e.into()))?;
    compute_program(graph,epoch,&program,"program")
}
/// One real source-file identity, directly from the imported development graph.
/// No fabricated documents or caller-controlled source digest or policy.
fn compute_source(graph:&Graph,id:&str)->Result<Value>{
    let node=graph.node(id).ok_or_else(||Error::Missing("indexed source file not found".into()))?;
    if node.kind.as_str()!="source-file"||
        node.properties.get("hqkg.exchange.source").map(String::as_str)!=Some("repos-hq.index"){
        return Err(Error::Invalid("not an imported development source file".into()))
    }
    let digest=node.properties.get("content_sha256")
        .ok_or_else(||Error::Corrupt("indexed source digest absent".into()))?;
    let source=SourceRef{source_id:node.id.clone(),revision:node.version,digest:digest.clone(),
        data_class:DataClass::Internal};
    let steps=[
        ("source",TransformKind::SelectContext,vec![]),
        ("semantics",TransformKind::Interpret,vec!["source".into()]),
        ("impact",TransformKind::Evaluate,vec!["source".into()]),
        ("view",TransformKind::Project,vec!["semantics".into(),"impact".into()])
    ].into_iter().map(|(id,kind,dependencies)|TransformStep{
        id:id.into(),kind,dependencies,inputs:vec![source.clone()],
        output_data_class:DataClass::Internal,risk:Risk::R0,destination:None
    }).collect();
    let program=Program{id:format!("dev.{}",node.id),revision:node.version,
        policy_id:"development-preview".into(),policy_revision:1,steps};
    compute_program(graph,graph.epoch(),&program,"compute")
}
fn run()->Result<Value>{
    let args=std::env::args().skip(1).collect::<Vec<_>>();
    if args.len()<3||args.len()>4{return Err(Error::Invalid("usage: hqkg-development <absolute-journal> sources|symbols|impact|wiring <key> [depth] | program <epoch> | compute <source-file-id> | semantic-program <semantic-id> inspect|impact|compose | semantic-batch <epoch>".into()))}
    let graph=open(Path::new(&args[0]))?;
    if args[1]=="semantic-batch"{
        if args.len()!=3{return Err(Error::Invalid("semantic-batch requires exact graph epoch".into()))}
        return semantic_batch(graph,args[2].parse().map_err(|_|Error::Invalid("invalid graph epoch".into()))?)
    }
    if args[1]=="semantic-program"{
        if args.len()!=4{return Err(Error::Invalid("semantic-program requires exact semantic ID and task".into()))}
        return semantic_program(graph,&args[2],SemanticTask::parse(&args[3])?);
    }
    graph.check_indexes()?;
    if args[1]=="compute"{
        if args.len()!=3{return Err(Error::Invalid("compute requires one exact source-file ID".into()))}
        return compute_source(&graph,&args[2])
    }
    if args[1]=="program"{
        if args.len()!=3{return Err(Error::Invalid("program requires exact graph epoch".into()))}
        return execute_program(&graph,args[2].parse().map_err(|_|Error::Invalid("invalid graph epoch".into()))?)
    }
    if args.len()==4&&args[1]!="impact"{return Err(Error::Invalid("unexpected argument".into()))}
    query(&graph,&args[1],&args[2],args.get(3).map(String::as_str))
}
fn main(){match run(){
    Ok(v)=>println!("{v}"),
    Err(e)=>{eprintln!("hqkg-development: {e}");std::process::exit(2);}
}}
