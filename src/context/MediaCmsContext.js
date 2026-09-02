import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { mediaApi, galleryApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const MediaCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-media-data";

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  return { ...item, id: item._id || item.id };
};

export const MediaCmsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const [syncStatus, setSyncStatus] = useState("loading");
  const [media, setMedia] = useState([]);

  // Load from local storage fallback
  useEffect(() => {
    if (authLoading || !isAdmin) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.media) setMedia(parsed.media);
      }
    } catch (err) {
      console.warn("Failed to load local media cache", err);
    }
  }, [authLoading, isAdmin]);

  // Debounced save
  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ media }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAdmin, media]);

  const fetchMediaData = async () => {
    setSyncStatus("loading");
    try {
      const mediaRes = await mediaApi.list({ includeDeleted: true });
      if (mediaRes && Array.isArray(mediaRes.files)) {
        setMedia(mediaRes.files.map(withClientId));
      }
      setSyncStatus("live");
    } catch (err) {
      console.warn("Failed to fetch live media, using stale fallback", err);
      setSyncStatus("stale-fallback");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setMedia([]);
      setSyncStatus("idle");
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    fetchMediaData();
  }, [authLoading, isAdmin]);

  const actions = useMemo(() => ({
    async refreshMedia() {
      await fetchMediaData();
    },
    async uploadMedia(file, folder) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await mediaApi.upload(formData);
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev]);
      return normalized;
    },
    async saveMedia(m) {
      const res = await mediaApi.create(m);
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev]);
      return normalized;
    },
    async renameMedia(id, newName) {
      const res = await mediaApi.rename(id, newName);
      const normalized = withClientId(res.media);
      setMedia((prev) => prev.map((m) => (m.id === id || m._id === id) ? normalized : m));
      return normalized;
    },
    async moveMedia(id, folder) {
      const res = await mediaApi.move(id, folder);
      const normalized = withClientId(res.media);
      setMedia((prev) => prev.map((m) => (m.id === id || m._id === id) ? normalized : m));
      return normalized;
    },
    async deleteMedia(id) {
      await mediaApi.delete(id);
      setMedia((prev) => prev.filter((m) => m.id !== id && m._id !== id));
    },
    async restoreMedia(id) {
      const res = await mediaApi.restore(id);
      const normalized = withClientId(res.media);
      setMedia((prev) => [normalized, ...prev.filter((m) => m.id !== id && m._id !== id)]);
      return normalized;
    },
    async fetchGallery(params = {}) {
      return galleryApi.list(params);
    },
    async fetchGalleryAlbums() {
      const res = await galleryApi.albums();
      return res.albums || [];
    },
    async saveGalleryItem(item) {
      const isEdit = !!(item.id || item._id);
      let res;
      if (isEdit) {
        res = await galleryApi.update(item.id || item._id, item);
      } else {
        res = await galleryApi.create(item);
      }
      return res.file;
    },
    async deleteGalleryItem(id) {
      await galleryApi.delete(id);
    },
    async restoreGalleryItem(id) {
      const res = await galleryApi.restore(id);
      return res.file;
    }
  }), []);

  const value = useMemo(() => ({
    media,
    syncStatus,
    ...actions
  }), [media, syncStatus, actions]);

  return <MediaCmsContext.Provider value={value}>{children}</MediaCmsContext.Provider>;
};

export const useMediaCms = () => {
  const context = useContext(MediaCmsContext);
  if (!context) throw new Error("useMediaCms must be used inside MediaCmsProvider");
  return context;
};
