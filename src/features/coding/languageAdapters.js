// languageAdapters
/**
 * Language Adapters and Execution Utilities for MyJourney Coding Workspace
 */

export const DEFAULT_CSS_PREVIEW_FIXTURE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 2rem;
      background-color: #ffffff;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="myjourney-coding-preview">
    <h1>MyJourney Coding</h1>
    <p>Style this page using CSS.</p>
  </div>
</body>
</html>`;

export const LANGUAGE_CONFIG = {
  html: {
    label: "HTML",
    filename: "index.html",
    tab: "preview",
    monacoLang: "html",
    supportsPreview: true,
  },
  css: {
    label: "CSS",
    filename: "style.css",
    tab: "preview",
    monacoLang: "css",
    supportsPreview: true,
  },
  javascript: {
    label: "JavaScript",
    filename: "script.js",
    tab: "console",
    monacoLang: "javascript",
    supportsPreview: true,
  },
  python: {
    label: "Python",
    filename: "main.py",
    tab: "console",
    monacoLang: "python",
    supportsPreview: false,
  },
};

/**
 * Builds payload for htmlSandboxHarness createSandboxSrcdoc
 */
export function buildSandboxPayload({ language, code, previewFixture, channelNonce }) {
  const lang = (language || "html").toLowerCase();

  if (lang === "html") {
    return {
      html: code,
      css: "",
      js: "",
      channelNonce,
    };
  }

  if (lang === "css") {
    // If previewFixture provided by block or default educational fixture
    const fixtureHtml = previewFixture?.trim() || DEFAULT_CSS_PREVIEW_FIXTURE;
    return {
      html: fixtureHtml,
      css: code,
      js: "",
      channelNonce,
    };
  }

  if (lang === "javascript") {
    return {
      html: '<div id="root" class="preview-root"></div>',
      css: "",
      js: code,
      channelNonce,
    };
  }

  return {
    html: "",
    css: "",
    js: "",
    channelNonce,
  };
}

/**
 * Classifies an error into learner syntax/logic error vs platform execution error
 */
export function classifyRuntimeError(err) {
  const message = typeof err === "string" ? err : err?.message || String(err || "Unknown error");

  // Syntax errors, ReferenceErrors, TypeErrors in user code
  if (
    message.includes("SyntaxError") ||
    message.includes("ReferenceError") ||
    message.includes("TypeError") ||
    message.includes("RangeError") ||
    message.includes("IndentationError") ||
    message.includes("NameError") ||
    message.includes("ZeroDivisionError")
  ) {
    return {
      isLearnerError: true,
      category: "YOUR CODE ERROR",
      message,
    };
  }

  return {
    isLearnerError: false,
    category: "MYJOURNEY EXECUTION ERROR",
    message,
  };
}
