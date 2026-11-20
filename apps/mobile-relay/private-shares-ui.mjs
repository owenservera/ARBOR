// VIVIM Direct private file sharing. No cloud fallback, no credential storage,
// no automatic upload/download or retry on an uncertain result.
import { transport } from './transport.mjs';

const $ = id => document.getElementById(id);
const button = $('share-open'), dialog = $('share-dialog');
const status = $('share-status'), output = $('share-link'), incoming = $('share-incoming');
const fileInput = $('share-file'), recent = $('share-recent');
const shareId = new URLSearchParams(location.search).get('share');
const shareHash = /^#share-token=([a-f0-9]{64})$/.exec(location.hash);
const incomingCapability = shareHash?.[1] || null;
let created = null;
let inspected = null;
let previewUrl = null;
let droppedFile = null;
const dropzone = $('share-drop');
function selectionLabel(file) {
  const label = $('share-selected-name');
  if (label) label.textContent = file
    ? file.name + ' · ' + Math.ceil(file.size / 1024) + ' KB'
    : 'Maximum 10 MB · Direct Host only';
}
if (dropzone) {
  const inhibit = e => { e.preventDefault(); e.stopPropagation(); };
  dropzone.addEventListener('dragover', e => {
    inhibit(e); dropzone.classList.add('dragging');
  });
  dropzone.addEventListener('dragleave', e => {
    inhibit(e); dropzone.classList.remove('dragging');
  });
  dropzone.addEventListener('drop', e => {
    inhibit(e); dropzone.classList.remove('dragging');
    const selected = e.dataTransfer?.files?.[0];
    if (!selected) return;
    droppedFile = selected;
    selectionLabel(selected);
  });
}
fileInput?.addEventListener('change', () => {
  droppedFile = null;
  selectionLabel(fileInput.files?.[0] || null);
});
if (shareHash) history.replaceState(null, '', location.pathname + location.search);
if (button) button.hidden = !transport?.direct || new URLSearchParams(location.search).get('host-preview') === '1';

