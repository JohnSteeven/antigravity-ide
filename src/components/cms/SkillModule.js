import React, { useState } from "react";
import { useContentCms } from "../../context/ContentCmsContext";
import CollectionManager from "./CollectionManager";

export default function SkillModule() {
  const { skills, saveSkill, deleteSkill } = useContentCms();
  const [draft, setDraft] = useState({
    name: "",
    level: 50,
  });

  const handleSave = () => {
    saveSkill(draft);
    setDraft({
      name: "",
      level: 50,
    });
  };

  return (
    <CollectionManager
      title="Skills"
      kicker="Expertise"
      draft={draft}
      setDraft={setDraft}
      onSave={handleSave}
      onDelete={deleteSkill}
      items={skills}
      fields={[
        { name: "name", label: "Name" },
        { name: "level", label: "Level", type: "number", min: 0, max: 100 },
      ]}
    />
  );
}
