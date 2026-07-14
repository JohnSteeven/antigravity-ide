import React, { useState, useEffect } from "react";
import { FiSave, FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiEdit2, FiGlobe, FiEye, FiEyeOff } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function NavigationModule() {
  const { getSetting, updateSetting } = useCms();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [menus, setMenus] = useState({
    header: [
      { label: "Home", path: "/", openInNewTab: false, visible: true, icon: "home", dropdown: [] },
      { label: "Articles", path: "/articles", openInNewTab: false, visible: true, icon: "book", dropdown: [] },
      { label: "Categories", path: "/categories", openInNewTab: false, visible: true, icon: "grid", dropdown: [] },
      { label: "My Story", path: "/story", openInNewTab: false, visible: true, icon: "user", dropdown: [] },
    ],
    footer: [
      { label: "About Me", path: "/about", openInNewTab: false, visible: true },
      { label: "Contact", path: "/contact", openInNewTab: false, visible: true },
      { label: "Privacy Policy", path: "/privacy", openInNewTab: false, visible: true },
      { label: "Terms of Service", path: "/terms", openInNewTab: false, visible: true },
    ],
  });

  const [activeMenu, setActiveMenu] = useState("header"); // header or footer
  const [editIndex, setEditIndex] = useState(-1);
  const [newItem, setNewItem] = useState({
    label: "",
    path: "",
    openInNewTab: false,
    visible: true,
    icon: "link",
    dropdown: [],
  });

  const loadNavigation = async () => {
    setLoading(true);
    setError("");
    try {
      const val = await getSetting("navigation");
      if (val) {
        setMenus((prev) => ({
          header: val.header || prev.header,
          footer: val.footer || prev.footer,
        }));
      }
    } catch (err) {
      setError("Failed to load navigation menus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNavigation();
  }, []);

  const handleSave = async () => {
    if (!window.confirm("Are you sure you want to save navigation changes?")) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateSetting("navigation", menus);
      setSuccess("Navigation menus updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Failed to save navigation menus.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    if (!newItem.label.trim() || !newItem.path.trim()) {
      setError("Label and Path are required.");
      return;
    }

    const currentList = [...menus[activeMenu]];

    if (editIndex >= 0) {
      currentList[editIndex] = newItem;
      setEditIndex(-1);
    } else {
      currentList.push(newItem);
    }

    setMenus((prev) => ({
      ...prev,
      [activeMenu]: currentList,
    }));

    setNewItem({
      label: "",
      path: "",
      openInNewTab: false,
      visible: true,
      icon: "link",
      dropdown: [],
    });
    setError("");
  };

  const startEdit = (index) => {
    setEditIndex(index);
    setNewItem({ ...menus[activeMenu][index] });
  };

  const handleCancelEdit = () => {
    setEditIndex(-1);
    setNewItem({
      label: "",
      path: "",
      openInNewTab: false,
      visible: true,
      icon: "link",
      dropdown: [],
    });
  };

  const handleDelete = (index) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    const currentList = [...menus[activeMenu]];
    currentList.splice(index, 1);
    setMenus((prev) => ({
      ...prev,
      [activeMenu]: currentList,
    }));
    if (editIndex === index) {
      handleCancelEdit();
    }
  };

  const moveItem = (index, direction) => {
    const list = [...menus[activeMenu]];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setMenus((prev) => ({
      ...prev,
      [activeMenu]: list,
    }));
  };

  const toggleVisibility = (index) => {
    const list = [...menus[activeMenu]];
    list[index].visible = !list[index].visible;
    setMenus((prev) => ({
      ...prev,
      [activeMenu]: list,
    }));
  };

  if (loading) {
    return (
      <div className="cms-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem" }}>Loading navigation configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {success && <div className="cms-alert cms-alert-success">{success}</div>}
      {error && <div className="cms-alert cms-alert-danger">{error}</div>}

      {/* Tabs Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="cms-tabs" style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn ${activeMenu === "header" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setActiveMenu("header"); handleCancelEdit(); }}
          >
            Header Navigation Menu
          </button>
          <button
            className={`btn ${activeMenu === "footer" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setActiveMenu("footer"); handleCancelEdit(); }}
          >
            Footer Link Columns
          </button>
        </div>

        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          disabled={saving}
        >
          <FiSave />
          {saving ? "Saving Menu..." : "Save Navigation Layout"}
        </button>
      </div>

      <div className="cms-grid-two">
        {/* Current Items List */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Navigation Structure</span>
              <h2>Menu Items List</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            {menus[activeMenu].length === 0 ? (
              <p className="empty-state">No links configured in this menu.</p>
            ) : (
              menus[activeMenu].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    background: "#f8f9fa",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    opacity: item.visible ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ color: "#718096" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{item.icon ? `[${item.icon}] ` : ""}</span>
                      <strong style={{ color: "#2d3748" }}>{item.label}</strong>
                      <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem", color: "#a0aec0" }}>{item.path}</span>
                      {item.openInNewTab && (
                        <span className="badge" style={{ marginLeft: "0.5rem", background: "#edf2f7", fontSize: "0.7rem", color: "#4a5568" }}>
                          New Tab
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem" }}
                      onClick={() => toggleVisibility(index)}
                      title="Toggle Visibility"
                    >
                      {item.visible ? <FiEye /> : <FiEyeOff />}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem" }}
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <FiArrowUp />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem" }}
                      onClick={() => moveItem(index, 1)}
                      disabled={index === menus[activeMenu].length - 1}
                      title="Move Down"
                    >
                      <FiArrowDown />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem", color: "#3182ce" }}
                      onClick={() => startEdit(index)}
                      title="Edit Item"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem", color: "#e53e3e" }}
                      onClick={() => handleDelete(index)}
                      title="Delete Item"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form panel to add/edit item */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Manage Links</span>
              <h2>{editIndex >= 0 ? "Edit Navigation Link" : "Add Navigation Link"}</h2>
            </div>
          </div>
          <form onSubmit={handleAddOrUpdate} className="form-grid one" style={{ marginTop: "1rem" }}>
            <label>
              Link Title (Label) *
              <input
                type="text"
                required
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                className="form-input"
                placeholder="e.g. Contact Us"
              />
            </label>
            <label>
              Link Destination (Path or URL) *
              <input
                type="text"
                required
                value={newItem.path}
                onChange={(e) => setNewItem({ ...newItem, path: e.target.value })}
                className="form-input"
                placeholder="e.g. /contact or https://example.com"
              />
            </label>
            {activeMenu === "header" && (
              <label>
                Icon Name (optional)
                <input
                  type="text"
                  value={newItem.icon}
                  onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                  className="form-input"
                  placeholder="e.g. home, book, mail"
                />
              </label>
            )}
            <div style={{ display: "flex", gap: "1.5rem", margin: "0.5rem 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newItem.openInNewTab}
                  onChange={(e) => setNewItem({ ...newItem, openInNewTab: e.target.checked })}
                />
                Open in new tab
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newItem.visible}
                  onChange={(e) => setNewItem({ ...newItem, visible: e.target.checked })}
                />
                Visible publicly
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <FiPlus />
                {editIndex >= 0 ? "Update Link" : "Add Link"}
              </button>
              {editIndex >= 0 && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
