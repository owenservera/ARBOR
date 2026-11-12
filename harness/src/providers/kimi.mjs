// Kimi (kimi.com, Moonshot) web chat profile. SEEDED, UNVERIFIED.
//
// No live DOM inspection has been done for this provider. Every selector below is a
// conservative generic fallback (textarea / contenteditable / role=textbox / aria-busy /
// markdown-class heuristics), NOT a measured Kimi selector. Do not treat any of them as
// proven. status stays 'seeded-unverified' until the fields below are measured live.
//
// MUST BE MEASURED LIVE (on the lab profile, port 9333, no VIVIM profile) before this
// profile may be called 'measured' and flipped to status: 'measured':
//   1. hosts / url          : confirm kimi.com is the chat host; check whether www.kimi.com
//                             or any regional/alternate host (e.g. Moonshot's China site)
//                             serves the same chat and must be added.
//   2. threadPattern        : currently null (cannot bind threads). Measure the real
//                             conversation route (e.g. /chat/<id>) and anchor a named (?<id>)
//                             regex only if it is stable and exact.
//   3. composer.selectors   : measure the real input element and placeholder text.
//   4. send.strategy        : measure whether Enter or a button submits, and whether a
//                             background tab needs foreground:true (see qwen.mjs note).
//   5. send.buttonSelectors : measure the real send control, if strategy is 'button'.
//   6. assistant.containerSelectors : measure the real assistant-reply container.
//   7. assistant.streamingSelectors : measure the real stop/streaming indicator.
//   8. preflight.authWallSelectors  : measure the real signed-out / login wall.
//   9. models               : intentionally omitted. Add only after measuring a model
//                             picker trigger; do not infer one.
// Until all of the above are measured, the profile is reachable for routing tests only.
export default {
  "id": "kimi",
  "label": "Kimi",
  "hosts": [
    "kimi.com"
  ],
  "url": "https://kimi.com/",
  "threadPattern": null,
  "composer": {
    "selectors": [
      "textarea",
      "div[contenteditable=\"true\"][role=\"textbox\"]",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "button[type=\"submit\"]",
      "button[aria-label*=\"Send\" i]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "[data-message-author-role=\"assistant\"]",
      "div[class*=\"markdown\"]",
      "article"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"stop\" i]",
      "[aria-busy=\"true\"]"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"/login\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "seeded-unverified"
};
