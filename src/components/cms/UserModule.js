import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiRotateCcw,
  FiInfo,
  FiKey,
  FiLogOut,
  FiBookmark,
  FiFileText,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function UserModule() {
  const {
    fetchUsers,
    fetchUserById,
    updateUser,
    suspendUser,
    deleteUser,
    restoreUser,
    forceLogoutUser,
    resetUserPassword,
  } = useCms();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & State
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [verified, setVerified] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // User Details Modal/Drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const [userInteractions, setUserInteractions] = useState(null);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // Edit / Action Modals
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchUsers({
        page: currentPage,
        limit: 10,
        search,
        role,
        status,
        verified,
        includeDeleted: includeDeleted ? "true" : "false",
        sortBy,
        sortDir,
      });
      if (res && res.users) {
        setUsers(res.users);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, role, status, verified, includeDeleted, sortBy, sortDir]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setLoadingInteractions(true);
    try {
      const res = await fetchUserById(user._id || user.id);
      if (res && res.interactions) {
        setUserInteractions(res.interactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const handleSuspendToggle = async (userId) => {
    if (!window.confirm("Are you sure you want to change this user's suspension state?")) return;
    try {
      await suspendUser(userId);
      setSuccess("User status changed successfully.");
      loadUsers();
      if (selectedUser && (selectedUser._id === userId || selectedUser.id === userId)) {
        const nextStatus = selectedUser.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        setSelectedUser({ ...selectedUser, status: nextStatus });
      }
    } catch (err) {
      setError(err.message || "Failed to suspend/activate user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to soft delete this user?")) return;
    try {
      await deleteUser(userId);
      setSuccess("User soft-deleted successfully.");
      loadUsers();
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || "Failed to delete user.");
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await restoreUser(userId);
      setSuccess("User restored successfully.");
      loadUsers();
      if (selectedUser && (selectedUser._id === userId || selectedUser.id === userId)) {
        setSelectedUser({ ...selectedUser, isDeleted: false });
      }
    } catch (err) {
      setError(err.message || "Failed to restore user.");
    }
  };

  const handleForceLogout = async (userId) => {
    if (!window.confirm("Are you sure you want to terminate all active sessions for this user?")) return;
    try {
      await forceLogoutUser(userId);
      setSuccess("User successfully logged out of all sessions.");
    } catch (err) {
      setError(err.message || "Failed to force logout.");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      await resetUserPassword(resettingPasswordUser._id || resettingPasswordUser.id, newPassword);
      setSuccess("Password reset successfully. Pushed force logout for security.");
      setResettingPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message || "Failed to reset password.");
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingUser._id || editingUser.id, { role: editRole, status: editStatus });
      setSuccess("User updated successfully.");
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert(err.message || "Failed to update user.");
    }
  };

  const clearNotification = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="cms-panel" style={{ position: "relative" }}>
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Identity & User Management</h2>
          <p className="kicker">Inspect and moderate MyJourney registered accounts</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadUsers()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="filters-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Search Users</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Username, Name, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
              <FiSearch />
            </button>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input">
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Reader">Reader</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Email Verification</label>
          <select value={verified} onChange={(e) => setVerified(e.target.value)} className="form-input">
            <option value="all">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", height: "100%" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "1.2rem" }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Show Deleted Users
          </label>
        </div>
      </form>

      {/* Grid statistics summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem", background: "#e8f0fe", borderRadius: "8px", borderLeft: "4px solid #1a73e8" }}>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>Total Accounts</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1a73e8" }}>{pagination.total}</div>
        </div>
        <div style={{ padding: "1rem", background: "#e6f4ea", borderRadius: "8px", borderLeft: "4px solid #137333" }}>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>Active Users</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#137333" }}>
            {users.filter(u => u.status === "ACTIVE").length} this page
          </div>
        </div>
        <div style={{ padding: "1rem", background: "#fce8e6", borderRadius: "8px", borderLeft: "4px solid #c5221f" }}>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>Suspended Accounts</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#c5221f" }}>
            {users.filter(u => u.status === "SUSPENDED").length} this page
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Created Date</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto" }}></div>
                  <p>Loading accounts...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  No accounts match your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id || user.id} style={{ opacity: user.isDeleted ? 0.6 : 1 }}>
                  <td>
                    {user.profile?.avatar?.trim() ? (
                      <img
                        src={user.profile.avatar}
                        alt={user.firstName}
                        style={{ width: "35px", height: "35px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                        {user.firstName[0]}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{user.firstName} {user.lastName}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>@{user.username}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-role-${user.role?.toLowerCase() || "reader"}`} style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", background: user.role === "Admin" ? "#fce8e6" : user.role === "Editor" ? "#e8f0fe" : "#e8eaed", color: user.role === "Admin" ? "#c5221f" : user.role === "Editor" ? "#1a73e8" : "#5f6368" }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      background: user.status === "ACTIVE" ? "#e6f4ea" : user.status === "SUSPENDED" ? "#fce8e6" : "#fef7e0",
                      color: user.status === "ACTIVE" ? "#137333" : user.status === "SUSPENDED" ? "#c5221f" : "#b06000",
                      fontWeight: "bold"
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {user.verified?.email ? (
                      <span style={{ color: "#137333", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                        <FiCheckCircle /> Verified
                      </span>
                    ) : (
                      <span style={{ color: "#b06000", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                        <FiXCircle /> Unverified
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button
                        onClick={() => handleViewUser(user)}
                        className="small-icon-btn"
                        title="View details & interactions"
                      >
                        <FiInfo />
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditRole(user.role);
                          setEditStatus(user.status);
                        }}
                        className="small-icon-btn"
                        title="Edit Role/Status"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSuspendToggle(user._id || user.id)}
                        className="small-icon-btn"
                        title={user.status === "SUSPENDED" ? "Activate User" : "Suspend User"}
                        style={{ color: user.status === "SUSPENDED" ? "#137333" : "#b06000" }}
                      >
                        {user.status === "SUSPENDED" ? <FiUnlock /> : <FiLock />}
                      </button>
                      <button
                        onClick={() => {
                          setResettingPasswordUser(user);
                          setNewPassword("");
                        }}
                        className="small-icon-btn"
                        title="Reset password"
                      >
                        <FiKey />
                      </button>
                      <button
                        onClick={() => handleForceLogout(user._id || user.id)}
                        className="small-icon-btn"
                        title="Force logout"
                        style={{ color: "#e37400" }}
                      >
                        <FiLogOut />
                      </button>
                      {user.isDeleted ? (
                        <button
                          onClick={() => handleRestoreUser(user._id || user.id)}
                          className="small-icon-btn"
                          title="Restore User"
                          style={{ color: "#137333" }}
                        >
                          <FiRotateCcw />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(user._id || user.id)}
                          className="small-icon-btn"
                          title="Soft delete user"
                          style={{ color: "#c5221f" }}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.pages > 1 && (
        <div className="pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem" }}
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.8rem" }}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Modal - User Details & Interactions Drawer */}
      {selectedUser && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "100%", maxWidth: "550px", height: "100%", background: "#fff", padding: "2rem", overflowY: "auto", boxShadow: "-5px 0 15px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Account Profile Details</h3>
              <button onClick={() => { setSelectedUser(null); setUserInteractions(null); }} className="btn btn-secondary" style={{ padding: "0.25rem 0.75rem" }}>Close</button>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
              {selectedUser.profile?.avatar?.trim() ? (
                <img
                  src={selectedUser.profile.avatar}
                  alt={selectedUser.firstName}
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold" }}>
                  {selectedUser.firstName[0]}
                </div>
              )}
              <div>
                <h4 style={{ margin: "0 0 0.25rem 0" }}>{selectedUser.firstName} {selectedUser.lastName}</h4>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>@{selectedUser.username}</div>
                <div style={{ color: "#888", fontSize: "0.85rem" }}>{selectedUser.email}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
              <div><strong>Role:</strong> {selectedUser.role}</div>
              <div><strong>Status:</strong> {selectedUser.status}</div>
              <div><strong>Mobile:</strong> {selectedUser.mobile || "N/A"}</div>
              <div><strong>Email Verified:</strong> {selectedUser.verified?.email ? "Yes" : "No"}</div>
              <div><strong>Register Date:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              <div><strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : "Never"}</div>
            </div>

            <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem", flex: 1 }}>
              <h5 style={{ margin: "0 0 1rem 0" }}>User Activity & Interactions</h5>
              {loadingInteractions ? (
                <div className="spinner" style={{ margin: "2rem auto" }}></div>
              ) : !userInteractions ? (
                <p style={{ color: "#888", fontSize: "0.9rem" }}>No interactions history found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <h6 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <FiFileText /> Written Articles ({userInteractions.articles?.length || 0})
                    </h6>
                    {userInteractions.articles?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>Never wrote any article.</p>
                    ) : (
                      <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.85rem" }}>
                        {userInteractions.articles.map((art) => (
                          <li key={art._id || art.id}>
                            <strong>{art.title}</strong> ({art.status})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h6 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <FiMessageSquare /> Submitted Comments ({userInteractions.comments?.length || 0})
                    </h6>
                    {userInteractions.comments?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>Never commented on any article.</p>
                    ) : (
                      <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.85rem" }}>
                        {userInteractions.comments.map((comment) => (
                          <li key={comment._id || comment.id}>
                            "{comment.body}" on <em>{comment.articleId?.title || "Unknown Article"}</em>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h6 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <FiBookmark /> Bookmarked Articles ({userInteractions.bookmarks?.length || 0})
                    </h6>
                    {userInteractions.bookmarks?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>No bookmarked articles.</p>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.85rem" }}>
                        User holds {userInteractions.bookmarks.length} bookmarked item(s).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Edit Role/Status */}
      {editingUser && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "90%", maxWidth: "400px", background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>Modify User Profile</h3>
            <form onSubmit={handleEditUserSubmit}>
              <div className="form-group">
                <label>User Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="form-input">
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Reader">Reader</option>
                </select>
              </div>
              <div className="form-group">
                <label>Account Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="form-input">
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Reset Password */}
      {resettingPasswordUser && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ width: "90%", maxWidth: "400px", background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>Reset User Password</h3>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>Resetting password for @{resettingPasswordUser.username}. This will automatically force log out all active sessions for this account.</p>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="button" onClick={() => setResettingPasswordUser(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
