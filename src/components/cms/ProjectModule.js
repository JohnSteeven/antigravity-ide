   import React, { useState, useEffect, useCallback } from "react";
import { useCms } from "../../context/CmsContext";
import { cmsSeed } from "../../data/cmsSeed";
import CollectionManager from "./CollectionManager";

export default function ProjectModule() {
  const { getSetting, updateSetting } = useCms();
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    category: "General",
    status: "Completed",
    description: "",
    image: "",
    route: "",
    technology: "",
  });

  const loadProjects = useCallback(async () => {
    try {
      const val = await getSetting("projects");
      if (Array.isArray(val) && val.length > 0) {
        setProjects(val);
      } else {
        setProjects(cmsSeed.projects || []);
      }
    } catch {
      setProjects(cmsSeed.projects || []);
    }
  }, [getSetting]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSave = async () => {
    if (!draft.title || !draft.title.trim()) return;
    setSaving(true);
    try {
      const projectToSave = {
        id: draft.id || `proj-${Date.now()}`,
        title: draft.title.trim(),
        category: draft.category || "General",
        status: draft.status || "Completed",
        description: draft.description || "",
        image: draft.image || "",
        route: draft.route || "",
        technology: Array.isArray(draft.technology)
          ? draft.technology
          : typeof draft.technology === "string"
          ? draft.technology.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const existingIndex = projects.findIndex((p) => (p.id && p.id === projectToSave.id) || (p._id && p._id === projectToSave.id));
      let updated;
      if (existingIndex >= 0) {
        updated = [...projects];
        updated[existingIndex] = projectToSave;
      } else {
        updated = [projectToSave, ...projects];
      }

      setProjects(updated);
      await updateSetting("projects", updated);
      setDraft({
        title: "",
        category: "General",
        status: "Completed",
        description: "",
        image: "",
        route: "",
        technology: "",
      });
    } catch (err) {
      console.error("Failed to save project setting:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const updated = projects.filter((p) => p.id !== id && p._id !== id);
      setProjects(updated);
      await updateSetting("projects", updated);
      if (draft.id === id || draft._id === id) {
        setDraft({
          title: "",
          category: "General",
          status: "Completed",
          description: "",
          image: "",
          route: "",
          technology: "",
        });
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="project-module-wrapper">
      {saving && <div className="cms-saving-indicator" style={{ padding: "0.5rem", color: "var(--mj-text-secondary, #64748b)" }}>Saving changes to server...</div>}
      <CollectionManager
        title="Projects"
        kicker="Portfolio"
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        onDelete={handleDelete}
        items={projects}
        fields={[
          { name: "title", label: "Title" },
          { name: "category", label: "Category" },
          { name: "status", label: "Status" },
          { name: "route", label: "Link / Route" },
          { name: "technology", label: "Technologies (comma separated)" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
    </div>
  );
}
