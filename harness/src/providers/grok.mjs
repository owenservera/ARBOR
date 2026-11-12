// Selectors seeded from the owner's site profile; individual selectors may be unverified.
// Status is 'seeded-unverified' (WO-043): the picker labels and separator were never read
// live from grok.com (no measured-evidence lane has run), so this profile must not claim
// 'measured' while its own header says the model labels are namespaces, not measurements.
export default {
  "id": "grok",
  "label": "Grok",
  "hosts": [
    "grok.com",
    "www.grok.com",
    "grok.x.ai"
  ],
  "url": "https://grok.com/",
  "threadPattern": /^\/chat\/(?<id>[0-9a-zA-Z0-9_-]+)\/?$/i,
  "composer": {
    "selectors": [
      "div[contenteditable=\"true\"]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "button[data-testid=\"send-button\"]",
      "button[aria-label=\"Send\"]",
      "button[aria-label=\"Send prompt\"]",
      "form button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]",
      "div[class*=\"prose\"]"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"Stop\" i]",
      "[role=\"button\"][aria-label*=\"Stop\" i]",
      "[data-testid=\"stop-button\"]",
      "[data-is-streaming=\"true\"]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"/login\"]",
      "button[data-testid=\"login-button\"]",
      "input[name=\"email\"][autocomplete=\"username\"]",
      "form[action*=\"login\"]"
    ],
    "dismissButtonTexts": ["Reject all cookies"]
  },
  "status": "seeded-unverified",
  "models": {
    "triggerSelector": "button[data-testid=\"model-selector-dropdown\"], button[aria-label*=\"model\"]",
    // MODEL LABELS ARE NOT MEASURED LIVE (see the header). These are namespaces, NOT a measured
    // list of models: a grok model name is "grok" + an optional separator + a version number
    // ("Grok 4", "grok-4", "Grok4"), and the mini/fast rows are the smaller variants. The version
    // number is required, so a grok-prefixed row that carries no version is never picked as a
    // model. models.efforts / models.ignore must never claim a pattern a tier also matches: a label
    // a tier can match has to survive normalizeModels as a model, or the tier resolves to null.
    // A measured-evidence lane must read the real picker labels and correct these patterns before
    // any of this is called proven.
    "efforts": [
      "^mini$",
      "^light$",
      "^standard$",
      "^extended$",
      "^thinking"
    ],
    "ignore": [
      "^groks?$",
      "^mini$",
      "^auto$"
    ],
    "tiers": {
      "strong": [
        "^grok[\\s._-]*\\d+(?![\\s._-]*mini)",
        "^grok[\\s._-]*\\d"
      ],
      "fast": [
        "^grok[\\s._-]*\\d*[\\s._-]*mini",
        "^grok[\\s._-]*\\d+[\\s._-]*fast"
      ]
    }
  },
  "strengths": [
    "reasoning",
    "coding",
    "research"
  ]
};
