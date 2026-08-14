import React, { useMemo, useRef, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiEye,
  FiFileText,
  FiImage,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { useCms } from "../../../context/CmsContext";
import { storyApi } from "../../../services/apiService";
import { getImageUrl } from "../../../utils/imageUrlHelper";
import StoryEngine from "../../../stories/components/StoryEngine";
import LegacyStoryReader from "../../../stories/components/LegacyStoryReader";
import {
  getRecommendedStoryLayouts,
  getStoryLayoutConfig,
  normalizeStoryLayoutId,
  STORY_ENGINES,
  STORY_LAYOUT_FAMILIES,
  STORY_LAYOUT_PRESETS,
} from "../../../stories/storyLayoutConfig";
import storyMedia from "../../../stories/storyMedia.cjs";
import {
  calculateStoryReadingTime,
  createStorySection,
  normalizeStorySections,
  STORY_IMAGE_SIZES,
  STORY_SECTION_OPTIONS,
  STORY_SECTION_TYPES,
  stripStoryHtml,
  validateStorySections,
} from "../../../stories/storySections";
import "./StoryCmsPanel.css";

const { getStoryMediaInventory, resolveStoryPrimaryImage } = storyMedia;

const slugify = (value = "") => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const newStoryDraft = () => ({
  title: "",
  slug: "",
  description: "",
  contentType: "story",
  status: "draft",
  accessLevel: "free",
  author: "Noble John Steeven",
  coverImage: "",
  coverImageAlt: "",
  storyLayout: "classic-reader",
  storySections: [createStorySection(STORY_SECTION_TYPES.TEXT)],
  reflection: "",
  body: "",
  _storyLayoutWasUnset: false,
});

const starterSectionsForLayout = (layoutId) => {
  const layout = getStoryLayoutConfig(layoutId);
  if (layout.manual) return [createStorySection(STORY_SECTION_TYPES.TEXT)];
  if (layout.engine === STORY_ENGINES.CHAPTER_FLOW) {
    return [createStorySection(STORY_SECTION_TYPES.CHAPTER), createStorySection(STORY_SECTION_TYPES.TEXT), createStorySection(STORY_SECTION_TYPES.CHAPTER)];
  }
  return [createStorySection(STORY_SECTION_TYPES.TEXT)];
};

const SectionBodyField = ({ section, updateSection }) => (
  <label className="story-cms-field story-cms-field--wide">
    Body
    <textarea
      rows="7"
      value={section.body || ""}
      onChange={(event) => updateSection({ body: event.target.value })}
      placeholder="Write the passage here. Plain text or existing Story HTML is supported."
    />
  </label>
);

const SectionImageFields = ({ section, updateSection, uploadImage, uploading }) => {
  const fileRef = useRef(null);
  const removeImage = () => {
    const next = { image: "", alt: "", caption: "" };
    if ([STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT].includes(section.type)) {
      next.type = STORY_SECTION_TYPES.TEXT;
    }
    updateSection(next);
  };

  return (
    <div className="story-cms-image-fields">
      <label className="story-cms-field story-cms-field--wide">
        Image
        <span className="story-cms-inline-input">
          <input
            type="text"
            value={section.image || ""}
            onChange={(event) => updateSection({ image: event.target.value })}
            placeholder="Media URL"
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <FiUpload aria-hidden="true" /> {uploading ? "Uploading…" : "Upload"}
          </button>
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])}
        />
      </label>

      {section.image && (
        <div className="story-cms-image-preview">
          <img src={getImageUrl(section.image)} alt="" />
          <button type="button" onClick={removeImage}>Remove image</button>
        </div>
      )}

      <label className="story-cms-field">
        Alt text <span aria-hidden="true">*</span>
        <input type="text" value={section.alt || ""} onChange={(event) => updateSection({ alt: event.target.value })} />
      </label>
      <label className="story-cms-field">
        Caption <span className="story-cms-optional">optional</span>
        <input type="text" value={section.caption || ""} onChange={(event) => updateSection({ caption: event.target.value })} />
      </label>
      <label className="story-cms-field">
        Image size
        <select value={STORY_IMAGE_SIZES.includes(section.imageSize) ? section.imageSize : "medium"} onChange={(event) => updateSection({ imageSize: event.target.value })}>
          {STORY_IMAGE_SIZES.map((size) => <option key={size} value={size}>{size[0].toUpperCase() + size.slice(1)}</option>)}
        </select>
      </label>
    </div>
  );
};

