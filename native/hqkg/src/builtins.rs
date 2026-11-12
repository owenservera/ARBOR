//! Built-in graph and database compute engines, ready for generational swapping.
//! Register these via EngineRegistry::install and materialize their receipts in the graph.
use crate::engine::{ComputeEngine, EngineDescriptor, EngineOutput, EngineRequest};
use crate::{DataTable, DatabaseKind, DatabaseSpec, Error, Graph, Result};
use std::collections::BTreeSet;
use std::sync::{Arc, RwLock};

pub struct GraphCompute {
    pub slot: String,
    pub implementation: String,
    pub graph: Arc<RwLock<Graph>>,
}
impl GraphCompute {
    pub fn new(slot: &str, graph: Arc<RwLock<Graph>>) -> Self {
        Self {
            slot: slot.into(),
            implementation: "hqkg-graph-std-v1".into(),
            graph,
        }
    }
    fn capabilities() -> BTreeSet<String> {
        [
            "path",
            "neighbors",
            "reachable",
            "topological",
            "rank",
            "search",
            "stats",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect()
    }
}
impl ComputeEngine for GraphCompute {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor {
            slot: self.slot.clone(),
            implementation: self.implementation.clone(),
            interface: "hqkg.graph-query.v1".into(),
            capabilities: Self::capabilities(),
        }
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        let g = self
            .graph
            .read()
            .map_err(|_| Error::Conflict("graph lock poisoned".into()))?;
        let result = match request.operation.as_str() {
            "stats" => format!(
                "epoch={} nodes={} edges={}",
                g.epoch(),
                g.node_count(),
                g.edge_count()
            ),
            "search" => g
                .search(&request.data, 100)
                .iter()
                .map(|n| format!("{}\t{}", n.id, n.title))
                .collect::<Vec<_>>()
                .join("\n"),
            "path" => {
                let (from, to) = request
                    .data
                    .split_once('\t')
                    .ok_or_else(|| Error::Invalid("path input must be FROM<TAB>TO".into()))?;
                g.shortest_path(from, to, None)?
                    .map_or_else(|| "NO_PATH".into(), |p| p.join(" -> "))
            }
            "neighbors" => g
                .outgoing(&request.data, None)?
                .iter()
                .map(|e| format!("{}\t{}\t{}", e.relation, e.to, e.weight))
                .collect::<Vec<_>>()
                .join("\n"),
            "reachable" => g.reachable(&request.data, None, 10_000)?.join("\n"),
            "topological" => g.topological(&request.data)?.join("\n"),
            "rank" => {
                let mut values = g.page_rank(40, 0.85)?.into_iter().collect::<Vec<_>>();
                values.sort_by(|a, b| b.1.total_cmp(&a.1));
                values
                    .iter()
                    .take(100)
                    .map(|(k, v)| format!("{v:.7}\t{k}"))
                    .collect::<Vec<_>>()
                    .join("\n")
            }
            other => {
                return Err(Error::Unsupported(format!(
                    "unknown graph operation: {other}"
                )))
            }
        };
        Ok(EngineOutput { data: result })
    }
}

pub struct DatabaseCompute {
    pub spec: DatabaseSpec,
    pub implementation: String,
    pub max_rows: usize,
}
impl DatabaseCompute {
    pub fn new(spec: DatabaseSpec) -> Self {
        Self {
            spec,
            implementation: "hqkg-db-readonly-v1".into(),
            max_rows: 100,
        }
    }
    fn table_text(table: DataTable) -> String {
        fn safe(s: &str) -> String {
            s.replace('\\', "\\\\")
                .replace('\t', "\\t")
                .replace('\r', "\\r")
                .replace('\n', "\\n")
        }
        let mut out = table
            .columns
            .iter()
            .map(|v| safe(v))
            .collect::<Vec<_>>()
            .join("\t");
        for row in table.rows {
            out.push('\n');
            out.push_str(&row.iter().map(|s| safe(s)).collect::<Vec<_>>().join("\t"));
        }
        if table.truncated {
            out.push_str("\n# TRUNCATED");
        }
        out
    }
}
impl ComputeEngine for DatabaseCompute {
    fn descriptor(&self) -> EngineDescriptor {
        EngineDescriptor::new(
            &format!("database:{}", self.spec.id),
            &self.implementation,
            "hqkg.database.read.v1",
            &["query", "catalog", "health"],
        )
    }
    fn execute(&self, request: &EngineRequest) -> Result<EngineOutput> {
        let sql=match request.operation.as_str(){
            "query"=>request.data.as_str(),
            "catalog"=>match self.spec.kind{
                DatabaseKind::Sqlite=>"SELECT type,name,tbl_name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name",
                DatabaseKind::Postgres=>"SELECT table_schema,table_name,table_type FROM information_schema.tables ORDER BY table_schema,table_name",
            },
            "health"=>"SELECT 1",
            other=>return Err(Error::Unsupported(format!("unknown database operation: {other}"))),
        };
        let rows = self.spec.query(sql, self.max_rows)?;
        Ok(EngineOutput {
            data: Self::table_text(rows),
        })
    }
}
