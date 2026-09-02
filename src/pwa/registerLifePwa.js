export const registerLifePwa = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const trustworthy = window.location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!trustworthy) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("../../life-sw.js", import.meta.url), { scope: "/" }).then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent("life:pwa-update-ready"));
        });
      });
    }).catch(() => {
      // The capability UI remains honest through feature detection. Avoid
      // logging URLs or user state if registration is blocked by the browser.
    });
  }, { once: true });
};
