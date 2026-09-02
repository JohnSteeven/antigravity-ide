import React, { useState } from "react";
import { useContentCms } from "../../context/ContentCmsContext";
import CollectionManager from "./CollectionManager";

export default function ProjectModule() {
  const { projects, saveProject, deleteProject } = useContentCms();
  const [draft, setDraft] = useState({
    title: "",
    category: "General",
    status: "Draft",
    description: "",
    image: "",
  });

  const handleSave = () => {
    saveProject(draft);
    setDraft({
      title: "",
      category: "General",
      status: "Draft",
      description: "",
      image: "",
    });
  };

  return (
    <CollectionManager
      title="Projects"
      kicker="Portfolio"
      draft={draft}
      setDraft={setDraft}
      onSave={handleSave}
      onDelete={deleteProject}
      items={projects}
      fields={[
        { name: "title", label: "Title" },
        { name: "category", label: "Category" },
        { name: "status", label: "Status" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
