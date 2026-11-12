//! @hq:context Data-only compute adapter exposing three research catalogs as bounded read-only queries.
//! @hq:owner repos-hq
//! @hq:invariant Research data is inert metadata. This adapter never runs papers, tools, models or provider actions.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{Error, Graph, Node, NodeKind, Result};
use std::sync::{Arc, RwLock};

pub struct ResearchCatalogCompute {
    pub graph: Arc<RwLock<Graph>>,
    pub implementation: String,
}
impl ResearchCatalogCompute {
    pub fn new(graph: Arc<RwLock<Graph>>) -> Self {
        Self {
            graph,
            implementation: "hqkg-catalog-read-v1".into(),
        }
    }
    fn kind(n: &Node) -> &str {
        match &n.kind {
            NodeKind::Other(s) => s.as_str(),
            x => x.as_str(),
        }
    }
    fn field<'a>(n: &'a Node, key: &str) -> &'a str {
        n.properties.get(key).map(String::as_str).unwrap_or("")
    }
    fn filtered(g: &Graph, kind: &str) -> Vec<String> {
        let mut rows = g
            .nodes()
            .filter(|n| Self::kind(n) == kind)
            .map(|n| format!("{}\t{}\t{}", n.id, n.title, Self::field(n, "status")))
            .collect::<Vec<_>>();
        rows.sort();
        rows.truncate(1000);
        rows
    }
    fn score(g: &Graph, file: &str) -> Result<String> {
        if file.is_empty() || file.len() > 128 {
            return Err(Error::Invalid(
                "expected bounded source file semantic ID".into(),
            ));
        }
        let record = g
            .nodes()
            .find(|n| {
                Self::kind(n) == "scoring-observation"
                    && n.properties.get("file_id").map(String::as_str) == Some(file)
            })
            .ok_or_else(|| {
                Error::Missing(format!("no provisional score observation for {file}"))
            })?;
        let mut result = vec![
            format!("file={file}"),
            "status=provisional_metadata_only".into(),
        ];
        for i in 1..=10 {
            let key = format!("F{i:02}");
            let value = record
                .properties
                .get(&key)
                .map(String::as_str)
                .unwrap_or("unknown");
            result.push(format!("{key}={value}"));
        }
        Ok(result.join("\n"))
    }
    fn resource(g: &Graph, id: &str) -> Result<String> {
        let n = g
            .nodes()
            .find(|n| {
                Self::kind(n) == "language-resource"
                    && n.properties.get("resource_id").map(String::as_str) == Some(id)
            })
            .ok_or_else(|| Error::Missing(format!("language resource not found: {id}")))?;
        Ok(format!(
            "resource={}\nfamily={}\nasset_mode={}\nasset_kinds={}\nstatus={}\ninstalled={}",
            n.title,
            Self::field(n, "family"),
            Self::field(n, "asset_mode"),
            Self::field(n, "asset_kinds"),
            Self::field(n, "status"),
            Self::field(n, "installed")
        ))
    }
}
impl ComputeEngine for ResearchCatalogCompute {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(
            "hqkg:research-catalog",
            &self.implementation,
            "hqkg.research.read.v1",
            &[
                "summary",
                "list_language",
                "list_kgsi",
                "list_scoring",
                "list_placements",
                "list_bindings",
                "score_file",
                "resource",
            ],
        )
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        let g = self
            .graph
            .read()
            .map_err(|_| Error::Conflict("research graph lock poisoned".into()))?;
        let data = match request.operation.as_str() {
            "summary" => {
                let kinds = [
                    "file",
                    "sectionvariant",
                    "algorithm",
                    "language-resource",
                    "scoring-observation",
                    "algorithm-placement",
                    "resource-binding",
                ];
                kinds
                    .iter()
                    .map(|k| format!("{k}={}", g.nodes().filter(|n| Self::kind(n) == *k).count()))
                    .collect::<Vec<_>>()
                    .join("\n")
            }
            "list_language" => Self::filtered(&g, "language-resource").join("\n"),
            "list_kgsi" => g
                .nodes()
                .filter(|n| {
                    Self::kind(n) == "algorithm"
                        && Self::field(n, "algorithm_id").starts_with("KGSI-")
                })
                .map(|n| {
                    format!(
                        "{}\t{}\t{}",
                        Self::field(n, "algorithm_id"),
                        n.title,
                        Self::field(n, "family")
                    )
                })
                .collect::<Vec<_>>()
                .join("\n"),
            "list_scoring" => Self::filtered(&g, "scoring-observation").join("\n"),
            "list_placements" => Self::filtered(&g, "algorithm-placement").join("\n"),
            "list_bindings" => Self::filtered(&g, "resource-binding").join("\n"),
            "score_file" => Self::score(&g, &request.data)?,
            "resource" => Self::resource(&g, &request.data)?,
            name => {
                return Err(Error::Unsupported(format!(
                    "unknown catalog operation: {name}"
                )))
            }
        };
        Ok(EngineOutput { data })
    }
}
