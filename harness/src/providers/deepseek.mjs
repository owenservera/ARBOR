// Selectors seeded from the owner's site profile; individual selectors may be unverified.
export default {
  "id": "deepseek",
  "label": "DeepSeek",
  "hosts": [
    "chat.deepseek.com"
  ],
  "url": "https://chat.deepseek.com/",
  "threadPattern": null,
  "composer": {
    "selectors": [
      "textarea[placeholder*=\"Message DeepSeek\" i]",
      "textarea[name=\"search\"]",
      "textarea#chat-input",
      "div[contenteditable=\"true\"][role=\"textbox\"]",
      "textarea[placeholder*=\"发送消息\" i]",
      "textarea[placeholder*=\"Send\" i]",
      "textarea",
      "[contenteditable=\"true\"]",
      "[role=\"textbox\"]"
    ]
  },
  "send": {
    "strategy": "enter",
    "buttonSelectors": [
      "div[role=\"button\"][aria-label*=\"发送\" i]",
      "button[aria-label*=\"Send\" i]",
      "button[type=\"submit\"]"
    ]
  },
  "assistant": {
    "containerSelectors": [
      "div.ds-markdown",
      "div[class*=\"markdown\"]",
      "[data-message-author-role=\"assistant\"]",
      "article",
      "[data-testid*=\"assistant\" i]"
    ],
    "streamingSelectors": [
      "button[aria-label*=\"stop\" i]",
      "[role=\"button\"][aria-label*=\"stop\" i]",
      "[data-testid=\"stop-button\"]",
      "[aria-busy=\"true\"]:not(button)"
    ]
  },
  "preflight": {
    "authWallSelectors": [
      "input.ds-input__input[type=\"password\"][placeholder=\"Password\"]",
      ".ds-sign-in-form__social-link",
      "a[href*=\"/sign_in\"]",
      "a[href*=\"/login\"]",
      "form[action*=\"login\"]"
    ]
  },
  "status": "measured",
  "strengths": [
    "coding",
    "complex routing"
  ]
};
