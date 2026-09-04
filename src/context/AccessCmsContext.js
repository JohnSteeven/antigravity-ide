import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { userApi, roleApi, permissionApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const AccessCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-access-data";

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

export const AccessCmsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const activeAdminId = isAdmin ? String(user?.id || user?._id || "") : "";
  const activeAdminRef = useRef(activeAdminId);
  activeAdminRef.current = activeAdminId;
  const requestVersionRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dataOwnerId, setDataOwnerId] = useState("");

  useEffect(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const fetchAccessData = async () => {
    const ownerId = activeAdminRef.current;
    if (!ownerId) return;
    const requestVersion = ++requestVersionRef.current;
    setSyncStatus("loading");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userApi.list({}),
        roleApi.list({ includeDeleted: true }),
      ]);

      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;

      if (usersRes && Array.isArray(usersRes.users)) {
        setUsers(usersRes.users.map(withClientId));
      }
      if (rolesRes && Array.isArray(rolesRes.roles)) {
        setRoles(rolesRes.roles.map(withClientId));
      }
      setDataOwnerId(ownerId);
      setSyncStatus("live");
    } catch (err) {
      if (requestVersion !== requestVersionRef.current || activeAdminRef.current !== ownerId) return;
      setUsers([]);
      setRoles([]);
      setDataOwnerId("");
      setSyncStatus("unavailable");
    }
  };

  useEffect(() => {
    requestVersionRef.current += 1;
    setUsers([]);
    setRoles([]);
    setDataOwnerId("");
    window.localStorage.removeItem(STORAGE_KEY);
    if (authLoading || !activeAdminId) {
      setSyncStatus("idle");
      return;
    }
    fetchAccessData();
  }, [authLoading, activeAdminId]);

  const actions = useMemo(() => ({
    async refreshAccess() {
      await fetchAccessData();
    },
    async fetchUsers(params = {}) {
      const res = await runForActiveAdmin(activeAdminRef, () => userApi.list(params));
      setUsers((res.users || []).map(withClientId));
      return res;
    },
    async fetchUserById(id) {
      return runForActiveAdmin(activeAdminRef, () => userApi.get(id));
    },
    async updateUser(id, payload) {
      const res = await runForActiveAdmin(activeAdminRef, () => userApi.update(id, payload));
      const normalized = withClientId(res.user);
      setUsers((prev) => prev.map((u) => (u.id === id || u._id === id) ? normalized : u));
      return res.user;
    },
    async suspendUser(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => userApi.suspend(id));
      const normalized = withClientId(res.user);
      setUsers((prev) => prev.map((u) => (u.id === id || u._id === id) ? normalized : u));
      return res.user;
    },
    async deleteUser(id) {
      await runForActiveAdmin(activeAdminRef, () => userApi.delete(id));
      setUsers((prev) => prev.filter((u) => u.id !== id && u._id !== id));
    },
    async restoreUser(id) {
      const { res, usersRes } = await runForActiveAdmin(activeAdminRef, async () => ({
        res: await userApi.restore(id),
        usersRes: await userApi.list({}),
      }));
      setUsers((usersRes.users || []).map(withClientId));
      return res.user;
    },
    async forceLogoutUser(id) {
      const res = await runForActiveAdmin(activeAdminRef, () => userApi.forceLogout(id));
      return res.user;
    },
    async resetUserPassword(id, password) {
      return runForActiveAdmin(activeAdminRef, () => userApi.resetPassword(id, password));
    },
    async fetchRoles(params = {}) {
      const res = await runForActiveAdmin(activeAdminRef, () => roleApi.list(params));
      setRoles((res.roles || []).map(withClientId));
      return res.roles;
    },
    async createRole(payload) {
      const res = await runForActiveAdmin(activeAdminRef, () => roleApi.create(payload));
      const normalized = withClientId(res.role);
      setRoles((prev) => [...prev, normalized]);
      return res.role;
    },
    async updateRole(id, payload) {
      const res = await runForActiveAdmin(activeAdminRef, () => roleApi.update(id, payload));
      const normalized = withClientId(res.role);
      setRoles((prev) => prev.map((r) => (r.id === id || r._id === id) ? normalized : r));
      return res.role;
    },
    async deleteRole(id) {
      await runForActiveAdmin(activeAdminRef, () => roleApi.delete(id));
      setRoles((prev) => prev.filter((r) => r.id !== id && r._id !== id));
    },
    async cloneRole(id, name) {
      const res = await runForActiveAdmin(activeAdminRef, () => roleApi.clone(id, name));
      const normalized = withClientId(res.role);
      setRoles((prev) => [...prev, normalized]);
      return res.role;
    },
    async fetchPermissions() {
      const res = await runForActiveAdmin(activeAdminRef, () => permissionApi.list());
      return res.permissions;
    },
    async updateRolePermissions(roleId, permissions) {
      const res = await runForActiveAdmin(activeAdminRef, () => permissionApi.update(roleId, permissions));
      const normalized = withClientId(res.role);
      setRoles((prev) => prev.map((r) => (r.id === roleId || r._id === roleId) ? normalized : r));
      return res.role;
    }
  }), [activeAdminId]);

  const ownsProtectedState = Boolean(activeAdminId && dataOwnerId === activeAdminId);

  const value = useMemo(() => ({
    users: ownsProtectedState ? users : [],
    roles: ownsProtectedState ? roles : [],
    syncStatus,
    ...actions
  }), [users, roles, ownsProtectedState, syncStatus, actions]);

  return <AccessCmsContext.Provider value={value}>{children}</AccessCmsContext.Provider>;
};

export const useAccessCms = () => {
  const context = useContext(AccessCmsContext);
  if (!context) throw new Error("useAccessCms must be used inside AccessCmsProvider");
  return context;
};
