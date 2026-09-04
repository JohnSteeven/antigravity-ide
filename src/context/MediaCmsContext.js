import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { mediaApi, galleryApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const MediaCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-media-data";

const runForActiveAdmin = async (activeAdminRef, operation) => {
  const ownerId = activeAdminRef.current;
  if (!ownerId) throw Object.assign(new Error("Administrator access is no longer active."), { code: "CMS_ADMIN_CONTEXT_REQUIRED" });
  const result = await operation();
  if (activeAdminRef.current !== ownerId) {
    throw Object.assign(new Error("This administrator response is no longer current."), { code: "CMS_STALE_ADMIN_RESPONSE" });
  }
  return result;
};

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  return { ...item, id: item._id || item.id };
};

export const MediaCmsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const activeAdminId = isAdmin ? String(user?.id || user?._id || "") : "";
  const activeAdminRef = useRef(activeAdminId);
  activeAdminRef.current = activeAdminId;
  const requestVersionRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [media, setMedia] = useState([]);
  const [dataOwnerId, setDataOwnerId] = useState("");

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchMediaData = async () => {
    const ownerId = activeAdminRef.current;
    if (!ownerId) return;
    const requestVersion = ++requestVersionRef.current;
    setSyncStatus("loading");
    try {
      const mediaRes = await mediaApi.list({ includeDeleted: true });
      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;
      if (mediaRes && Array.isArray(mediaRes.files)) {
        setMedia(mediaRes.files.map(withClientId));
      }
      setDataOwnerId(ownerId);
      setSyncStatus("live");
    } catch (err) {
      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;
      setMedia([]);
      setDataOwnerId("");
      setSyncStatus("unavailable");
    }
  };

  useEffect(() => {
    requestVersionRef.current += 1;
    setMedia([]);
    setDataOwnerId("");
    window.localStorage.removeItem(STORAGE_KEY);
    if (authLoading || !activeAdminId) {
      setSyncStatus("idle");
      return;
    }
    fetchMediaData();
  }, [authLoading, activeAdminId]);

  const actions = useMemo(() => ({
    async refreshMedia() {
      await fetchMediaData();
    },
    async uploadMedia(file, folder) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await runForActiveAdmin(activeAdminRef, () => mediaApi.upload(formData));
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev]);
      return normalized;
    },
    async saveMedia(m) {
      const res = await runForActiveAdmin(activeAdminRef, () => mediaApi.create(m));
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev]);
      return normalized;
    },
    async renameMedia(id, newName) {
      const res = await runForActiveAdmin(activeAdminRef, () => mediaApi.rename(id, newName));
      const normalized = withClientId(res.media);
      setMedia((prev) => prev.map((m) => (m.id === id || m._id === id) ? normalized : m));
      return normalized;
    },
    async moveMedia(id, folder) {
      const res = await runForActiveAdmin(activeAdminRef, () => mediaApi.move(id, folder));
      const normalized = withClientId(res.media);
      setMedia((prev) => prev.map((m) => (m.id === id || m._id === id) ? normalized : m));
      return normalized;
    },
    async deleteMedia(id) {
      await runForActiveAdmin(activeAdminRef, () => mediaApi.delete(id));
      setMedia((prev) => prev.filter((m) => m.id !== id && m._id !== id));
    },
    async restoreMedia(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => mediaApi.restore(id));
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev.filter((m) => m.id !== id && m._id !== id)]);
      return normalized;
    },
    async fetchGallery(params = {}) {
      return runForActiveAdmin(activeAdminRef, () => galleryApi.list(params));
    },
    async fetchGalleryAlbums() {
      const res = await runForActiveAdmin(activeAdminRef, () => galleryApi.albums());
      return res.albums || [];
    },
    async saveGalleryItem(item) {
      const isEdit = !!(item.id || item._id);
      let res;
      if (isEdit) {
        res = await runForActiveAdmin(activeAdminRef, () => galleryApi.update(item.id || item._id, item));
      } else {
        res = await runForActiveAdmin(activeAdminRef, () => galleryApi.create(item));
      }
      return res.file;
    },
    async deleteGalleryItem(id) {
      await runForActiveAdmin(activeAdminRef, () => galleryApi.delete(id));
    },
    async restoreGalleryItem(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => galleryApi.restore(id));
      return res.file;
    }
  }), [activeAdminId]);

  const ownsProtectedState = Boolean(activeAdminId && dataOwnerId === activeAdminId);

  const value = useMemo(() => ({
    media: ownsProtectedState ? media : [],
    syncStatus,
    ...actions
  }), [media, ownsProtectedState, syncStatus, actions]);

  return <MediaCmsContext.Provider value={value}>{children}</MediaCmsContext.Provider>;
};

export const useMediaCms = () => {
  const context = useContext(MediaCmsContext);
  if (!context) throw new Error("useMediaCms must be used inside MediaCmsProvider");
  return context;
};
