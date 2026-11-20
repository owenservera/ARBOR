#![cfg(feature="importer")]
use hqkg::{Graph,Node,NodeKind,Edge,Journal};
use hqkg::import::{Exchange,Manifest};
use hqkg::semantic_source::{sources,impact};
use std::collections::BTreeMap;
fn fixture()->Exchange{
    let mut nodes=BTreeMap::new();
    for (id,kind,path) in [("f","source-file","arbor/core.rs"),("g","source-file","arbor/main.rs"),("a","semantic-file-anchor","arbor/core.rs"),("s","semantic-id","")]{
        let mut n=Node::new(id,NodeKind::Other(kind.into()),id);
        n.properties.insert("hqkg.exchange.source".into(),"repos-hq.index".into());
        n.properties.insert("source_path".into(),path.into());
        n.properties.insert("content_sha256".into(),"a".repeat(64));
        if id=="a"||id=="s"{n.properties.insert("semantic_id".into(),"vivim.native-visual-validation@1".into());}
        if id=="a"{for(k,v)in[("annotation_kind","capability"),("status","indexed-not-live-checked"),("first_line","2"),("occurrence_count","1")]{n.properties.insert(k.into(),v.into());}}
        nodes.insert(id.into(),n);
    }
    let mut edges=BTreeMap::new();
    for(id,from,relation,to)in[("e1","f","has-semantic-anchor","a"),("e2","a","references-semantic-id","s"),("e3","g","imports","f")]{
        let mut e=Edge::new(id,from,relation,to);
        e.properties.insert("hqkg.exchange.source".into(),"repos-hq.index".into());
        edges.insert(id.into(),e);
    }
    Exchange{manifest:Manifest{source:"repos-hq.index".into(),digest:String::new(),node_count:nodes.len(),edge_count:edges.len(),tombstone_count:0,reconcile_edges:true},nodes,edges,tombstones:Default::default()}
}
#[test]fn semantic_query_reads_real_journal_and_reverse_imports(){
    let mut g=Graph::new();fixture().apply(&mut g).unwrap();
    let path=std::env::temp_dir().join(format!("hqkg-semantic-source-{}.hqj",std::process::id()));
    let _=std::fs::remove_file(&path);let journal=Journal::new(&path);journal.save(&g).unwrap();
    let g=journal.load().unwrap();let id="vivim.native-visual-validation@1";
    assert_eq!(sources(&g,id).unwrap().anchors[0].path,"arbor/core.rs");
    assert_eq!(impact(&g,id,1).unwrap().files,vec![("arbor/core.rs".into(),0),("arbor/main.rs".into(),1)]);
    assert!(sources(&g,"unknown@1").is_err());assert!(impact(&g,id,9).is_err());
    let _=std::fs::remove_file(path);
}
#[test]fn conflicting_digest_refuses_anchor(){
    let mut e=fixture();e.nodes.get_mut("a").unwrap().properties.insert("content_sha256".into(),"b".repeat(64));
    let mut g=Graph::new();e.apply(&mut g).unwrap();assert!(sources(&g,"vivim.native-visual-validation@1").is_err());
}

#[test]fn symbol_lookup_preserves_ambiguous_group(){
    let mut e=fixture();
    let mut n=Node::new("symbol",NodeKind::Other("source-symbol".into()),"validate");
    for(k,v)in[("hqkg.exchange.source","repos-hq.index"),("source_path","arbor/core.rs"),("symbol_name","validate"),("symbol_kind","function"),("status","ambiguous"),("first_line","4"),("occurrence_count","2")]{n.properties.insert(k.into(),v.into());}
    n.properties.insert("content_sha256".into(),"a".repeat(64));e.nodes.insert(n.id.clone(),n);
    let mut edge=Edge::new("symbol-edge","f","contains-indexed-symbol","symbol");
    edge.properties.insert("hqkg.exchange.source".into(),"repos-hq.index".into());e.edges.insert(edge.id.clone(),edge);
    let mut g=Graph::new();e.apply(&mut g).unwrap();
    let rows=hqkg::semantic_source::symbols(&g,"validate").unwrap();
    assert_eq!(rows.len(),1);assert_eq!(rows[0].occurrence_count,2);assert_eq!(rows[0].state,"ambiguous");
    assert!(hqkg::semantic_source::symbols(&g,"missing").unwrap().is_empty());
}