const StorySectionEditor = ({ section, index, total, updateSection, moveSection, removeSection, uploadSectionImage, uploading }) => {
  const hasHeading = [STORY_SECTION_TYPES.TEXT, STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT, STORY_SECTION_TYPES.REFLECTION].includes(section.type);
  const hasBody = [STORY_SECTION_TYPES.TEXT, STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT, STORY_SECTION_TYPES.CHAPTER, STORY_SECTION_TYPES.REFLECTION].includes(section.type);
  const hasImage = [STORY_SECTION_TYPES.TEXT_IMAGE_RIGHT, STORY_SECTION_TYPES.IMAGE_LEFT_TEXT, STORY_SECTION_TYPES.CHAPTER, STORY_SECTION_TYPES.REFLECTION, STORY_SECTION_TYPES.IMAGE, STORY_SECTION_TYPES.WIDE_IMAGE].includes(section.type);

  return (
    <article className="story-cms-section-editor">
      <header>
        <div>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{section.type.replaceAll("-", " ")}</strong>
        </div>
        <div className="story-cms-section-actions">
          <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="Move section up"><FiArrowUp /></button>
          <button type="button" onClick={() => moveSection(index, 1)} disabled={index === total - 1} aria-label="Move section down"><FiArrowDown /></button>
          <button type="button" onClick={() => removeSection(index)} aria-label="Delete section"><FiTrash2 /></button>
        </div>
      </header>

      <div className="story-cms-section-fields">
        {hasHeading && (
          <label className="story-cms-field story-cms-field--wide">
            {section.type === STORY_SECTION_TYPES.REFLECTION ? "Heading (optional)" : "Heading"}
            <input type="text" value={section.heading || ""} onChange={(event) => updateSection({ heading: event.target.value })} />
          </label>
        )}

        {section.type === STORY_SECTION_TYPES.CHAPTER && (
          <>
            <label className="story-cms-field">
              Chapter number
              <input type="text" value={section.chapterNumber || ""} onChange={(event) => updateSection({ chapterNumber: event.target.value })} placeholder="01" />
            </label>
            <label className="story-cms-field">
              Chapter title
              <input type="text" value={section.chapterTitle || ""} onChange={(event) => updateSection({ chapterTitle: event.target.value })} />
            </label>
          </>
        )}

        {hasBody && <SectionBodyField section={section} updateSection={updateSection} />}

        {section.type === STORY_SECTION_TYPES.QUOTE && (
          <>
            <label className="story-cms-field story-cms-field--wide">
              Quote
              <textarea rows="4" value={section.quote || ""} onChange={(event) => updateSection({ quote: event.target.value })} />
            </label>
            <label className="story-cms-field story-cms-field--wide">
              Attribution <span className="story-cms-optional">optional</span>
              <input type="text" value={section.attribution || ""} onChange={(event) => updateSection({ attribution: event.target.value })} />
            </label>
          </>
        )}

        {section.type === STORY_SECTION_TYPES.CHAPTER && section.image && (
          <label className="story-cms-field">
            Image side
            <select value={section.imageSide || "right"} onChange={(event) => updateSection({ imageSide: event.target.value })}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </label>
        )}

        {hasImage && (
          <SectionImageFields
            section={section}
            updateSection={updateSection}
            uploadImage={(file) => uploadSectionImage(index, file)}
            uploading={uploading}
          />
        )}
      </div>
    </article>
  );
};

const LayoutPreview = ({ rows }) => (
  <span className="story-cms-layout-preview" aria-hidden="true">
    {rows.map((row, rowIndex) => (
      <span className="story-cms-layout-preview__row" key={rowIndex}>
        {row.map((cell, cellIndex) => <i className={`is-${cell}`} key={`${cell}-${cellIndex}`} />)}
      </span>
    ))}
  </span>
);

