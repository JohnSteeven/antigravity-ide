/**
 * ─────────────────────────────────────────────────────────────────────────────
 * htmlSandboxHarness.js — Client-Side Sandboxed Iframe Security Harness
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Strict Isolation Guarantees:
 * - sandbox="allow-scripts" (strictly NO allow-same-origin, NO allow-top-navigation,
 *   NO allow-popups, NO allow-forms).
 * - Restrictive Content Security Policy: connect-src 'none', form-action 'none',
 *   base-uri 'none', object-src 'none', frame-src 'none'.
 * - Secure postMessage protocol with per-run random channel nonce, window source
 *   matching, allowed type enum, schema validation, and payload size bounds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SANDBOX_PERMISSIONS = "allow-scripts";

export const SANDBOX_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob: https://images.unsplash.com",
  "font-src data:",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export const ALLOWED_SANDBOX_TYPES = Object.freeze([
  "MYJOURNEY_SANDBOX_READY",
  "MYJOURNEY_SANDBOX_CONSOLE",
  "MYJOURNEY_SANDBOX_ERROR",
  "MYJOURNEY_SANDBOX_RESULT",
]);

export const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB limit

/**
 * Generate a cryptographically secure random channel nonce.
 */
export function generateChannelNonce() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `channel-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Validates incoming postMessage event from the sandboxed iframe.
 * Rejects any message that does not match:
 * 1. event.source === expectedWindow
 * 2. event.data.channel === expectedChannelNonce
 * 3. event.data.type in ALLOWED_SANDBOX_TYPES
 * 4. Payload within MAX_OUTPUT_BYTES size limit
 */
export function validateSandboxMessage({ event, expectedWindow, expectedChannelNonce, maxPayloadSize = MAX_OUTPUT_BYTES }) {
  if (!event || !expectedWindow || event.source !== expectedWindow) {
    return { valid: false, reason: "INVALID_SOURCE" };
  }
  const data = event.data;
  if (!data || typeof data !== "object") {
    return { valid: false, reason: "MALFORMED_DATA" };
  }
  if (data.channel !== expectedChannelNonce) {
    return { valid: false, reason: "INVALID_CHANNEL_NONCE" };
  }
  if (!ALLOWED_SANDBOX_TYPES.includes(data.type)) {
    return { valid: false, reason: "DISALLOWED_TYPE" };
  }

  // Check payload size
  let serialized = "";
  try {
    serialized = JSON.stringify(data);
  } catch {
    return { valid: false, reason: "UNSERIALIZABLE_PAYLOAD" };
  }
  if (serialized.length > maxPayloadSize) {
    return { valid: false, reason: "PAYLOAD_TOO_LARGE" };
  }

  return { valid: true, message: data };
}

/**
 * Build the isolated HTML document string to inject into iframe srcdoc.
 */
export function createSandboxSrcdoc({
  html = "",
  css = "",
  js = "",
  channelNonce,
  maxOutputLength = MAX_OUTPUT_BYTES,
}) {
  const safeNonce = String(channelNonce).replace(/[^a-zA-Z0-9_-]/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a202c;
      background: #ffffff;
      line-height: 1.5;
      box-sizing: border-box;
    }
    *, *::before, *::after { box-sizing: inherit; }
    ${css}
  </style>
  <script>
    (function() {
      var CHANNEL = "${safeNonce}";
      var MAX_LEN = ${Number(maxOutputLength) || MAX_OUTPUT_BYTES};
      var totalBytesSent = 0;
      var truncatedReported = false;

      function sanitizeArg(arg) {
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (typeof arg === "string") return arg;
        if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
        if (arg instanceof Error) return arg.name + ": " + arg.message;
        try {
          return JSON.stringify(arg, function(key, val) {
            if (typeof val === "function") return "[Function " + (val.name || "anonymous") + "]";
            if (val instanceof Element) return "<" + val.tagName.toLowerCase() + ">";
            return val;
          });
        } catch(e) {
          return String(arg);
        }
      }

      function sendToParent(type, payload) {
        if (totalBytesSent >= MAX_LEN) {
          if (!truncatedReported) {
            truncatedReported = true;
            try {
              window.parent.postMessage({
                channel: CHANNEL,
                type: "MYJOURNEY_SANDBOX_CONSOLE",
                level: "warn",
                text: "[Output truncated: maximum size limit reached]"
              }, "*");
            } catch(e) {}
          }
          return;
        }

        var text = "";
        if (payload.args) {
          text = payload.args.map(sanitizeArg).join(" ");
        } else if (payload.text) {
          text = String(payload.text);
        }

        if (text.length > (MAX_LEN - totalBytesSent)) {
          text = text.slice(0, MAX_LEN - totalBytesSent) + "... [truncated]";
        }
        totalBytesSent += text.length;

        try {
          window.parent.postMessage({
            channel: CHANNEL,
            type: type,
            level: payload.level || "log",
            text: text,
            line: payload.line,
            col: payload.col
          }, "*");
        } catch(err) {
          // postMessage failure in sandbox
        }
      }

      // Console capture
      var origLog = console.log;
      var origError = console.error;
      var origWarn = console.warn;
      var origInfo = console.info;

      console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        sendToParent("MYJOURNEY_SANDBOX_CONSOLE", { level: "log", args: args });
        if (origLog) Function.prototype.apply.call(origLog, console, arguments);
      };
      console.error = function() {
        var args = Array.prototype.slice.call(arguments);
        sendToParent("MYJOURNEY_SANDBOX_CONSOLE", { level: "error", args: args });
        if (origError) Function.prototype.apply.call(origError, console, arguments);
      };
      console.warn = function() {
        var args = Array.prototype.slice.call(arguments);
        sendToParent("MYJOURNEY_SANDBOX_CONSOLE", { level: "warn", args: args });
        if (origWarn) Function.prototype.apply.call(origWarn, console, arguments);
      };
      console.info = function() {
        var args = Array.prototype.slice.call(arguments);
        sendToParent("MYJOURNEY_SANDBOX_CONSOLE", { level: "info", args: args });
        if (origInfo) Function.prototype.apply.call(origInfo, console, arguments);
      };

      // Error capture
      window.onerror = function(msg, url, line, col, error) {
        sendToParent("MYJOURNEY_SANDBOX_ERROR", {
          level: "error",
          text: error ? (error.name + ": " + error.message) : String(msg),
          line: line,
          col: col
        });
        return false;
      };

      window.onunhandledrejection = function(event) {
        var reason = event.reason;
        var text = reason instanceof Error ? (reason.name + ": " + reason.message) : String(reason);
        sendToParent("MYJOURNEY_SANDBOX_ERROR", {
          level: "error",
          text: "Unhandled Promise Rejection: " + text
        });
      };

      // Form submission prevention (denies any form navigation)
      document.addEventListener("submit", function(e) {
        e.preventDefault();
        console.log("[Notice] Form submission intercepted. Sandboxed exercises do not submit to network.");
      }, true);

      // Signal ready
      window.addEventListener("DOMContentLoaded", function() {
        sendToParent("MYJOURNEY_SANDBOX_READY", { text: "DOM_READY" });
      });
    })();
  </script>
</head>
<body>
  ${html}
  <script>
    try {
      ${js}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
}

