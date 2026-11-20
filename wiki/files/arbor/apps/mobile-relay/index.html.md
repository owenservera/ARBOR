# File: apps/mobile-relay/index.html

> Generated 2026-11-19 · HTML · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/index.html |
| Language | HTML |
| Kind | source |
| Size | 46885 B |
| Lines | 587 |
| Hash | 0dc43492a29b |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#111214">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="color-scheme" content="dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<link rel="preload" href="fonts/space-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<title>VIVIM Direct</title>
<style>
/* VIVIM phone — Neckar Sandstone Lab (graphite). Runtime personal themes may override --bg --s1 --s2 --bd --tx --mu --ac --ac2. */
@font-face{font-family:"Space Grotesk";src:url("fonts/space-grotesk-latin-wght-normal.woff2") format("woff2");font-weight:300 700;font-display:swap}
@font-face{font-family:"Geist";src:url("fonts/geist-latin-wght-normal.woff2") format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"JetBrains Mono";src:url("fonts/jetbrains-mono-latin-wght-normal.woff2") format("woff2");font-weight:100 800;font-display:swap}
:root{--bg:#111214;--s1:#18191c;--s2:#202226;--bd:#2e3035;--tx:#eeece7;--mu:#aeaba4;--ac:#ec7b67;--ac2:#3a1f1a;--bad:#ff8fa3;--ok:#5cc8cf;
 --line-strong:#73767d;--pencil:#9c9a94;--warn:#f0b45a;--info:#9ab8ee;--grid:#1d1f22;--on-ac:#1a0a06;
 --font-display:"Space Grotesk","Segoe UI Variable Display",system-ui,sans-serif;--font-sans:"Geist","Segoe UI Variable Text",system-ui,-apple-system,sans-serif;--font-mono:"JetBrains Mono","Cascadia Code",Consolas,ui-monospace,monospace;
 --r-sm:4px;--r-md:6px;--r-lg:8px;--safe-b:env(safe-area-inset-bottom,0px);color-scheme:dark}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--tx);font:15px/1.5 var(--font-sans);display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
button,select,textarea,input{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
button:disabled{opacity:.45;cursor:default}
:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.muted{color:var(--mu)}.pad{padding:12px}
.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* top bar: compact system strip; mobile brand sits above thumb-reachable navigation */
#mobile-wordmark{display:none;font:700 18px/1 var(--font-display);letter-spacing:-.045em;color:var(--tx)}
#top{display:flex;align-items:center;gap:4px;padding:env(safe-area-inset-top,0) 6px 0;min-height:calc(56px + env(safe-area-inset-top,0px));background:var(--s1);border-bottom:1px solid var(--bd);flex:none}
.icon{width:48px;height:48px;flex:none;display:grid;place-items:center;border-radius:var(--r-sm);font-size:20px;color:var(--mu)}
.icon:active{background:var(--s2)}
#tabs{flex:1;display:flex;gap:0;min-width:0;overflow-x:auto;scrollbar-width:none}
.tab{flex:1;min-height:48px;padding:0 10px;border-radius:var(--r-sm);color:var(--mu);font:500 14px/1 var(--font-sans);white-space:nowrap;position:relative}
.tab.on{color:var(--tx);font-weight:600}
.tab.on::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;background:var(--ac)}
#conn{font:500 10px/14px var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--mu);max-width:30vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dot{width:8px;height:8px;border-radius:1px;background:var(--ok);flex:none}
.dot.bad{background:var(--bad)}
body:not(.paired):not(.offline-shell) .needpair{display:none!important}
body:not(.tab-talk) #menu{display:none}
body:not(.paired) #tabs{flex:1}
@media(max-width:560px){body.paired #conn{display:none}}

main{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
#app{flex:1;min-height:0;display:flex;flex-direction:column}
#v-talk{flex:1;min-height:0;display:flex;position:relative;overflow:hidden}
#v-soon{flex:1;display:grid;place-items:center;text-align:center;color:var(--mu);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:24px 24px}
#v-soon h2{margin:0 0 6px;color:var(--tx);font:600 26px/32px var(--font-display);letter-spacing:-.02em}

/* Installed APK handoff before spending a one-time pairing code in a mobile browser. */
.pair-handoff{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:16px;padding:max(24px,env(safe-area-inset-top,0px)) max(24px,env(safe-area-inset-right,0px));overflow-y:auto}
.pair-handoff h2{font:600 30px/1.15 var(--font-display);letter-spacing:-.035em;margin:0}
.pair-handoff p{max-width:460px}
.pair-handoff .btn{display:flex;align-items:center;justify-content:center;min-height:48px;text-decoration:none}

/* pairing */
#pairbox{margin:auto;width:min(92vw,380px);padding:24px;background:var(--s1);border:1px solid var(--bd);border-radius:var(--r-lg);display:flex;flex-direction:column;gap:14px;position:relative}
#pairbox::before{content:"";position:absolute;left:24px;top:-1px;width:40px;height:3px;background:var(--ac)}
#pairbox h1{margin:0;font:600 28px/32px var(--font-display);letter-spacing:-.03em}
#pair-legacy{display:grid;gap:12px}
#pairbox p{margin:0;color:var(--mu)}
input[type=password],input[type=text]{min-height:48px;border-radius:var(--r-sm);background:var(--s2);border:1px solid var(--line-strong);padding:0 14px;font-size:16px;outline:none;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--ac)}

.btn{min-height:48px;padding:0 18px;border-radius:var(--r-sm);background:var(--s2);border:1px solid var(--line-strong);font-weight:550}
.btn.pri{background:var(--ac);color:var(--on-ac);border-color:var(--ac);font-weight:600}
.btn.sm{min-height:40px;padding:0 12px;font-size:14px}

/* drawer */
#drawer{position:absolute;top:0;bottom:0;left:0;width:min(84vw,300px);transform:translateX(-103%);transition:transform .18s ease-out;background:var(--s1);border-right:1px solid var(--bd);z-index:20;display:flex;flex-direction:column}
#drawer.open{transform:none}
```

_First 80 of 588 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
