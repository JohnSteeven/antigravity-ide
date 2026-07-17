import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { settingApi, backupApi, activityLogApi } from "../services/apiService";

const SiteCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-site-data";

export const SiteCmsProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState("loading");
  const [settings, setSettings] = useState({});
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);

  // Load from local storage fallback
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.backups) setBackups(parsed.backups);
        if (parsed.logs) setLogs(parsed.logs);
      }
    } catch (err) {
      console.warn("Failed to load local site cache", err);
    }
  }, []);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, backups, logs }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [settings, backups, logs]);

  const fetchSiteData = async () => {
    setSyncStatus("loading");
    try {
      const [backupsList, logsRes] = await Promise.all([
        backupApi.list().catch(() => ({ backups: [] })),
        activityLogApi.list({}).catch(() => ({ logs: [] })),
      ]);

      if (backupsList && Array.isArray(backupsList.backups)) {
        setBackups(backupsList.backups.map((b) => ({ ...b, id: b._id || b.id })));
      }
      if (logsRes && Array.isArray(logsRes.logs)) {
        setLogs(logsRes.logs.map((l) => ({ ...l, id: l._id || l.id })));
      }
      setSyncStatus("live");
    } catch (err) {
      console.warn("Failed to fetch live site data, using stale fallback", err);
      setSyncStatus("stale-fallback");
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, []);

  const actions = useMemo(() => ({
    async refreshData() {
      await fetchSiteData();
    },
    async getSetting(key) {
      try {
        const res = await settingApi.get(key);
        setSettings((prev) => ({ ...prev, [key]: res.value }));
        return res.value;
      } catch (err) {
        console.error(`Failed to fetch setting "${key}":`, err);
        return null;
      }
    },
    async updateSetting(key, value) {
      const res = await settingApi.update(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      return res.setting;
    },
    async fetchLogs(params = {}) {
      const res = await activityLogApi.list(params);
      const mappedLogs = (res.logs || []).map((l) => ({ ...l, id: l._id || l.id }));
      setLogs(mappedLogs);
      return res;
    },
    async fetchBackups() {
      const res = await backupApi.list();
      const mappedBackups = (res.backups || []).map((b) => ({ ...b, id: b._id || b.id }));
      setBackups(mappedBackups);
      return mappedBackups;
    },
    async triggerBackup() {
      const res = await backupApi.create();
      const newBackup = { ...res.backup, id: res.backup._id || res.backup.id };
      setBackups((prev) => [newBackup, ...prev]);
      return newBackup;
    },
    async restoreBackup(id) {
      await backupApi.restore(id);
    },
    async deleteBackup(id) {
      await backupApi.delete(id);
      setBackups((prev) => prev.filter((b) => b.id !== id && b._id !== id));
    }
  }), []);

  const value = useMemo(() => ({
    settings,
    backups,
    logs,
    syncStatus,
    ...actions
  }), [settings, backups, logs, syncStatus, actions]);

  return <SiteCmsContext.Provider value={value}>{children}</SiteCmsContext.Provider>;
};

export const useSiteCms = () => {
  const context = useContext(SiteCmsContext);
  if (!context) throw new Error("useSiteCms must be used inside SiteCmsProvider");
  return context;
};
