let capability = Object.freeze({ available: false, state: "not_registered", scope: "" });

const publishCapability = (next) => {
  capability = Object.freeze({ ...next });
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("life:pwa-capability", { detail: capability }));
  return capability;
};

export const getLifePwaCapability = () => ({ ...capability });

export const registerLifePwa = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return publishCapability({ available: false, state: "unsupported", scope: "" });
  const trustworthy = window.location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!trustworthy) return publishCapability({ available: false, state: "untrusted_context", scope: "" });

  const register = () => navigator.serviceWorker.register(new URL("../../life-sw.js", import.meta.url), { scope: "/" }).then((registration) => {
    publishCapability({ available: true, state: "registered", scope: registration.scope || "/" });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent("life:pwa-update-ready"));
      });
    });
    return registration;
  }).catch(() => {
    publishCapability({ available: false, state: "registration_failed", scope: "" });
    return null;
  });

  if (document.readyState === "complete") return register();
  publishCapability({ available: false, state: "registration_pending", scope: "" });
  window.addEventListener("load", register, { once: true });
  return capability;
};
