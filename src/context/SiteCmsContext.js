import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { settingApi, backupApi, activityLogApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const SiteCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-site-data";

const runForActiveAdmin = async (activeAdminRef, operation) => {
  const ownerId = activeAdminRef.current;
  if (!ownerId) throw Object.assign(new Error("Administrator access is no longer active."), { code: "CMS_ADMIN_CONTEXT_REQUIRED" });
  const result = await operation();
  if (activeAdminRef.current !== ownerId) {
    throw Object.assign(new Error("This administrator response is no longer current."), { code: "CMS_STALE_ADMIN_RESPONSE" });
  }
  return result;
};

export const SiteCmsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const activeAdminId = isAdmin ? String(user?.id || user?._id || "") : "";
  const activeAdminRef = useRef(activeAdminId);
  activeAdminRef.current = activeAdminId;
  const requestVersionRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [settings, setSettings] = useState({});
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dataOwnerId, setDataOwnerId] = useState("");

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchSiteData = async () => {
    const ownerId = activeAdminRef.current;
    if (!ownerId) return;
    const requestVersion = ++requestVersionRef.current;
    setSyncStatus("loading");
    try {
      const [backupsList, logsRes] = await Promise.all([
        backupApi.list(),
        activityLogApi.list({}),
      ]);

      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;

      if (backupsList && Array.isArray(backupsList.backups)) {
        setBackups(backupsList.backups.map((b) => ({ ...b, id: b._id || b.id })));
      }
      if (logsRes && Array.isArray(logsRes.logs)) {
        setLogs(logsRes.logs.map((l) => ({ ...l, id: l._id || l.id })));
      }
      setDataOwnerId(ownerId);
      setSyncStatus("live");
    } catch (err) {
      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;
      setSettings({});
      setBackups([]);
      setLogs([]);
      setDataOwnerId("");
      setSyncStatus("unavailable");
    }
  };

  useEffect(() => {
    requestVersionRef.current += 1;
    setSettings({});
    setBackups([]);
    setLogs([]);
    setDataOwnerId("");
    window.localStorage.removeItem(STORAGE_KEY);
    if (authLoading || !activeAdminId) {
      setSyncStatus("idle");
      return;
    }
    fetchSiteData();
  }, [authLoading, activeAdminId]);

  const actions = useMemo(() => ({
    async refreshSite() {
      await fetchSiteData();
    },
    async getSetting(key) {
      try {
        const res = await runForActiveAdmin(activeAdminRef, () => settingApi.get(key));
        setSettings((prev) => ({ ...prev, [key]: res.value }));
        return res.value;
      } catch (err) {
        console.error(`Failed to fetch setting "${key}":`, err);
        return null;
      }
    },
    async updateSetting(key, value) {
      const res = await runForActiveAdmin(activeAdminRef, () => settingApi.update(key, value));
      setSettings((prev) => ({ ...prev, [key]: value }));
      return res.setting;
    },
    async fetchLogs(params = {}) {
      const res = await runForActiveAdmin(activeAdminRef, () => activityLogApi.list(params));
      const mappedLogs = (res.logs || []).map((l) => ({ ...l, id: l._id || l.id }));
      setLogs(mappedLogs);
      return res;
    },
    async fetchBackups() {
      const res = await runForActiveAdmin(activeAdminRef, () => backupApi.list());
      const mappedBackups = (res.backups || []).map((b) => ({ ...b, id: b._id || b.id }));
      setBackups(mappedBackups);
      return mappedBackups;
    },
    async triggerBackup() {
      const res = await runForActiveAdmin(activeAdminRef, () => backupApi.create());
      const newBackup = { ...res.backup, id: res.backup._id || res.backup.id };
      setBackups((prev) => [newBackup, ...prev]);
      return newBackup;
    },
    async restoreBackup(id) {
      await runForActiveAdmin(activeAdminRef, () => backupApi.restore(id));
    },
    async deleteBackup(id) {
      await runForActiveAdmin(activeAdminRef, () => backupApi.delete(id));
      setBackups((prev) => prev.filter((b) => b.id !== id && b._id !== id));
    }
  }), [activeAdminId]);

  const ownsProtectedState = Boolean(activeAdminId && dataOwnerId === activeAdminId);

  const value = useMemo(() => ({
    settings: ownsProtectedState ? settings : {},
    backups: ownsProtectedState ? backups : [],
    logs: ownsProtectedState ? logs : [],
    syncStatus,
    ...actions
  }), [settings, backups, logs, ownsProtectedState, syncStatus, actions]);

  return <SiteCmsContext.Provider value={value}>{children}</SiteCmsContext.Provider>;
};

export const useSiteCms = () => {
  const context = useContext(SiteCmsContext);
  if (!context) throw new Error("useSiteCms must be used inside SiteCmsProvider");
  return context;
};
