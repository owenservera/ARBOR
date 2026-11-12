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
            )?,
            locator: n.properties.get("locator").cloned().unwrap_or_default(),
            credential_env: n.properties.get("credential_env").cloned(),
        })
    }
    /// Adapters are opt-in: default compilation of the graph uses no external crates.
    pub fn query(&self, sql: &str, max_rows: usize) -> Result<DataTable> {
        let trimmed = sql.trim();
        let lower = trimmed.to_ascii_lowercase();
        let allowed = lower == "select"
            || lower.starts_with("select ")
            || lower.starts_with("select\n")
            || lower.starts_with("with ")
            || lower.starts_with("with\n");
        if !allowed || trimmed.contains(';') || max_rows == 0 || max_rows > 10_000 {
            return Err(Error::Invalid(
                "only one bounded SELECT/WITH query is permitted".into(),
            ));
        }
        match self.kind {
            DatabaseKind::Sqlite => {
                #[cfg(feature = "sqlite")]
                {
                    return sqlite_query(self, trimmed, max_rows);
                }
                #[cfg(not(feature = "sqlite"))]
                {
                    Err(Error::Unsupported("compile with --features sqlite".into()))
                }
            }
            DatabaseKind::Postgres => {
                #[cfg(feature = "postgres")]
                {
                    return postgres_query(self, trimmed, max_rows);
                }
                #[cfg(not(feature = "postgres"))]
                {
                    Err(Error::Unsupported(
                        "compile with --features postgres".into(),
                    ))
                }
            }
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DataTable {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub truncated: bool,
}
#[cfg(feature = "sqlite")]
fn sqlite_query(spec: &DatabaseSpec, sql: &str, max: usize) -> Result<DataTable> {
    use rusqlite::{types::ValueRef, Connection, OpenFlags};
    let path = if let Some(key) = &spec.credential_env {
        std::env::var(key)
            .map_err(|_| Error::Missing(format!("missing environment variable {key}")))?
    } else {
        spec.locator.clone()
    };
    let connection = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_URI,
    )
    .map_err(|e| Error::Invalid(e.to_string()))?;
    let mut statement = connection
        .prepare(sql)
        .map_err(|e| Error::Invalid(e.to_string()))?;
    if !statement.readonly() {
        return Err(Error::Invalid("statement is not read-only".into()));
    }
    let columns = statement
        .column_names()
        .iter()
        .map(|s| s.to_string())
        .collect::<Vec<_>>();
    let count = columns.len();
    let mut iter = statement
        .query([])
        .map_err(|e| Error::Invalid(e.to_string()))?;
    let mut rows = Vec::new();
    let mut truncated = false;
    while let Some(row) = iter.next().map_err(|e| Error::Invalid(e.to_string()))? {
        if rows.len() == max {
            truncated = true;
            break;
        }
        let mut values = Vec::new();
        for i in 0..count {
            let cell = row.get_ref(i).map_err(|e| Error::Invalid(e.to_string()))?;
            let value = match cell {
                ValueRef::Null => "NULL".into(),
                ValueRef::Integer(v) => v.to_string(),
                ValueRef::Real(v) => v.to_string(),
                ValueRef::Text(v) => String::from_utf8_lossy(v).into_owned(),
                ValueRef::Blob(v) => format!("<blob:{} bytes>", v.len()),
            };
            values.push(value);
        }
        rows.push(values);
    }
    Ok(DataTable {
        columns,
        rows,
        truncated,
    })
}
#[cfg(feature = "postgres")]
fn postgres_query(spec: &DatabaseSpec, sql: &str, max: usize) -> Result<DataTable> {
    use postgres::{Client, NoTls, SimpleQueryMessage};
    let key = spec
        .credential_env
        .as_ref()
        .ok_or_else(|| Error::Invalid("PostgreSQL requires credential_env".into()))?;
    let dsn = std::env::var(key)
        .map_err(|_| Error::Missing(format!("missing environment variable {key}")))?;
    let mut client = Client::connect(&dsn, NoTls).map_err(|e| Error::Invalid(e.to_string()))?;
    client
        .batch_execute("BEGIN READ ONLY; SET LOCAL statement_timeout = '5000ms';")
        .map_err(|e| Error::Invalid(e.to_string()))?;
    let result = (|| {
        // Cursor avoids reading an unbounded result into memory.
        client
            .batch_execute(&format!("DECLARE hqkg_cursor NO SCROLL CURSOR FOR {sql}"))
            .map_err(|e| Error::Invalid(e.to_string()))?;
        let messages = client
            .simple_query(&format!("FETCH FORWARD {} FROM hqkg_cursor", max + 1))
            .map_err(|e| Error::Invalid(e.to_string()))?;
        let mut columns = Vec::new();
        let mut rows = Vec::new();
        let mut truncated = false;
        for message in messages {
            if let SimpleQueryMessage::Row(row) = message {
                if columns.is_empty() {
                    columns = row.columns().iter().map(|c| c.name().to_owned()).collect();
                }
                if rows.len() == max {
                    truncated = true;
                    break;
                }
                rows.push(
                    (0..row.len())
                        .map(|i| row.get(i).unwrap_or("NULL").to_owned())
                        .collect(),
                );
            }
        }
        Ok(DataTable {
            columns,
            rows,
            truncated,
        })
    })();
    let _ = client.batch_execute("ROLLBACK");
    result
}
