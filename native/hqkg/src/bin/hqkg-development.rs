//! Read-only development intelligence against the existing graph.
//! @hq:capability hqkg.development-query@1
//! @hq:consumes hqkg.semantic-source-query@1
//! @hq:consumes hqkg.indexed-native-program@1
//! No graph mutations, personal data, provider calls or Host effect grants.
use hqkg::{Error,Graph,Journal,Result};
use hqkg::semantic_source;
use hqkg::engine::{Budget,CancellationToken,EngineRegistry,install_pure_engine};
use hqkg::typed_dag::{GraphDomain,Namespace,RevisionToken,IncrementalCache,RunState};
use vivim_programmability_core::{DataClass,PolicyLimits,Risk,wire};
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
            "id":s.id,"path":s.path,"name":s.name,"kind":s.kind,"line":s.first_line,
            "occurrences":s.occurrence_count,"state":s.state,"digest":s.content_digest
        })).collect::<Vec<_>>()}),
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
fn execute_program(graph:&Graph,epoch:u64)->Result<Value>{
    let mut input=String::new();
    io::stdin().lock().take(65_537).read_to_string(&mut input)?;
    let (program,_caller_policy)=wire::decode_json(&input).map_err(|e|Error::Invalid(e.into()))?;
    let policy=PolicyLimits{id:"development-preview".into(),revision:1,max_risk:Risk::R0,
        max_input_class:DataClass::Internal,max_output_class:DataClass::Internal,
        allowed_destinations:Default::default(),allow_effect_candidates:false};
    let expected=RevisionToken{namespace:Namespace{domain:GraphDomain::Development,owner:"local-hq".into()},graph_epoch:epoch};
    let registry=EngineRegistry::new();
    install_pure_engine(&registry,"builtin-development-metadata",None)?;
    let mut cache=IncrementalCache::new();
    let report=hqkg::native_program::run_indexed_program(graph,&expected,&program,&policy,
        &registry,&mut cache,Budget::default(),&CancellationToken::new())?;
    if report.state!=RunState::Complete{return Err(Error::Conflict("native program did not complete".into()))}
    Ok(json!({"schema":SCHEMA,"state":"computed","authority":"read-only",
        "operation":"program","computation":"metadata-fingerprint","epoch":graph.epoch(),
        "programId":program.id,"programRevision":program.revision,
        "outputs":report.outputs.into_iter().map(|o|json!({"stepId":o.step_id,"generation":o.generation,"result":o.data})).collect::<Vec<_>>(),
        "executionAuthorized":false,"effectPerformed":false}))
}
fn run()->Result<Value>{
    let args=std::env::args().skip(1).collect::<Vec<_>>();
    if args.len()<3||args.len()>4{return Err(Error::Invalid("usage: hqkg-development <absolute-journal> sources|symbols|impact <key> [depth] | program <epoch>".into()))}
    let graph=open(Path::new(&args[0]))?;
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
