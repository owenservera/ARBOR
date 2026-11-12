// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "claude",
  "label": "Claude",
  "hosts": [
    "claude.ai",
    "www.claude.ai"
  ],
  "url": "https://claude.ai/",
  "threadPattern": /^\/chat\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "div[data-testid=\"chat-input\"]",
      "fieldset div[contenteditable=\"true\"]",
      "div[contenteditable=\"true\"][aria-label=\"Write your prompt to Claude\"]",
      "div.ProseMirror[contenteditable=\"true\"]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "button[aria-label=\"Send message\"]",
      "button[data-testid=\"send-button\"]",
      "fieldset button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "[data-testid=\"assistant-message\"] .standard-markdown",
      "[data-testid=\"assistant-message\"]",
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
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
  "status": "measured",
  "models": {
    "triggerSelector": "button[data-testid=\"model-selector-dropdown\"]",
    "submenuText": "More models",
    "effortMenu": { "text": "Effort", "levels": ["Low", "Medium", "High", "Max"] },
    "ignore": [
      "^effort",
      "^more models",
      "included in",
      "^buy credits",
      "^requires usage credits",
      "^learn more",
      "^(low|medium|high|max)$"
    ],
    "tiers": {
      "strong": [
        "^opus 5\\.5$",
        "^sonnet 5\\.5$"
      ],
      "fast": [
        "^haiku"
      ]
    }
  },
  "strengths": [
    "review",
    "UI/graphics"
  ]
};
