const PRIVATE_DATABASES = Object.freeze(["myjourney-life-private"]);

const deleteDatabase = (name) => new Promise((resolve) => {
  if (typeof indexedDB === "undefined") return resolve({ name, deleted: false, reason: "unsupported" });
  const request = indexedDB.deleteDatabase(name);
  request.onsuccess = () => resolve({ name, deleted: true });
  request.onerror = () => resolve({ name, deleted: false, reason: "error" });
  request.onblocked = () => resolve({ name, deleted: false, reason: "blocked" });
});

export const purgePrivateBrowserData = async (reason = "account_boundary") => {
  const results = await Promise.all(PRIVATE_DATABASES.map(deleteDatabase));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("myjourney:private-data-cleared", { detail: { reason, results } }));
  return results;
};

export default purgePrivateBrowserData;
