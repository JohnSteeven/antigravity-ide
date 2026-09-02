const resolveBrowserApi = (provided, globalName) => {
  if (provided) return provided;
  if (typeof globalThis === "undefined") return undefined;
  return globalThis[globalName];
};

const copyToClipboard = async (text, options = {}) => {
  const navigatorObject = resolveBrowserApi(options.navigatorObject, "navigator");
  const documentObject = resolveBrowserApi(options.documentObject, "document");

  if (typeof navigatorObject?.clipboard?.writeText === "function") {
    try {
      await navigatorObject.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to the selection-based browser fallback.
    }
  }

  if (!documentObject?.body || typeof documentObject.createElement !== "function") return false;
  const textArea = documentObject.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  documentObject.body.appendChild(textArea);
  try {
    textArea.focus();
    textArea.select();
    return typeof documentObject.execCommand === "function" && documentObject.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
};

const shareArticle = async ({
  title,
  text,
  url,
  preferNative = true,
  navigatorObject,
  documentObject,
} = {}) => {
  const browserNavigator = resolveBrowserApi(navigatorObject, "navigator");
  if (preferNative && typeof browserNavigator?.share === "function") {
    try {
      const shareData = { title, url };
      if (text) shareData.text = text;
      await browserNavigator.share(shareData);
      return { ok: true, method: "native" };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: false, method: "cancelled" };
      // A provider/browser failure should still get the reliable copy fallback.
    }
  }

  let copied = false;
  try {
    copied = await copyToClipboard(url, { navigatorObject: browserNavigator, documentObject });
  } catch {
    copied = false;
  }
  return { ok: copied, method: copied ? "clipboard" : "failed" };
};

module.exports = { copyToClipboard, shareArticle };
