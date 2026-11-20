# File: native/hqkg/src/database.rs

> Generated 2026-11-19 · Rust · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/src/database.rs |
| Language | Rust |
| Kind | source |
| Size | 9089 B |
| Lines | 236 |
| Hash | 3db79a8ce976 |
| Test | no |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DatabaseKind | enum | 6 | yes | pub enum DatabaseKind { |
| as_str | method | 11 | yes | pub fn as_str(&amp;self) -&gt; &amp;&#39;static str { |
| parse | function | 17 | yes | pub fn parse(s: &amp;str) -&gt; Result&lt;Self&gt; { |
| DatabaseSpec | struct | 26 | yes | pub struct DatabaseSpec { |
| to_node | method | 35 | yes | pub fn to_node(&amp;self) -&gt; Result&lt;Node&gt; { |
| from_node | method | 68 | yes | pub fn from_node(n: &amp;Node) -&gt; Result&lt;Self&gt; { |
| query | method | 87 | yes | pub fn query(&amp;self, sql: &amp;str, max_rows: usize) -&gt; Result&lt;DataTable&gt; { |
| DataTable | struct | 127 | yes | pub struct DataTable { |
| sqlite_query | function | 133 | no | fn sqlite_query(spec: &amp;DatabaseSpec, sql: &amp;str, max: usize) -&gt; Result&lt;DataTable&gt; { |
| postgres_query | function | 189 | no | fn postgres_query(spec: &amp;DatabaseSpec, sql: &amp;str, max: usize) -&gt; Result&lt;DataTable&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| crate::{Error, Node, NodeKind, Result} | use | 3 | external |
| rusqlite::{types::ValueRef, Connection, OpenFlags} | use | 134 | external |
| postgres::{Client, NoTls, SimpleQueryMessage} | use | 190 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```rust
//! External databases are graph nodes, optionally executable through narrow adapters.
//! Secret values are never kept in graph properties; use environment-variable references.
use crate::{Error, Node, NodeKind, Result};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DatabaseKind {
    Sqlite,
    Postgres,
}
impl DatabaseKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Sqlite => "sqlite",
            Self::Postgres => "postgres",
        }
    }
    pub fn parse(s: &str) -> Result<Self> {
        match s {
            "sqlite" => Ok(Self::Sqlite),
            "postgres" | "postgresql" => Ok(Self::Postgres),
            _ => Err(Error::Invalid(format!("unsupported database type: {s}"))),
        }
    }
}
#[derive(Clone, Debug)]
pub struct DatabaseSpec {
    pub id: String,
    pub kind: DatabaseKind,
    /// SQLite: local pathname; PostgreSQL: public host/database locator OR empty if credential_env set.
    pub locator: String,
    /// Environment variable holding the entire connection string; the value is NOT persisted.
    pub credential_env: Option<String>,
}
impl DatabaseSpec {
    pub fn to_node(&self) -> Result<Node> {
        if self.id.is_empty() {
            return Err(Error::Invalid("database ID required".into()));
        }
        if self.kind == DatabaseKind::Postgres && self.credential_env.is_none() {
            return Err(Error::Invalid(
                "PostgreSQL requires a connection-string environment variable".into(),
            ));
        }
        if self.locator.contains("password=") || self.locator.contains("://") {
            return Err(Error::Invalid(
                "locator must not contain a credential-bearing URI".into(),
            ));
        }
        if let Some(key) = &self.credential_env {
            if key.is_empty() || !key.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
                return Err(Error::Invalid("invalid credential variable name".into()));
            }
        }
        let mut n = Node::new(
            &self.id,
            NodeKind::Database,
            &format!("{} database", self.kind.as_str()),
        );
        n.properties
            .insert("driver".into(), self.kind.as_str().into());
        n.properties.insert("locator".into(), self.locator.clone());
        n.properties.insert("read_only".into(), "true".into());
        if let Some(key) = &self.credential_env {
            n.properties.insert("credential_env".into(), key.clone());
        }
        Ok(n)
    }
    pub fn from_node(n: &Node) -> Result<Self> {
        if n.kind != NodeKind::Database {
            return Err(Error::Invalid("node is not a database".into()));
        }
        if n.properties.get("read_only").map(String::as_str) != Some("true") {
            return Err(Error::Invalid(
                "writable database nodes are not supported".into(),
            ));
        }
        Ok(Self {
            id: n.id.clone(),
            kind: DatabaseKind::parse(
                n.properties.get("driver").map(String::as_str).unwrap_or(""),
```

_First 80 of 237 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
