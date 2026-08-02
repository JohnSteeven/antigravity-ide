import { useCallback, useEffect, useState } from "react";
import { securityService } from "../services/securityService";

export const useSecurityCenter = (user) => {
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [historyData, setHistoryData] = useState({ logs: [], pagination: { page: 1, totalPages: 1 } });
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [historyParams, setHistoryParams] = useState({
    page: 1,
    limit: 5,
    range: "all",
    search: "",
  });

  const fetchOverview = useCallback(async () => {
    try {
      const res = await securityService.getOverview();
      if (res?.overview) setOverview(res.overview);
    } catch (err) {
      console.warn("Could not fetch security overview from API, using defaults:", err?.message || err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await securityService.getSessions();
      if (res?.sessions) setSessions(res.sessions);
    } catch (err) {
      console.warn("Could not fetch sessions from API:", err?.message || err);
    }
  }, []);

  const fetchHistory = useCallback(async (params = historyParams) => {
    try {
      const res = await securityService.getLoginHistory(params);
      if (res?.logs) {
        setHistoryData({ logs: res.logs, pagination: res.pagination });
      }
    } catch (err) {
      console.warn("Could not fetch login history from API:", err?.message || err);
    }
  }, [historyParams]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await securityService.getDevices();
      if (res?.devices) setDevices(res.devices);
    } catch (err) {
      console.warn("Could not fetch trusted devices from API:", err?.message || err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([fetchOverview(), fetchSessions(), fetchHistory(), fetchDevices()]);
    } catch (err) {
      setError(err.message || "Failed to load security center data.");
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, fetchSessions, fetchHistory, fetchDevices]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const revokeSession = async (sessionId) => {
    await securityService.revokeSession(sessionId);
    await fetchSessions();
    await fetchOverview();
  };

  const revokeAllOtherSessions = async () => {
    await securityService.revokeAllOtherSessions();
    await fetchSessions();
    await fetchOverview();
  };

  const renameDevice = async (deviceId, newName) => {
    await securityService.renameDevice(deviceId, newName);
    await fetchDevices();
  };

  const removeDevice = async (deviceId) => {
    await securityService.removeDevice(deviceId);
    await fetchDevices();
  };

  const updateHistoryParams = (newParams) => {
    setHistoryParams((prev) => {
      const next = { ...prev, ...newParams };
      fetchHistory(next);
      return next;
    });
  };

  return {
    overview,
    sessions,
    historyData,
    devices,
    loading,
    error,
    historyParams,
    updateHistoryParams,
    revokeSession,
    revokeAllOtherSessions,
    renameDevice,
    removeDevice,
    refreshAll: loadAll,
  };
};