function message(value) { if (status) status.textContent = String(value); }
function ready() {
  const headers = transport?.deviceHeaders?.();
  if (transport?.direct !== true || !headers) throw new Error('Pair and approve this phone with your Direct PC before sharing.');
  return headers;
}
async function call(route, {method = 'GET', body, capability, passcode, binary = false} = {}) {
  const device = ready();
  const mutation = method !== 'GET';
  let response;
  try {
    response = await fetch('/mobile/api/shares' + route, {
      method, cache:'no-store', credentials:'same-origin',
      headers: {
        ...device,
        ...(mutation ? {'x-vivim-share':'1'} : {}),
        ...(capability ? {'x-vivim-share-token':capability} : {}),
        ...(passcode ? {'x-vivim-passcode':passcode} : {}),
        ...(body !== undefined ? {'content-type':binary?'application/octet-stream':'application/json'} : {})
      },
      ...(body === undefined ? {} : {body:binary?body:JSON.stringify(body)})
    });
  } catch {
    throw new Error(mutation
      ? 'Upload or policy change uncertain. Check your PC before trying again.'
      : 'Your Direct Host could not be reached.');
  }
  if (binary && method === 'GET' && response.ok) return response.blob();
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.code || 'Share request failed (HTTP '+response.status+')');
  if (!result) throw new Error('Share response unreadable. Check Host before retrying.');
  return result;
}
function readableDate(value) { return new Date(value).toLocaleString(); }
function details(row) {
  return row.name + ' · ' + Math.round(row.bytes / 1024) + ' KB · ' +
    row.downloads + '/' + row.maxDownloads + ' downloads · expires ' + readableDate(row.expiresAt);
}
function buildLink(row, capability) {
  return location.origin + '/mobile/?share=' + encodeURIComponent(row.id) +
    '#share-token=' + capability;
}
async function refresh() {
  if (!recent) return;
  recent.replaceChildren();
  const data = await call('');
  if (!data.items.length) { recent.textContent = 'No shares from this approved device.'; return; }
  for (const item of data.items.slice(0, 25)) {
    const line = document.createElement('div');
    line.className = 'share-row';
    const label = document.createElement('span');
    label.textContent = details(item) + (item.revokedAt ? ' · revoked' : '');
    line.append(label);
    if (!item.revokedAt) {
      const revoke = document.createElement('button');
      revoke.type = 'button'; revoke.className = 'btn sm'; revoke.textContent = 'Revoke';
      revoke.addEventListener('click', async () => {
        if (!confirm('Revoke access to ' + item.name + '?')) return;
        revoke.disabled = true;
        try { await call('/'+item.id,{method:'DELETE'}); message('Access revoked.'); await refresh(); }
        catch(e) {message(e.message);revoke.disabled=false;}
      });
      line.append(revoke);
    }
    recent.append(line);
  }
}
async function inspectIncoming() {
  if (!shareId || !/^[a-f0-9]{32}$/.test(shareId) || !incomingCapability) return;
  incoming.hidden = false;
  message('Checking the share on your paired Host…');
  const passcode = $('share-receive-passcode')?.value || '';
  const result = await call('/'+shareId+'/meta',{capability:incomingCapability,passcode});
  inspected = result;
  $('share-receive-details').textContent = details(result);
  message('File ready. Downloads are limited and recorded by your PC.');
}
async function receive(preview) {
  if (!inspected || !incomingCapability) throw new Error('Inspect this share first.');
  if (preview && !/^(image\/(png|jpeg|webp|gif)|application\/pdf|audio\/(mpeg|mp4|ogg)|video\/mp4|text\/plain)$/.test(inspected.mime))
    throw new Error('Preview unavailable for this type; download instead.');
  message('Retrieving from your paired PC…');
  const passcode = $('share-receive-passcode')?.value || '';
  const blob = await call('/'+shareId+'/download',{capability:incomingCapability,passcode,binary:true});
  const url = URL.createObjectURL(new Blob([blob],{type:preview?inspected.mime:'application/octet-stream'}));
  if (preview) {
    const pane = $('share-preview-pane');
    if (!pane) { URL.revokeObjectURL(url); throw new Error('Preview surface unavailable.'); }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = url;
    pane.replaceChildren(); pane.hidden = false;
    const mime = inspected.mime;
    let viewer;
    if (mime === 'text/plain') {
      viewer = document.createElement('pre');
      viewer.textContent = await blob.text();
      viewer.style.whiteSpace = 'pre-wrap';
      viewer.style.overflowWrap = 'anywhere';
    } else if (mime.startsWith('image/')) {
      viewer = document.createElement('img');
      viewer.src = url; viewer.alt = inspected.name; viewer.style.maxWidth = '100%';
    } else if (mime.startsWith('audio/') || mime.startsWith('video/')) {
      viewer = document.createElement(mime.startsWith('audio/') ? 'audio' : 'video');
      viewer.controls = true; viewer.src = url; viewer.style.maxWidth = '100%';
    } else {
      viewer = document.createElement('iframe');
      viewer.src = url; viewer.title = 'Private PDF preview';
      viewer.setAttribute('sandbox','allow-same-origin');
      viewer.style.width = '100%'; viewer.style.height = '55dvh'; viewer.style.border = '0';
    }
    pane.append(viewer);
  } else {
    const link = document.createElement('a');
    link.href = url; link.download = inspected.name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  message('Retrieved. Preview also counts against the download limit.');
  inspected = null; // fresh inspection is needed after use
}
if (button && dialog) {
  button.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.hidden = false;
    message('');
    if (shareId && incomingCapability) {
      incoming.hidden = false;
      $('share-receive-details').textContent = 'Open the link on an approved Direct device and inspect it.';
    }
    refresh().catch(e => message(e.message));
  });
  $('share-close')?.addEventListener('click', () => dialog.close?.());
  dialog.addEventListener('close', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    const pane = $('share-preview-pane');
    if (pane) { pane.replaceChildren(); pane.hidden = true; }
  });
  $('share-create')?.addEventListener('click', async () => {
    const upload = droppedFile || fileInput?.files?.[0];
    if (!upload) { message('Choose a file to share.'); return; }
    const action = $('share-create'); action.disabled = true; output.value = ''; created = null;
    try {
      message('Reserving private share on Host…');
      const policy = {
        name: upload.name, mime: upload.type || 'application/octet-stream',
        bytes: upload.size,
        expiresInHours:Number($('share-expiry').value),
        maxDownloads:Number($('share-downloads').value),
        passcode:$('share-passcode').value
      };
      const row = await call('',{method:'POST',body:policy});
      created = row;
      message('Uploading to Host…');
      await call('/'+row.id+'/content',{method:'PUT',body:upload,capability:row.capability,binary:true});
      output.value = buildLink(row,row.capability);
      created = null; // the temporary upload credential is no longer needed
      message('Share ready. Copy this link now; its capability cannot be recovered from Host metadata.');
      try { await refresh(); } catch { /* committed share remains available for copying */ }
    } catch (error) {
      message(error.message + (created ? ' The reservation may remain on the PC.' : ''));
    } finally { action.disabled = false; }
  });
  $('share-copy')?.addEventListener('click', async () => {
    if (!output.value) return;
    try { await navigator.clipboard.writeText(output.value); message('Link copied.'); }
    catch { output.focus(); output.select(); message('Select and copy the link.'); }
  });
  $('share-refresh')?.addEventListener('click',()=>refresh().catch(e=>message(e.message)));
  $('share-inspect')?.addEventListener('click',()=>inspectIncoming().catch(e=>message(e.message)));
  $('share-download')?.addEventListener('click',()=>receive(false).catch(e=>message(e.message)));
  $('share-preview')?.addEventListener('click',()=>receive(true).catch(e=>message(e.message)));
  if (shareId && incomingCapability && transport?.direct &&
      new URLSearchParams(location.search).get('host-preview') !== '1') {
    button.hidden = false;
    // Only display the link on arrival, never download without an owner gesture.
    button.setAttribute('aria-label','Open received share');
  }
}
