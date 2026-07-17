import React from "react";
import { FiSave, FiTrash2 } from "react-icons/fi";
import ImageDropZone from "../shared/ImageDropZone";

const CollectionManager = ({
  title,
  kicker,
  draft,
  setDraft,
  onSave,
  onDelete,
  items = [],
  fields = [],
}) => (
  <div className="cms-grid-two">
    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">{kicker}</span>
          <h2>{title}</h2>
        </div>
        <button className="small-solid-btn" type="button" onClick={onSave}>
          <FiSave /> Save
        </button>
      </div>
      <div className="form-grid one">
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                rows="4"
                value={
                  Array.isArray(draft[field.name])
                    ? draft[field.name].join(", ")
                    : draft[field.name] || ""
                }
                onChange={(e) =>
                  setDraft((c) => ({ ...c, [field.name]: e.target.value }))
                }
              />
            ) : (
              <input
                type={field.type || "text"}
                min={field.min}
                max={field.max}
                value={draft[field.name] || ""}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, [field.name]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
        {draft && "image" in draft && (
          <ImageDropZone
            label="Project image"
            value={draft.image}
            onChange={(image) => setDraft((c) => ({ ...c, image }))}
          />
        )}
        {draft && "heroImage" in draft && (
          <ImageDropZone
            label="Category hero image"
            value={draft.heroImage}
            onChange={(heroImage) => setDraft((c) => ({ ...c, heroImage }))}
          />
        )}
      </div>
    </div>

    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Existing</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="compact-list editable">
        {items.map((item) => (
          <div key={item.id}>
            <button type="button" onClick={() => setDraft(item)}>
              <strong>{item.title || item.name}</strong>
              <span>{item.description || `${item.level || ""}%`}</span>
            </button>
            <button type="button" onClick={() => onDelete(item.id)}>
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CollectionManager;
