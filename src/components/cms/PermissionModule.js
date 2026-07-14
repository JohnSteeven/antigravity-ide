import React, { useState, useEffect, useMemo } from "react";
import { FiSave, FiCheckSquare, FiSquare, FiRefreshCw, FiInfo } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function PermissionModule() {
  const {
    data,
    fetchRoles,
    fetchPermissions,
    updateRolePermissions,
  } = useCms();

  const roles = data.roles || [];

  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedRole = useMemo(() => {
    return roles.find(r => r._id === selectedRoleId || r.id === selectedRoleId);
  }, [roles, selectedRoleId]);

  const loadPermissionsAndRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const [allPerms] = await Promise.all([
        fetchPermissions(),
        fetchRoles({ includeDeleted: true }),
      ]);
      setPermissions(allPerms || []);
    } catch (err) {
      setError(err.message || "Failed to load permissions matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissionsAndRoles();
  }, []);

  // Initialize selected role and its permissions
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      // Default to first role (typically Admin or Reader)
      setSelectedRoleId(roles[0]._id || roles[0].id);
    }
  }, [roles]);

  useEffect(() => {
    if (selectedRole) {
      setAssignedPermissions(selectedRole.permissions || []);
    } else {
      setAssignedPermissions([]);
    }
  }, [selectedRole]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach(p => {
      const mod = p.module || "other";
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push(p);
    });
    return groups;
  }, [permissions]);

  const handleCheckboxChange = (key, checked) => {
    if (checked) {
      setAssignedPermissions(prev => [...prev, key]);
    } else {
      setAssignedPermissions(prev => prev.filter(k => k !== key));
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateRolePermissions(selectedRoleId, assignedPermissions);
      setSuccess("Role permissions assigned and saved to MongoDB.");
      // Reload roles to refresh context
      await fetchRoles({ includeDeleted: true });
    } catch (err) {
      setError(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllModule = (moduleKey, select) => {
    const modulePerms = groupedPermissions[moduleKey].map(p => p.key);
    if (select) {
      setAssignedPermissions(prev => {
        const next = [...prev];
        modulePerms.forEach(k => {
          if (!next.includes(k)) next.push(k);
        });
        return next;
      });
    } else {
      setAssignedPermissions(prev => prev.filter(k => !modulePerms.includes(k)));
    }
  };

  const clearNotification = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>RBAC Permissions Matrix</h2>
          <p className="kicker">Grant or revoke module capability codes per administrative role</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadPermissionsAndRoles()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="cms-alert cms-alert-danger" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>{error}</span>
          <button onClick={clearNotification} className="close-btn" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}
      {success && (
        <div className="cms-alert cms-alert-success" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>{success}</span>
          <button onClick={clearNotification} className="close-btn" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Role Selection Dropdown */}
      <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px", flexWrap: "wrap" }}>
        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "1rem" }}>
          <label style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>Select Role to Edit:</label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="form-input"
            style={{ minWidth: "250px" }}
          >
            {roles.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.name} {r.isSystem ? "(System Role)" : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selectedRoleId}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiSave /> {saving ? "Saving Matrix..." : "Save Permissions"}
        </button>
      </div>

      {selectedRole && selectedRole.isSystem && selectedRole.name === "Admin" && (
        <div className="cms-alert cms-alert-info" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <FiInfo />
          <span><strong>Superuser Notice:</strong> The Admin role automatically bypasses all RBAC checking layers in the backend. Checking or unchecking boxes below serves as a reference, but Admin permissions are always fully unlocked.</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading permissions registry...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
            <div
              key={moduleName}
              style={{
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, textTransform: "capitalize", fontSize: "1.1rem" }}>
                  {moduleName} Module
                </h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleSelectAllModule(moduleName, true)}
                    className="btn btn-secondary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAllModule(moduleName, false)}
                    className="btn btn-secondary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {perms.map(p => {
                  const isChecked = assignedPermissions.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        background: isChecked ? "#f8f9fa" : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(p.key, e.target.checked)}
                        style={{ marginTop: "0.25rem" }}
                      />
                      <div>
                        <strong style={{ display: "block", fontSize: "0.85rem", color: "#333" }}>{p.name}</strong>
                        <span style={{ fontSize: "0.7rem", color: "#888" }}>{p.key}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
