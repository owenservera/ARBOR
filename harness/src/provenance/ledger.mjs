// Provenance ledger: records which solution files were built from approved
// webapp AI replies. Stores ONLY metadata and digests. Never stores file
// contents, prompts, or reply bodies.
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

export class ProvenanceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProvenanceError';
    this.code = code;
  }
}

function resolveInRoot(root, filePath) {
  const abs = resolve(root, filePath);
  const rel = relative(root, abs);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ProvenanceError('PROVENANCE_PATH_OUTSIDE_ROOT', 'path resolves outside root');
  }
  return { abs, rel: rel.split(sep).join('/') };
}

async function readBytes(abs) {
  try {
    return await readFile(abs);
  } catch (err) {
    if (err.code === 'ENOENT') throw new ProvenanceError('PROVENANCE_FILE_MISSING', 'file does not exist');
    throw err;
  }
}

function digestAndLines(bytes) {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  let lines = 0;
  if (bytes.length > 0) {
    for (const b of bytes) if (b === 0x0a) lines++;
    if (bytes[bytes.length - 1] !== 0x0a) lines++;
  }
  return { sha256, lines };
}

async function readLedger(ledgerPath) {
  let text;
  try {
    text = await readFile(ledgerPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const out = [];
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      out.push(JSON.parse(line));
    } catch {
      throw new ProvenanceError('PROVENANCE_LEDGER_CORRUPT', `ledger line ${i + 1} is not valid JSON`);
    }
  });
  return out;
}

export async function recordArtifact({ ledgerPath, journalDir, requestId, filePath, root = process.cwd() }) {
  if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) {
    throw new ProvenanceError('PROVENANCE_BAD_REQUEST_ID', 'requestId has invalid format');
  }

  let journal;
  try {
    journal = JSON.parse(await readFile(join(journalDir, `${requestId}.json`), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new ProvenanceError('PROVENANCE_JOURNAL_UNVERIFIED', 'journal record not found');
    }
    throw err;
  }
  if (journal.submitted !== 'yes') {
    throw new ProvenanceError('PROVENANCE_JOURNAL_UNVERIFIED', 'journal submitted is not yes');
  }
  if (journal.state !== 'observed' && journal.state !== 'complete') {
    throw new ProvenanceError('PROVENANCE_JOURNAL_UNVERIFIED', 'journal state is not observed or complete');
  }
  if (typeof journal.replyDigest !== 'string' || journal.replyDigest.length === 0) {
    throw new ProvenanceError('PROVENANCE_JOURNAL_UNVERIFIED', 'journal has no replyDigest');
  }

  const { abs, rel } = resolveInRoot(root, filePath);
  const bytes = await readBytes(abs);
  const { sha256, lines } = digestAndLines(bytes);

  const record = {
    at: new Date().toISOString(),
    requestId,
    provider: journal.provider ?? null,
    replyDigest: journal.replyDigest,
    path: rel,
    sha256,
    lines,
  };
  await mkdir(dirname(ledgerPath), { recursive: true });
  await appendFile(ledgerPath, `${JSON.stringify(record)}\n`);
  return record;
}

export async function report({ ledgerPath, root = process.cwd(), scope }) {
  if (!Array.isArray(scope)) {
    throw new ProvenanceError('PROVENANCE_BAD_REQUEST', 'scope must be an array of paths');
  }
  const latest = new Map();
  for (const rec of await readLedger(ledgerPath)) latest.set(rec.path, rec);

  const paths = [...new Set(scope)];
  const files = [];
  for (const p of paths) {
    const { abs, rel } = resolveInRoot(root, p);
    const rec = latest.get(rel) ?? null;
    let bytes = null;
    try {
      bytes = await readFile(abs);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    let status;
    let lines = 0;
    if (bytes === null) {
      status = 'missing';
    } else {
      const current = digestAndLines(bytes);
      lines = current.lines;
      if (!rec) status = 'unattributed';
      else if (rec.sha256 === current.sha256) status = 'attributed';
      else status = 'modified';
    }
    files.push({
      path: rel,
      status,
      lines,
      provider: rec ? rec.provider : null,
      requestId: rec ? rec.requestId : null,
    });
  }

  const count = s => files.filter(f => f.status === s).length;
  const sumLines = s => files.filter(f => f.status === s).reduce((n, f) => n + f.lines, 0);
  const totalLines = files.reduce((n, f) => n + f.lines, 0);
  const attributedLines = sumLines('attributed');

  return {
    totalFiles: files.length,
    totalLines,
    attributedFiles: count('attributed'),
    attributedLines,
    modifiedFiles: count('modified'),
    unattributedFiles: count('unattributed'),
    percentAttributed: totalLines === 0 ? 0 : Math.round((attributedLines / totalLines) * 100 * 10) / 10,
    files,
  };
}
