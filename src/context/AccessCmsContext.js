import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { userApi, roleApi, permissionApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const AccessCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-access-data";

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  return { ...item, id: item._id || item.id };
};

export const AccessCmsProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState("loading");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  // Load initial fallback from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.roles) setRoles(parsed.roles);
      }
    } catch (err) {
      console.warn("Failed to load local access cache", err);
    }
  }, []);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, roles }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [users, roles]);

  const fetchAccessData = async () => {
    setSyncStatus("loading");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userApi.list({}).catch(() => ({ users: [] })),
        roleApi.list({ includeDeleted: true }).catch(() => ({ roles: [] })),
      ]);

      if (usersRes && Array.isArray(usersRes.users)) {
        setUsers(usersRes.users.map(withClientId));
      }
      if (rolesRes && Array.isArray(rolesRes.roles)) {
        setRoles(rolesRes.roles.map(withClientId));
      }
      setSyncStatus("live");
    } catch (err) {
      console.warn("Failed to fetch live access data, using stale fallback", err);
      setSyncStatus("stale-fallback");
    }
  };

  const { isAuthenticated, user } = useAuth();
  const isAdminOrEditor = isAuthenticated && (user?.role === "Admin" || user?.role === "Editor");

  useEffect(() => {
    if (isAdminOrEditor) {
      fetchAccessData();
    }
  }, [isAdminOrEditor]);

  const actions = useMemo(() => ({
    async refreshAccess() {
      await fetchAccessData();
    },
    async fetchUsers(params = {}) {
      const res = await userApi.list(params);
      setUsers((res.users || []).map(withClientId));
      return res;
    },
    async fetchUserById(id) {
      return userApi.get(id);
    },
    async updateUser(id, payload) {
      const res = await userApi.update(id, payload);
      const normalized = withClientId(res.user);
      setUsers((prev) => prev.map((u) => (u.id === id || u._id === id) ? normalized : u));
      return res.user;
    },
    async suspendUser(id) {
      const res = await userApi.suspend(id);
      const normalized = withClientId(res.user);
      setUsers((prev) => prev.map((u) => (u.id === id || u._id === id) ? normalized : u));
      return res.user;
    },
    async deleteUser(id) {
      await userApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id && u._id !== id));
    },
    async restoreUser(id) {
      const res = await userApi.restore(id);
      const usersRes = await userApi.list({});
      setUsers((usersRes.users || []).map(withClientId));
      return res.user;
    },
    async forceLogoutUser(id) {
      const res = await userApi.forceLogout(id);
      return res.user;
    },
    async resetUserPassword(id, password) {
      return userApi.resetPassword(id, password);
    },
    async fetchRoles(params = {}) {
      const res = await roleApi.list(params);
      setRoles((res.roles || []).map(withClientId));
      return res.roles;
    },
    async createRole(payload) {
      const res = await roleApi.create(payload);
      const normalized = withClientId(res.role);
      setRoles((prev) => [...prev, normalized]);
      return res.role;
    },
    async updateRole(id, payload) {
      const res = await roleApi.update(id, payload);
      const normalized = withClientId(res.role);
      setRoles((prev) => prev.map((r) => (r.id === id || r._id === id) ? normalized : r));
      return res.role;
    },
    async deleteRole(id) {
      await roleApi.delete(id);
      setRoles((prev) => prev.filter((r) => r.id !== id && r._id !== id));
    },
    async cloneRole(id, name) {
      const res = await roleApi.clone(id, name);
      const normalized = withClientId(res.role);
      setRoles((prev) => [...prev, normalized]);
      return res.role;
    },
    async fetchPermissions() {
      const res = await permissionApi.list();
      return res.permissions;
    },
    async updateRolePermissions(roleId, permissions) {
      const res = await permissionApi.update(roleId, permissions);
      const normalized = withClientId(res.role);
      setRoles((prev) => prev.map((r) => (r.id === roleId || r._id === roleId) ? normalized : r));
      return res.role;
    }
  }), [users, roles]);

  const value = useMemo(() => ({
    users,
    roles,
    syncStatus,
    ...actions
  }), [users, roles, syncStatus, actions]);

  return <AccessCmsContext.Provider value={value}>{children}</AccessCmsContext.Provider>;
};

export const useAccessCms = () => {
  const context = useContext(AccessCmsContext);
  if (!context) throw new Error("useAccessCms must be used inside AccessCmsProvider");
  return context;
};
