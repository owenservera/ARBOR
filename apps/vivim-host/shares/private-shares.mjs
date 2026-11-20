// @hq:context Authenticated Direct Host transport into native private shares.
// @hq:owner host-direct-phone
// @hq:capability vivim.private-shares-host-port@1
// @hq:consumes vivim.private-shares-native@1
// @hq:contract vivim.private-shares-request/1
// Host transport only. All share policy, persistence, cryptography, expiry,
// limits, and download admission execute in the packaged Rust private-share core.
// There is deliberately no JS share-engine fallback. Device grant and Direct
// origin verification belong to direct-phone.mjs before this port is reached.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { randomBytes } from 'node:crypto';
import { resolveBundledRustBinary } from '../chat/rust-context.mjs';

const SCHEMA = 'vivim.private-shares-request/1';
const RESULT = 'vivim.private-shares-result/1';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_RESPONSE = 128 * 1024;
const OWNER = /^[a-f0-9]{32}$/;
const SHARE_ID = /^[a-f0-9]{32}$/;
const CAPABILITY = /^[a-f0-9]{64}$/;
const refuse = (status, code) => Object.assign(new Error(code), {status, code});

// Bounded stdio request. Rust owns a cross-process store lock for each operation.
// Never invoke Cargo at runtime or accept an executable path from an HTTP client.
async function invoke(binary, request) {
  if (typeof binary !== 'string' || !path.isAbsolute(binary))
    throw refuse(503, 'SHARE_RUST_NOT_PACKAGED');
  const wire = JSON.stringify({schema: SCHEMA, ...request});
  if (Buffer.byteLength(wire, 'utf8') > 32 * 1024)
    throw refuse(413, 'SHARE_REQUEST_TOO_LARGE');
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [], {shell:false, windowsHide:true, stdio:['pipe','pipe','pipe']});
    let size = 0, chunks = [], settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => {
      child.kill(); finish(refuse(503, 'SHARE_RUST_TIMEOUT'));
    }, 25000);
    child.on('error', () => finish(refuse(503, 'SHARE_RUST_UNAVAILABLE')));
    child.stdin.on('error', () => finish(refuse(503, 'SHARE_RUST_UNAVAILABLE')));
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_RESPONSE) {
        child.kill(); finish(refuse(503, 'SHARE_RUST_RESPONSE_LIMIT'));
      } else chunks.push(chunk);
    });
    // Rust stderr may include local private data. Do not echo it into the API.
    child.stderr.on('data', () => {});
    child.on('close', code => {
      if (code !== 0) {
        finish(refuse(503, 'SHARE_RUST_UNAVAILABLE')); return;
      }
      let response;
      try { response = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { finish(refuse(503, 'SHARE_RUST_RESPONSE_INVALID')); return; }
      if (response?.schema !== RESULT || typeof response.ok !== 'boolean') {
        finish(refuse(503, 'SHARE_RUST_RESPONSE_INVALID')); return;
      }
      if (!response.ok) {
        const status = Number.isInteger(response.status) && response.status >= 400 &&
          response.status <= 599 ? response.status : 503;
        const code = typeof response.code === 'string' &&
          /^SHARE_[A-Z0-9_]{1,80}$/.test(response.code)
          ? response.code : 'SHARE_RUST_REFUSED';
        finish(refuse(status, code)); return;
      }
      if (response.value === undefined || response.value === null ||
          typeof response.value !== 'object' || Array.isArray(response.value)) {
        finish(refuse(503, 'SHARE_RUST_RESPONSE_INVALID')); return;
      }
      finish(null, response.value);
    });
    child.stdin.end(wire, 'utf8');
  });
}
export function createPrivateShares({
  dataRoot, resolveBinary = () => resolveBundledRustBinary('vivim-private-shares'),
  runNative = invoke
} = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot) throw new TypeError('dataRoot required');
  const base = path.resolve(dataRoot);
  const stagingDir = path.join(base, 'private-shares', 'staging');
  const binary = () => {
    let value;
    try { value = resolveBinary(); } catch { /* missing optional bundle */ }
    if (!value) throw refuse(503, 'SHARE_RUST_NOT_PACKAGED');
    return value;
  };
  const run = (operation, body = {}) =>
    runNative(binary(), {operation, dataRoot: base, ...body});
  const checkOwner = owner => {
    if (!OWNER.test(String(owner || ''))) throw refuse(403, 'SHARE_OWNER_INVALID');
    return owner;
  };
  const checkId = id => {
    if (!SHARE_ID.test(String(id || ''))) throw refuse(400, 'SHARE_ID_INVALID');
    return id;
  };
  const checkToken = capability => {
    if (!CAPABILITY.test(String(capability || '')))
      throw refuse(404, 'SHARE_NOT_FOUND');
    return capability;
  };

  async function finish(id, capability, owner, request) {
    checkId(id); checkToken(capability); checkOwner(owner);
    // Check framing without trusting Content-Length as the final byte count.
    if (String(request?.headers?.['content-type'] || '').split(';')[0].trim() !==
        'application/octet-stream')
      throw refuse(415, 'SHARE_BINARY_REQUIRED');
    const announced = request.headers['content-length'];
    if (announced != null && (!Number.isSafeInteger(Number(announced)) ||
        Number(announced) < 0 || Number(announced) > MAX_BYTES))
      throw refuse(413, 'SHARE_SIZE_LIMIT');
    // A browser uploads to a Node-owned staging file with an unpredictable
    // basename. Only the native engine may publish bytes into the share store.
    await mkdir(stagingDir, {recursive:true, mode:0o700});
    const stagingName = randomBytes(16).toString('hex') + '.upload';
    const file = path.join(stagingDir, stagingName);
    let count = 0;
    const limiter = new Transform({
      transform(chunk, encoding, callback) {
        count += chunk.length;
        if (count > MAX_BYTES) callback(refuse(413, 'SHARE_SIZE_LIMIT'));
        else callback(null, chunk);
      }
    });
    try {
      await pipeline(request, limiter,
        createWriteStream(file, {flags:'wx', mode:0o600}));
      // The native process checks the exact reserved size and committed hash.
      return await run('finish', {
        id, capability, ownerDeviceId: owner, stagingName
      });
    } finally {
      await rm(file, {force:true}).catch(() => {});
    }
  }
  async function download(id, capability, passcode) {
    const value = await run('download', {
      id: checkId(id), capability: checkToken(capability),
      passcode: typeof passcode === 'string' ? passcode : ''
    });
    // Never allow a native response to turn this into an arbitrary file server.
    const expected = path.join(base, 'private-shares', id + '.bin');
    if (value.id !== id || value.file !== expected ||
        !Number.isSafeInteger(value.bytes) || value.bytes < 1 || value.bytes > MAX_BYTES ||
        !/^[a-f0-9]{64}$/.test(value.sha256 || ''))
      throw refuse(503, 'SHARE_RUST_RESPONSE_INVALID');
    return value;
  }
  return Object.freeze({
    reserve: (options, owner) =>
      run('reserve', {options, ownerDeviceId:checkOwner(owner)}),
    finish,
    list: owner => run('list', {ownerDeviceId:checkOwner(owner)}),
    inspect: (id, capability, passcode) =>
      run('inspect', {id:checkId(id), capability:checkToken(capability),
        passcode:typeof passcode === 'string' ? passcode : ''}),
    download,
    revoke: (id, owner) =>
      run('revoke', {id:checkId(id), ownerDeviceId:checkOwner(owner)}),
    prune: () => run('prune')
  });
}
