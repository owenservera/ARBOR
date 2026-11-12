// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "zai",
  "label": "Z.ai",
  "hosts": [
    "chat.z.ai",
    "z.ai",
    "www.z.ai"
  ],
  "url": "https://chat.z.ai/",
  "threadPattern": /^\/c\/(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i,
  "composer": {
    "selectors": [
      "textarea#chat-input",
      "#chat-input",
      "textarea[placeholder*=\"Send a Message\" i]",
      "form textarea",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "foreground": true,
    "buttonSelectors": [
      "#send-message-button",
      "form button[type=\"submit\"]",
      "button[type=\"submit\"]"
    ]
  },
  "user": {
    "selectors": [
      ".user-message .chat-user"
    ]
  },
  "assistant": {
    "containerSelectors": [
      ".chat-assistant #response-content-container .markdown-prose"
    ],
    "excludeSelectors": [
      ".thinking-chain-container"
    ],
    "errorTexts": [
      "Model is currently at capacity",
      "is intensifying the coordination of resources"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"stop\" i]",
      "[role=\"button\"][aria-label*=\"stop\" i]",
      "#send-message-button[aria-label*=\"stop\" i]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "a[href*=\"/login\"]",
      "a[href*=\"/signin\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "measured",
  "models": {
    "triggerSelector": "button.modelSelectorButton",
    "ignore": [
      "^effort$",
      "^(max|high|medium|low|none|off)$"
    ],
    "tiers": {
      "strong": [
        "^glm-5\\.3$"
      ],
      "fast": [
        "flash"
      ]
    }
  },
  "strengths": [
    "coding",
    "visual mode"
  ]
};
