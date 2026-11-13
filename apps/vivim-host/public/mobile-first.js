// Thin desktop presentation: the iframe is the actual mobile-relay app, not a clone.
// The native app's single-use launch code is transferred once and erased from the
// outer URL. The permanent owner capability is never placed in the webview.
(() => {
  'use strict';
  const iframe = document.getElementById('phone-surface');
  if (!iframe) return;
  const fragment = window.location.hash;
  const match = /^#control-session=([a-f0-9]{64})$/.exec(fragment);
  if (fragment) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  const target = new URL('/mobile/?host-preview=1', window.location.origin);
  if (match) target.hash = 'control-session=' + match[1];
  iframe.src = target.pathname + target.search + target.hash;
})();
