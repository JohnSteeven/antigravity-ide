import React, { useState } from "react";
import { useContentCms } from "../../context/ContentCmsContext";
import CollectionManager from "./CollectionManager";

export default function TimelineModule() {
  const { timeline, saveTimelineItem, deleteTimelineItem } = useContentCms();
  const [draft, setDraft] = useState({
    year: new Date().getFullYear().toString(),
    title: "",
    description: "",
  });

  const handleSave = () => {
    saveTimelineItem(draft);
    setDraft({
      year: new Date().getFullYear().toString(),
      title: "",
      description: "",
    });
  };

  return (
    <CollectionManager
      title="Timeline"
      kicker="Read My Story"
      draft={draft}
      setDraft={setDraft}
      onSave={handleSave}
      onDelete={deleteTimelineItem}
      items={timeline}
      fields={[
        { name: "year", label: "Year" },
        { name: "title", label: "Title" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
