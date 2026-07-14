import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiCheckCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function RoleModule() {
  const {
    data,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
  } = useCms();

  const roles = data.roles || [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);

  // Form State
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [cloneNewName, setCloneNewName] = useState("");

  const loadRoles = async () => {
    setLoading(true);
    setError("");
    try {
      await fetchRoles({ includeDeleted: true });
    } catch (err) {
      setError(err.message || "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!roleName) return;
    try {
      await createRole({ name: roleName.trim(), description: roleDescription.trim(), permissions: [] });
      setSuccess("Role created successfully.");
      setShowAddModal(false);
      setRoleName("");
      setRoleDescription("");
      loadRoles();
    } catch (err) {
      setError(err.message || "Failed to create role.");
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await updateRole(selectedRole._id || selectedRole.id, {
        name: roleName.trim(),
        description: roleDescription.trim(),
      });
      setSuccess("Role updated successfully.");
      setShowEditModal(false);
      setSelectedRole(null);
      setRoleName("");
      setRoleDescription("");
      loadRoles();
    } catch (err) {
      setError(err.message || "Failed to update role.");
    }
  };

  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole || !cloneNewName) return;
    try {
      await cloneRole(selectedRole._id || selectedRole.id, cloneNewName.trim());
      setSuccess(`Role cloned successfully as "${cloneNewName.trim()}".`);
      setShowCloneModal(false);
      setSelectedRole(null);
      setCloneNewName("");
      loadRoles();
    } catch (err) {
      setError(err.message || "Failed to clone role.");
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystem) {
      alert("System roles cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;
    try {
      await deleteRole(role._id || role.id);
      setSuccess("Role deleted successfully.");
      loadRoles();
    } catch (err) {
      setError(err.message || "Failed to delete role.");
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
          <h2 style={{ margin: 0 }}>Roles Management</h2>
          <p className="kicker">Define custom authorization categories for MyJourney administrative access</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => loadRoles()}>
            <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <FiPlus /> Create Role
          </button>
        </div>
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

      {/* Grid listing */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        {loading && roles.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p>Loading roles database...</p>
          </div>
        ) : roles.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "#888" }}>
            No roles configured. Create a new custom role to begin.
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role._id || role.id}
              className="card"
              style={{
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                opacity: role.isDeleted ? 0.6 : 1,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0, color: "#111" }}>{role.name}</h4>
                  {role.isSystem ? (
                    <span style={{ fontSize: "0.7rem", background: "#f1f3f4", color: "#5f6368", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>SYSTEM</span>
                  ) : (
                    <span style={{ fontSize: "0.7rem", background: "#e8f0fe", color: "#1a73e8", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>CUSTOM</span>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", color: "#666", minHeight: "2.5rem", margin: "0 0 1rem 0" }}>
                  {role.description || "No description provided."}
                </p>
                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem" }}>
                  <strong>Assigned Permissions:</strong> {role.permissions?.length || 0} keys
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#999" }}>
                  Created: {new Date(role.createdAt).toLocaleDateString()}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setRoleName(role.name);
                      setRoleDescription(role.description || "");
                      setShowEditModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    title="Edit role properties"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setCloneNewName(`${role.name} Copy`);
                      setShowCloneModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    title="Clone this role"
                  >
                    <FiCopy /> Clone
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="btn btn-danger"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem", background: "#fce8e6", color: "#c5221f", border: "1px solid #fce8e6" }}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Create Role */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "90%", maxWidth: "450px", background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>Create Custom Role</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Editor Supervisor"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="What permissions or access does this role entail?"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="form-input"
                  rows="3"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Role */}
      {showEditModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "90%", maxWidth: "450px", background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>Edit Role Properties</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="form-input"
                  required
                  disabled={selectedRole?.isSystem}
                />
                {selectedRole?.isSystem && <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>System role names are read-only.</p>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="form-input"
                  rows="3"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedRole(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Clone Role */}
      {showCloneModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "90%", maxWidth: "450px", background: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>Clone Role</h3>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>Create a new role with the exact permissions signature of: <strong>{selectedRole?.name}</strong></p>
            <form onSubmit={handleCloneSubmit}>
              <div className="form-group">
                <label>New Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Editor"
                  value={cloneNewName}
                  onChange={(e) => setCloneNewName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => { setShowCloneModal(false); setSelectedRole(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Clone Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
