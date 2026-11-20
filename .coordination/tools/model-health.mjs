// model-health.mjs — last-N-minutes per-model call/error health from the ZCode CLI db.
// usage: bun model-health.mjs [minutes]
import { Database } from "bun:sqlite";
import { homedir } from "node:os";

const minutes = Number(process.argv[2] || 60);
const db = new Database(homedir() + "/.zcode/cli/db/db.sqlite", { readonly: true });

// started_at epoch unit is auto-detected: values > 1e12 are ms.
const probe = db.query("SELECT MAX(started_at) m FROM model_usage").get();
const unit = probe.m > 1e12 ? 1000 : 1;
const cutoff = (Date.now() - minutes * 60 * 1000) / unit;

const rows = db
  .query(
    `SELECT provider_id || "/" || model_id AS m,
            COUNT(*) AS calls,
            SUM(CASE WHEN status = "ok" AND error_type IS NULL THEN 1 ELSE 0 END) AS ok,
            SUM(CASE WHEN error_type IS NOT NULL THEN 1 ELSE 0 END) AS err,
            MAX(started_at) AS last
     FROM model_usage
     WHERE started_at > ${cutoff}
     GROUP BY m
     ORDER BY calls DESC`,
  )
  .all();

for (const r of rows) {
  const last = r.last ? new Date(r.last * unit).toISOString() : "-";
  console.log(`${r.m}  calls=${r.calls} ok=${r.ok} err=${r.err}  last=${last}`);
}

console.log("--- recent error samples:");
const errs = db
  .query(
    `SELECT provider_id || "/" || model_id AS m, error_type, error_code, substr(coalesce(error_message,""),1,100) AS msg, started_at
     FROM model_usage
     WHERE started_at > ${cutoff} AND error_type IS NOT NULL
     ORDER BY started_at DESC LIMIT 15`,
  )
  .all();
for (const e of errs) {
  console.log(`${new Date(e.started_at * unit).toISOString()}  ${e.m}  ${e.error_type}/${e.error_code}  ${e.msg}`);
}