export default function StoryCmsPanel() {
  const { data, uploadMedia, refreshContent } = useCms();
  const stories = useMemo(
    () => (data?.articles || []).filter((item) => item?.contentType === "story").sort((a, b) => new Date(b.updatedAt || b.publishedAt || 0) - new Date(a.updatedAt || a.publishedAt || 0)),
    [data?.articles]
  );
  const [draft, setDraft] = useState(newStoryDraft);
  const [mode, setMode] = useState("edit");
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const selectStory = (story) => {
    setDraft({
      ...newStoryDraft(),
      ...story,
      _storyLayoutWasUnset: !story.storyLayout,
      storyLayout: normalizeStoryLayoutId(story.storyLayout),
      storySections: normalizeStorySections(story.storySections || []),
    });
    setErrors([]);
    setMessage("");
    setMode("edit");
  };

  const updateDraft = (patch) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      if (patch.title !== undefined && (!current.slug || current.slug === slugify(current.title))) next.slug = slugify(patch.title);
      return next;
    });
  };

  const updateSectionAt = (index, patch) => {
    setDraft((current) => ({
      ...current,
      storySections: current.storySections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section),
    }));
  };

  const moveSection = (index, delta) => {
    setDraft((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.storySections.length) return current;
      const storySections = [...current.storySections];
      [storySections[index], storySections[target]] = [storySections[target], storySections[index]];
      return { ...current, storySections };
    });
  };

  const removeSection = (index) => {
    setDraft((current) => ({ ...current, storySections: current.storySections.filter((_, sectionIndex) => sectionIndex !== index) }));
  };

  const addSection = (type) => {
    setDraft((current) => ({ ...current, storySections: [...current.storySections, createStorySection(type)] }));
  };

  const uploadSectionImage = async (index, file) => {
    setUploadingIndex(index);
    try {
      const media = await uploadMedia(file, "stories");
      if (media?.url) updateSectionAt(index, { image: media.url });
    } finally {
      setUploadingIndex(null);
    }
  };

  const uploadCoverImage = async (file) => {
    setUploadingIndex("cover");
    try {
      const media = await uploadMedia(file, "story-covers");
      if (media?.url) updateDraft({ coverImage: media.url });
    } finally {
      setUploadingIndex(null);
    }
  };

  const chooseLayout = (layoutId) => {
    setDraft((current) => ({
      ...current,
      storyLayout: layoutId,
      storySections: current.storySections.length || stripStoryHtml(current.body || "")
        ? current.storySections
        : starterSectionsForLayout(layoutId),
    }));
  };

  const saveStory = async () => {
    const validation = [];
    if (!draft.title.trim()) validation.push("Story title is required.");
    if (draft.status === "published" && !draft.storySections.length && !draft.body) validation.push("Add Story content before publishing.");
    const structuredText = draft.storySections.map((section) => [section.heading, section.chapterTitle, section.body, section.quote].join(" ")).join(" ");
    if (draft.status === "published" && draft.storySections.length && stripStoryHtml(structuredText).length < 20) validation.push("Add meaningful Story text before publishing.");
    if (draft.status === "published" && draft.coverImage && !String(draft.coverImageAlt || "").trim()) validation.push("Listing / rail image alt text is required.");
    validation.push(...validateStorySections(draft.storySections, { publishing: draft.status === "published" }));
    if (validation.length) {
      setErrors(validation);
      setMessage("");
      return;
    }

    setSaving(true);
    setErrors([]);
    setMessage("");
    try {
      const payload = {
        title: draft.title,
        slug: draft.slug || slugify(draft.title),
        description: draft.description,
        contentType: "story",
        status: draft.status,
        accessLevel: draft.accessLevel || "free",
        author: draft.author,
        coverImage: draft.coverImage,
        coverImageAlt: draft.coverImageAlt,
        storyLayout: draft.storyLayout,
        storySections: draft.storySections,
        reflection: draft.reflection,
        body: draft.body || "",
      };
      const serverId = draft._id || (draft.id && !/^(story|article)-/.test(String(draft.id)) ? draft.id : null);
      const response = serverId ? await storyApi.update(serverId, payload) : await storyApi.create(payload);
      const savedStory = response.article;
      setDraft((current) => ({ ...current, ...savedStory, _storyLayoutWasUnset: false, storySections: savedStory.storySections || current.storySections }));
      setMessage(draft.status === "published" ? "Story published." : draft.status === "archived" ? "Story archived." : "Draft saved.");
      await refreshContent();
    } catch (error) {
      setErrors([error.message || "Story could not be saved."]);
    } finally {
      setSaving(false);
    }
  };

  const coverInputRef = useRef(null);
  const readingMinutes = calculateStoryReadingTime(draft);
  const storyImageCount = getStoryMediaInventory(draft).imageCount;
  const recommendedLayoutIds = new Set(getRecommendedStoryLayouts(storyImageCount).map((layout) => layout.id));
  const isLegacyStory = draft.storySections.length === 0 && Boolean(stripStoryHtml(draft.body || ""));
  const legacyMedia = isLegacyStory
    ? resolveStoryPrimaryImage(draft, { includeSectionImages: false })
    : null;

  return (
    <div className="story-cms">
      <aside className="story-cms-library" aria-label="Story library">
        <button type="button" className="story-cms-new" onClick={() => selectStory(newStoryDraft())}><FiPlus /> New Story</button>
        <div className="story-cms-library-list">
          {stories.map((story) => (
            <button type="button" key={story._id || story.id || story.slug} className={draft.slug === story.slug ? "is-active" : ""} onClick={() => selectStory(story)}>
              <strong>{story.title}</strong>
              <span>{story.status || "draft"} · {calculateStoryReadingTime(story)} min</span>
            </button>
          ))}
          {!stories.length && <p>No Stories yet.</p>}
        </div>
      </aside>

      <section className="story-cms-workspace">
        <header className="story-cms-toolbar">
          <div>
            <span>Story editor</span>
            <strong>{readingMinutes} min read</strong>
          </div>
          <div>
            <button type="button" className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}><FiFileText /> Edit</button>
            <button type="button" className={mode === "preview" ? "is-active" : ""} onClick={() => setMode("preview")}><FiEye /> Preview</button>
            <button type="button" className="story-cms-save" onClick={saveStory} disabled={saving}><FiSave /> {saving ? "Saving…" : "Save"}</button>
          </div>
        </header>

        {errors.length > 0 && <div className="story-cms-errors" role="alert"><strong>Please fix:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {message && <div className="story-cms-success" role="status"><FiCheck /> {message}</div>}

        {mode === "preview" ? (
          <div className="story-cms-preview">
            {draft.storySections.length
              ? <StoryEngine story={draft} mode="preview" showBackLink={false} />
              : <LegacyStoryReader story={draft} mode="preview" showBackLink={false} />}
          </div>
        ) : (
          <div className="story-cms-editor">
            <section className="story-cms-basics">
              <h3>Story details</h3>
              <div className="story-cms-field-grid">
                <label className="story-cms-field">
                  Content type
                  <input type="text" value="Story" disabled />
                </label>
                <label className="story-cms-field">
                  Status
                  <select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value })}>
                    <option value="draft">Draft / Unpublished</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="story-cms-field">
                  Access
                  <select value={draft.accessLevel || "free"} onChange={(event) => updateDraft({ accessLevel: event.target.value })} aria-label="Story access">
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
                <label className="story-cms-field story-cms-field--wide">
                  Title
                  <input type="text" value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
                </label>
                <label className="story-cms-field story-cms-field--wide">
                  Slug
                  <input type="text" value={draft.slug} onChange={(event) => updateDraft({ slug: slugify(event.target.value) })} />
                </label>
                <label className="story-cms-field story-cms-field--wide">
                  Premise / subtitle
                  <textarea rows="3" value={draft.description || ""} onChange={(event) => updateDraft({ description: event.target.value })} />
                </label>
                <label className="story-cms-field">
                  Author
                  <input type="text" value={draft.author || ""} onChange={(event) => updateDraft({ author: event.target.value })} />
                </label>
                <label className="story-cms-field story-cms-field--wide">
                  {isLegacyStory ? "Legacy Story image" : "Listing / rail image"}
                  <span className="story-cms-inline-input">
                    <input type="text" value={draft.coverImage || ""} onChange={(event) => updateDraft({ coverImage: event.target.value })} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingIndex === "cover"}><FiImage /> Upload</button>
                  </span>
                  <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(event) => event.target.files?.[0] && uploadCoverImage(event.target.files[0])} />
                </label>
                {legacyMedia && (
                  <div className="story-cms-legacy-media story-cms-field--wide">
                    <img src={getImageUrl(legacyMedia.src)} alt="" width="180" height="130" />
                    <div>
                      <strong>Legacy Story image</strong>
                      <span>This existing cover is used in the compact opening reader layout.</span>
                      {legacyMedia.altMissing && <small>Alt text is missing. Add it below for accessibility.</small>}
                    </div>
                  </div>
                )}
                <label className="story-cms-field story-cms-field--wide">
                  {isLegacyStory ? "Legacy Story image alt text" : "Listing / rail image alt text"}
                  <input type="text" value={draft.coverImageAlt || ""} onChange={(event) => updateDraft({ coverImageAlt: event.target.value })} />
                </label>
              </div>
            </section>

            <section className="story-cms-layouts">
              <div className="story-cms-section-heading">
                <div><span>Story layout</span><h3>Choose an editorial rhythm</h3></div>
                <p>{storyImageCount} image{storyImageCount === 1 ? "" : "s"} in this Story · recommended layouts are marked</p>
              </div>
              {draft._storyLayoutWasUnset && (
                <p className="story-cms-layout-compatibility" role="status">
                  This legacy record had no stored layout. Classic Reader is the visible compatibility selection; save the Story to persist it explicitly.
                </p>
              )}
              <div className="story-cms-layout-groups">
                {STORY_LAYOUT_FAMILIES.map((family) => {
                  const familyLayouts = STORY_LAYOUT_PRESETS.filter((layout) => layout.family === family.id);
                  if (!familyLayouts.length) return null;
                  return (
                    <section className="story-cms-layout-group" key={family.id}>
                      <header><h4>{family.name}</h4><p>{family.description}</p></header>
                      <div className="story-cms-layout-grid">
                        {familyLayouts.map((layout) => (
                          <button type="button" key={layout.id} className={draft.storyLayout === layout.id ? "is-active" : ""} onClick={() => chooseLayout(layout.id)}>
                            <LayoutPreview rows={layout.preview} />
                            <strong>{layout.name}</strong>
                            <small>{layout.description}</small>
                            {recommendedLayoutIds.has(layout.id) && <span className="story-cms-layout-recommended">Recommended</span>}
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

            <section className="story-cms-sections">
              <div className="story-cms-section-heading">
                <div><span>Story sections</span><h3>Build the reading flow</h3></div>
                <p>{draft.storySections.length} ordered section{draft.storySections.length === 1 ? "" : "s"}</p>
              </div>

              <div className="story-cms-add-section" aria-label="Add Story section">
                {STORY_SECTION_OPTIONS.map((option) => (
                  <button type="button" key={option.type} onClick={() => addSection(option.type)} title={option.description}><FiPlus /> {option.label}</button>
                ))}
              </div>

              <div className="story-cms-section-list">
                {draft.storySections.map((section, index) => (
                  <StorySectionEditor
                    key={section.id || index}
                    section={section}
                    index={index}
                    total={draft.storySections.length}
                    updateSection={(patch) => updateSectionAt(index, patch)}
                    moveSection={moveSection}
                    removeSection={removeSection}
                    uploadSectionImage={uploadSectionImage}
                    uploading={uploadingIndex === index}
                  />
                ))}
                {!draft.storySections.length && <div className="story-cms-empty">Choose a section type above. Text-only Stories need no media placeholders.</div>}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
