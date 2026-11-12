// Formatting helpers shared by every view. All numbers are rendered with
// tabular figures where possible so readouts do not jitter while ticking.

export const FONT_MONO = 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';

const NUM = new Intl.NumberFormat("en-US");

export function fmtNum(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  return NUM.format(value);
}

export function fmtCompact(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(value));
  if (abs < 1000000) return (value / 1000).toFixed(abs < 10000 ? 1 : 0) + "k";
  return (value / 1000000).toFixed(2) + "M";
}

export function fmtClock(ts) {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return "--:--:--.---";
  const d = new Date(ts);
  const p = (n, w) => String(n).padStart(w, "0");
  return (
    p(d.getHours(), 2) + ":" + p(d.getMinutes(), 2) + ":" + p(d.getSeconds(), 2) + "." + p(d.getMilliseconds(), 3)
  );
}

export function fmtDur(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "--";
  if (ms < 1000) return Math.round(ms) + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m" + String(secs % 60).padStart(2, "0") + "s";
  const hrs = Math.floor(mins / 60);
  return hrs + "h" + String(mins % 60).padStart(2, "0") + "m";
}

export function fmtUs(us) {
  if (typeof us !== "number" || !Number.isFinite(us)) return "--";
  if (us < 1000) return Math.round(us) + "µs";
  return (us / 1000).toFixed(2) + "ms";
}

export function truncate(text, max) {
  if (typeof text !== "string") return "";
  const limit = typeof max === "number" && max > 4 ? max : 120;
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + "…";
}

// Collapses a scalar-only payload into a single readable line.
export function summarize(data, max) {
  if (!data || typeof data !== "object") return "";
  const limit = typeof max === "number" ? max : 170;
  const parts = [];
  try {
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (value === null) parts.push(key + "=null");
      else if (typeof value === "object") parts.push(key + "=" + truncate(JSON.stringify(value), 48));
      else if (typeof value === "string") parts.push(key + "=" + truncate(value, 48));
      else parts.push(key + "=" + String(value));
    }
  } catch (err) {
    return "";
  }
  const line = parts.join(" · ");
  return truncate(line, limit);
}

// If an event text happens to carry JSON, fold it down to one line too.
export function summarizeText(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length < 2) return "";
  const first = trimmed.charAt(0);
  if (first !== "{" && first !== "[") return "";
  try {
    const parsed = JSON.parse(trimmed);
    return summarize(parsed, 150);
  } catch (err) {
    return "";
  }
}
