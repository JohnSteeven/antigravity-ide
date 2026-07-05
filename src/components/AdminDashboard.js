import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiBold,
  FiBookOpen,
  FiBriefcase,
  FiClock,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiFile,
  FiFolder,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiSettings,
  FiSliders,
  FiTag,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import CmsLayout from "./layout/CmsLayout";
import { cmsNavigation } from "../domain/knowledgeArchitecture";

const navigationItems = cmsNavigation.flatMap((group) => group.items);

const asTagString = (tags) => (Array.isArray(tags) ? tags.join(", ") : tags || "");

const createArticleDraft = (categories) => ({
  title: "",
  slug: "",
  description: "",
  coverImage: "",
  body: "<p>Write your story here.</p>",
  category: categories[0]?.name || "Life",
  subcategory: categories[0]?.subcategories?.[0] || "",
  tags: [],
  author: "Noble John Steeven",
  publishedAt: new Date().toISOString().slice(0, 10),
  readingTime: "3 min read",
  views: 0,
  likes: 0,
  bookmarks: 0,
  rating: 4,
  featured: false,
  mustRead: false,
  trending: false,
  pinned: false,
  status: "draft",
  comments: [],
});

const readFileAsDataUrl = (file, callback) => {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
};

const readAnyFileAsDataUrl = (file, callback) => {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getMediaType = (fileOrType = "") => {
  const type = typeof fileOrType === "string" ? fileOrType : fileOrType.type || "";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf")) return "pdf";
  return "image";
};

const ImageDropZone = ({ label, value, onChange }) => {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const [file] = files;
    readFileAsDataUrl(file, onChange);
  };

  return (
    <div
      className="drop-zone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      {value ? <img src={value} alt={label} /> : <FiUpload />}
      <div>
        <strong>{label}</strong>
        <span>Drag and drop an image or choose a file.</span>
      </div>
      <button
        className="small-outline-btn"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        Choose Image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => handleFiles(event.target.files)}
        hidden
      />
    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="metric-card">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const DashboardOverview = ({ analytics, articles }) => {
  const topArticles = [...articles]
    .sort((a, b) => b.views + b.likes - (a.views + a.likes))
    .slice(0, 4);

  return (
    <div className="cms-grid-two">
      <div className="cms-panel wide">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Analytics</span>
            <h2>Performance Snapshot</h2>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard icon={<FiEye />} label="Views" value={analytics.views} />
          <MetricCard icon={<FiActivity />} label="Likes" value={analytics.likes} />
          <MetricCard
            icon={<FiBookOpen />}
            label="Published"
            value={analytics.publishedCount}
          />
          <MetricCard
            icon={<FiEyeOff />}
            label="Drafts"
            value={analytics.draftCount}
          />
          <MetricCard
            icon={<FiMessageCircle />}
            label="Pending comments"
            value={analytics.pendingComments}
          />
          <MetricCard
            icon={<FiPlus />}
            label="Subscribers"
            value={analytics.subscribers}
          />
        </div>
      </div>

      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Top articles</span>
            <h2>Most Engaged</h2>
          </div>
        </div>

        <div className="compact-list">
          {topArticles.map((article) => (
            <div key={article.id}>
              <strong>{article.title}</strong>
              <span>
                {article.views} views / {article.likes} likes
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArticleEditor = ({
  articleDraft,
  categories,
  onChange,
  onNew,
  onSave,
  onDelete,
  onSelectArticle,
  onToggleStatus,
  articles,
}) => {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== articleDraft.body) {
      editorRef.current.innerHTML = articleDraft.body || "";
    }
  }, [articleDraft.id, articleDraft.body]);

  const update = (patch) => onChange({ ...articleDraft, ...patch });

  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    update({ body: editorRef.current.innerHTML });
  };

  const insertLink = () => {
    const url = window.prompt("Paste the link URL");
    if (url) {
      runCommand("createLink", url);
    }
  };

  const insertImage = (files) => {
    const [file] = files;
    readFileAsDataUrl(file, (image) => {
      const nextBody = `${editorRef.current.innerHTML}<p><img src="${image}" alt="Uploaded article media" /></p>`;
      editorRef.current.innerHTML = nextBody;
      update({ body: nextBody });
    });
  };

  return (
    <div className="cms-grid-two article-editor-layout">
      <div className="cms-panel wide">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Rich text editor</span>
            <h2>{articleDraft.id ? "Edit Article" : "Create Article"}</h2>
          </div>
          <div className="inline-actions">
            <button className="small-outline-btn" type="button" onClick={onNew}>
              <FiPlus /> New
            </button>
            <button className="small-solid-btn" type="button" onClick={onSave}>
              <FiSave /> Save
            </button>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Title
            <input
              value={articleDraft.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Article title"
            />
          </label>
          <label>
            Slug
            <input
              value={articleDraft.slug}
              onChange={(event) => update({ slug: event.target.value })}
              placeholder="auto-generated-if-empty"
            />
          </label>
          <label className="span-two">
            Description
            <textarea
              value={articleDraft.description}
              onChange={(event) => update({ description: event.target.value })}
              rows="3"
            ></textarea>
          </label>
          <label>
            Category
            <select
              value={articleDraft.category}
              onChange={(event) => {
                const nextCategory = categories.find(
                  (category) => category.name === event.target.value
                );
                update({
                  category: event.target.value,
                  subcategory: nextCategory?.subcategories?.[0] || "",
                });
              }}
            >
              {categories.map((category) => (
                <option value={category.name} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subcategory
            <select
              value={articleDraft.subcategory || ""}
              onChange={(event) => update({ subcategory: event.target.value })}
            >
              <option value="">General</option>
              {(
                categories.find((item) => item.name === articleDraft.category)
                  ?.subcategories || []
              ).map((subcategory) => (
                <option value={subcategory} key={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tags
            <input
              value={asTagString(articleDraft.tags)}
              onChange={(event) =>
                update({
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="life, growth, notes"
            />
          </label>
          <label>
            Reading time
            <input
              value={articleDraft.readingTime}
              onChange={(event) => update({ readingTime: event.target.value })}
            />
          </label>
          <label>
            Rating
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={articleDraft.rating}
              onChange={(event) => update({ rating: event.target.value })}
            />
          </label>
        </div>

        <ImageDropZone
          label="Cover image"
          value={articleDraft.coverImage}
          onChange={(coverImage) => update({ coverImage })}
        />

        <div className="editor-toolbar" aria-label="Editor toolbar">
          <button type="button" onClick={() => runCommand("bold")} title="Bold">
            <FiBold />
          </button>
          <button type="button" onClick={() => runCommand("italic")} title="Italic">
            <FiItalic />
          </button>
          <button
            type="button"
            onClick={() => runCommand("formatBlock", "h2")}
            title="Heading"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => runCommand("formatBlock", "blockquote")}
            title="Quote"
          >
            "
          </button>
          <button
            type="button"
            onClick={() => runCommand("insertUnorderedList")}
            title="List"
          >
            <FiList />
          </button>
          <button type="button" onClick={insertLink} title="Link">
            <FiLink />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            title="Insert image"
          >
            <FiImage />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => insertImage(event.target.files)}
          />
        </div>

        <div
          ref={editorRef}
          className="rich-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={() => update({ body: editorRef.current.innerHTML })}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            insertImage(event.dataTransfer.files);
          }}
        ></div>

        <div className="toggle-grid">
          {["featured", "mustRead", "trending", "pinned"].map((field) => (
            <label className="check-card" key={field}>
              <input
                type="checkbox"
                checked={Boolean(articleDraft[field])}
                onChange={(event) => update({ [field]: event.target.checked })}
              />
              {field}
            </label>
          ))}
          <label className="check-card">
            <input
              type="checkbox"
              checked={articleDraft.status === "published"}
              onChange={(event) =>
                update({ status: event.target.checked ? "published" : "draft" })
              }
            />
            published
          </label>
        </div>
      </div>

      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Library</span>
            <h2>Articles</h2>
          </div>
        </div>

        <div className="cms-article-list">
          {articles.map((article) => (
            <article
              className={article.id === articleDraft.id ? "selected" : ""}
              key={article.id}
            >
              <button type="button" onClick={() => onSelectArticle(article)}>
                <strong>{article.title}</strong>
                <span>{article.status}</span>
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => onToggleStatus(article.id)}
                  title="Publish or unpublish"
                >
                  {article.status === "published" ? <FiEyeOff /> : <FiEye />}
                </button>
                <button type="button" onClick={() => onDelete(article.id)}>
                  <FiTrash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

const HeroManager = ({ data, updateSiteSection, updateStorySection }) => (
  <div className="cms-grid-two">
    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Homepage</span>
          <h2>Hero Banner</h2>
        </div>
      </div>
      <div className="form-grid one">
        <label>
          Eyebrow
          <input
            value={data.site.hero.eyebrow}
            onChange={(event) =>
              updateSiteSection("hero", { eyebrow: event.target.value })
            }
          />
        </label>
        <label>
          Title
          <input
            value={data.site.hero.title}
            onChange={(event) =>
              updateSiteSection("hero", { title: event.target.value })
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={data.site.hero.description}
            onChange={(event) =>
              updateSiteSection("hero", { description: event.target.value })
            }
          ></textarea>
        </label>
      </div>
      <ImageDropZone
        label="Homepage hero banner"
        value={data.site.hero.image}
        onChange={(image) => updateSiteSection("hero", { image })}
      />
    </div>

    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Story page</span>
          <h2>Read My Story Banner</h2>
        </div>
      </div>
      <div className="form-grid one">
        <label>
          Title
          <input
            value={data.story.hero.title}
            onChange={(event) =>
              updateStorySection("hero", { title: event.target.value })
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={data.story.hero.description}
            onChange={(event) =>
              updateStorySection("hero", { description: event.target.value })
            }
          ></textarea>
        </label>
      </div>
      <ImageDropZone
        label="Story page hero banner"
        value={data.story.hero.image}
        onChange={(image) => updateStorySection("hero", { image })}
      />
    </div>
  </div>
);

const QuoteManager = ({ data, updateSiteSection }) => (
  <div className="cms-panel">
    <div className="cms-panel-heading">
      <div>
        <span className="section-kicker">Quote section</span>
        <h2>Change Quotes</h2>
      </div>
    </div>
    <div className="form-grid one">
      <label>
        Quote
        <textarea
          rows="5"
          value={data.site.quote.text}
          onChange={(event) =>
            updateSiteSection("quote", { text: event.target.value })
          }
        ></textarea>
      </label>
      <label>
        Attribution
        <input
          value={data.site.quote.author}
          onChange={(event) =>
            updateSiteSection("quote", { author: event.target.value })
          }
        />
      </label>
    </div>
    <ImageDropZone
      label="Quote background"
      value={data.site.quote.image}
      onChange={(image) => updateSiteSection("quote", { image })}
    />
  </div>
);

const CollectionManager = ({
  title,
  kicker,
  draft,
  setDraft,
  onSave,
  onDelete,
  items,
  fields,
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
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
              ></textarea>
            ) : (
              <input
                type={field.type || "text"}
                min={field.min}
                max={field.max}
                value={draft[field.name] || ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
              />
            )}
          </label>
        ))}
        {"image" in draft && (
          <ImageDropZone
            label="Project image"
            value={draft.image}
            onChange={(image) =>
              setDraft((current) => ({
                ...current,
                image,
              }))
            }
          />
        )}
        {"heroImage" in draft && (
          <ImageDropZone
            label="Category hero image"
            value={draft.heroImage}
            onChange={(heroImage) =>
              setDraft((current) => ({
                ...current,
                heroImage,
              }))
            }
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

const TagManager = ({ tags, articles, draft, setDraft, onSave, onDelete }) => {
  const getUsageCount = (tag) =>
    articles.filter((article) =>
      (article.tags || []).some(
        (item) =>
          String(item).toLowerCase() === String(tag.name).toLowerCase() ||
          String(item).toLowerCase() === String(tag.slug).toLowerCase()
      )
    ).length;

  return (
    <div className="cms-grid-two tag-manager-layout">
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Taxonomy</span>
            <h2>{draft.id ? "Edit Tag" : "Create Tag"}</h2>
          </div>
          <button className="small-solid-btn" type="button" onClick={onSave}>
            <FiSave /> Save Tag
          </button>
        </div>

        <div className="form-grid one">
          <label>
            Name
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            Slug
            <input
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: event.target.value }))
              }
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            ></textarea>
          </label>
          <label>
            Color
            <span className="color-input-row">
              <input
                type="color"
                value={draft.color || "#426c67"}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, color: event.target.value }))
                }
              />
              <span
                className="tag-color-preview"
                style={{ backgroundColor: draft.color || "#426c67" }}
              ></span>
            </span>
          </label>
        </div>
      </div>

      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Existing</span>
            <h2>Tags</h2>
          </div>
        </div>
        <div className="tag-list">
          {tags.map((tag) => (
            <article key={tag.id}>
              <button type="button" onClick={() => setDraft(tag)}>
                <span
                  className="tag-color-preview"
                  style={{ backgroundColor: tag.color || "#426c67" }}
                ></span>
                <div>
                  <strong>{tag.name}</strong>
                  <small>{tag.description || tag.slug}</small>
                </div>
              </button>
              <span>{getUsageCount(tag)} posts</span>
              <button type="button" onClick={() => onDelete(tag.id)}>
                <FiTrash2 />
              </button>
            </article>
          ))}
          {tags.length === 0 && <p className="empty-state">No tags yet.</p>}
        </div>
      </div>
    </div>
  );
};

const MediaPreview = ({ media }) => {
  if (!media?.url) {
    return (
      <div className="media-file-preview">
        <FiImage />
        <span>No asset selected</span>
      </div>
    );
  }

  if (media.type === "video") {
    return <video src={media.url} controls title={media.alt || media.name}></video>;
  }

  if (media.type === "audio") {
    return (
      <div className="media-file-preview">
        <FiFile />
        <audio src={media.url} controls></audio>
      </div>
    );
  }

  if (media.type === "pdf") {
    return (
      <div className="media-file-preview">
        <FiFile />
        <span>{media.fileName || media.name || "PDF"}</span>
      </div>
    );
  }

  return <img src={media.url} alt={media.alt || media.name || "Media asset"} />;
};

const MediaLibraryManager = ({
  media,
  draft,
  setDraft,
  onSave,
  onBulkAdd,
  onReplace,
  onDelete,
}) => {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [type, setType] = useState("all");
  const uploadInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const folders = useMemo(
    () => ["all", ...new Set(media.map((item) => item.folder).filter(Boolean))],
    [media]
  );

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return media.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.name, item.fileName, item.folder, item.alt]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesFolder = folder === "all" || item.folder === folder;
      const matchesType = type === "all" || item.type === type;
      return matchesQuery && matchesFolder && matchesType;
    });
  }, [folder, media, query, type]);

  const createMediaFromFiles = (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;

    Promise.all(
      fileList.map(
        (file) =>
          new Promise((resolve) => {
            readAnyFileAsDataUrl(file, (url) =>
              resolve({
                name: file.name.replace(/\.[^.]+$/, ""),
                fileName: file.name,
                type: getMediaType(file),
                url,
                folder: draft.folder || "Uploads",
                alt: file.name.replace(/\.[^.]+$/, ""),
                size: formatFileSize(file.size),
                provider: "local",
              })
            );
          })
      )
    ).then(onBulkAdd);
  };

  const replaceSelectedMedia = (files) => {
    const [file] = files || [];
    if (!file || !draft.id) return;

    readAnyFileAsDataUrl(file, (url) =>
      onReplace(draft.id, {
        url,
        fileName: file.name,
        name: draft.name || file.name.replace(/\.[^.]+$/, ""),
        type: getMediaType(file),
        size: formatFileSize(file.size),
      })
    );
  };

  return (
    <div className="media-library-layout">
      <div className="cms-panel media-toolbar-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Assets</span>
            <h2>Media Library</h2>
          </div>
          <div className="inline-actions">
            <button
              className="small-outline-btn"
              type="button"
              onClick={() => uploadInputRef.current?.click()}
            >
              <FiUpload /> Bulk Upload
            </button>
            <button className="small-solid-btn" type="button" onClick={onSave}>
              <FiSave /> Save Asset
            </button>
          </div>
        </div>

        <div className="media-filter-grid">
          <label className="cms-search-control">
            <FiSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search media"
            />
          </label>
          <label>
            Folder
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              {folders.map((item) => (
                <option value={item} key={item}>
                  {item === "all" ? "All folders" : item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDFs</option>
            </select>
          </label>
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf"
          multiple
          hidden
          onChange={(event) => createMediaFromFiles(event.target.files)}
        />
      </div>

      <div className="media-library-grid">
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <article className={item.id === draft.id ? "selected" : ""} key={item.id}>
              <button type="button" onClick={() => setDraft(item)}>
                <MediaPreview media={item} />
              </button>
              <div>
                <strong>{item.name}</strong>
                <span>{item.folder} / {item.type}</span>
                <small>{item.size || "External URL"}</small>
              </div>
              <button type="button" onClick={() => onDelete(item.id)}>
                <FiTrash2 />
              </button>
            </article>
          ))}
          {filteredMedia.length === 0 && <p className="empty-state">No media found.</p>}
        </div>

        <div className="cms-panel media-editor-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Details</span>
              <h2>{draft.id ? "Edit Asset" : "Add External Asset"}</h2>
            </div>
          </div>
          <div className="form-grid one">
            <label>
              Name
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              URL
              <input
                value={draft.url}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, url: event.target.value }))
                }
              />
            </label>
            <label>
              Folder
              <input
                value={draft.folder}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, folder: event.target.value }))
                }
              />
            </label>
            <label>
              Type
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, type: event.target.value }))
                }
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label>
              Alt text / description
              <textarea
                rows="3"
                value={draft.alt}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, alt: event.target.value }))
                }
              ></textarea>
            </label>
          </div>

          <div className="media-editor-preview">
            <MediaPreview media={draft} />
          </div>

          <div className="inline-actions">
            <button
              className="small-outline-btn"
              type="button"
              disabled={!draft.id}
              onClick={() => replaceInputRef.current?.click()}
            >
              <FiRefreshCw /> Replace File
            </button>
            <button
              className="small-outline-btn"
              type="button"
              onClick={() =>
                setDraft({
                  name: "",
                  fileName: "",
                  type: "image",
                  url: "",
                  folder: "Uploads",
                  alt: "",
                  size: "",
                  provider: "local",
                })
              }
            >
              <FiPlus /> New Asset
            </button>
          </div>

          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*,video/*,audio/*,application/pdf"
            hidden
            onChange={(event) => replaceSelectedMedia(event.target.files)}
          />
        </div>
      </div>
    </div>
  );
};

const CommentsManager = ({ comments, updateCommentStatus }) => (
  <div className="cms-panel">
    <div className="cms-panel-heading">
      <div>
        <span className="section-kicker">Moderation</span>
        <h2>Comments</h2>
      </div>
    </div>

    <div className="comment-moderation-list">
      {comments.map((comment) => (
        <article key={comment.id}>
          <div>
            <strong>{comment.name}</strong>
            <span>{comment.articleTitle}</span>
          </div>
          <p>{comment.text}</p>
          <div className="inline-actions">
            <span className={`status-pill ${comment.status}`}>{comment.status}</span>
            <button
              className="small-outline-btn"
              type="button"
              onClick={() =>
                updateCommentStatus(comment.articleId, comment.id, "approved")
              }
            >
              Approve
            </button>
            <button
              className="small-outline-btn"
              type="button"
              onClick={() =>
                updateCommentStatus(comment.articleId, comment.id, "rejected")
              }
            >
              Reject
            </button>
          </div>
        </article>
      ))}
      {comments.length === 0 && <p className="empty-state">No comments yet.</p>}
    </div>
  </div>
);

const SettingsManager = ({ data, updateSiteSection, resetDemoData }) => (
  <div className="cms-grid-two">
    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Site settings</span>
          <h2>Brand and Footer</h2>
        </div>
      </div>
      <div className="form-grid one">
        <label>
          Brand
          <input
            value={data.site.brand}
            onChange={(event) =>
              updateSiteSection("brand", event.target.value)
            }
          />
        </label>
        <label>
          Footer text
          <textarea
            rows="4"
            value={data.site.footer}
            onChange={(event) =>
              updateSiteSection("footer", event.target.value)
            }
          ></textarea>
        </label>
      </div>
      <button className="small-outline-btn danger" type="button" onClick={resetDemoData}>
        <FiRefreshCw /> Reset Sample Data
      </button>
    </div>

    <div className="cms-panel">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Social links</span>
          <h2>Contact Links</h2>
        </div>
      </div>
      <div className="form-grid one">
        {Object.entries(data.site.socials).map(([key, value]) => (
          <label key={key}>
            {key}
            <input
              value={value}
              onChange={(event) =>
                updateSiteSection("socials", { [key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
    </div>
  </div>
);

const ModulePlaceholder = ({ module }) => (
  <div className="cms-panel module-placeholder">
    <div>
      <span className="section-kicker">Module scaffold</span>
      <h2>{module?.label || "CMS Module"}</h2>
    </div>
    <p>
      This section is registered in the CMS architecture and ready for its
      dedicated screens, API contracts, permissions, and audit logging.
    </p>
    <div className="module-checklist">
      <span>Role protected route</span>
      <span>Validated forms</span>
      <span>Activity trail</span>
      <span>Search and filters</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const cms = useCms();
  const {
    data,
    analytics,
    saveArticle,
    deleteArticle,
    toggleArticleStatus,
    updateSiteSection,
    updateStorySection,
    saveProject,
    deleteProject,
    saveSkill,
    deleteSkill,
    saveTimelineItem,
    deleteTimelineItem,
    saveCategory,
    deleteCategory,
    updateCommentStatus,
    resetDemoData,
  } = cms;

  const [activeTab, setActiveTab] = useState("overview");
  const [articleDraft, setArticleDraft] = useState(() =>
    createArticleDraft(data.categories)
  );
  const [projectDraft, setProjectDraft] = useState({
    title: "",
    category: "",
    description: "",
    image: "",
    status: "Draft",
  });
  const [skillDraft, setSkillDraft] = useState({ name: "", level: 50 });
  const [timelineDraft, setTimelineDraft] = useState({
    year: new Date().getFullYear(),
    title: "",
    description: "",
  });
  const [categoryDraft, setCategoryDraft] = useState({
    name: "",
    slug: "",
    description: "",
    longDescription: "",
    subcategories: "",
    heroImage: "",
    icon: "book",
  });

  const sortedArticles = useMemo(
    () =>
      [...data.articles].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
    [data.articles]
  );

  const handleArticleSave = () => {
    saveArticle(articleDraft);
    if (!articleDraft.id) {
      setArticleDraft(createArticleDraft(data.categories));
    }
  };

  const saveAndClearProject = () => {
    saveProject(projectDraft);
    setProjectDraft({
      title: "",
      category: "",
      description: "",
      image: "",
      status: "Draft",
    });
  };

  const saveAndClearSkill = () => {
    saveSkill(skillDraft);
    setSkillDraft({ name: "", level: 50 });
  };

  const saveAndClearTimeline = () => {
    saveTimelineItem(timelineDraft);
    setTimelineDraft({
      year: new Date().getFullYear(),
      title: "",
      description: "",
    });
  };

  const saveAndClearCategory = () => {
    saveCategory(categoryDraft);
    setCategoryDraft({
      name: "",
      slug: "",
      description: "",
      longDescription: "",
      subcategories: "",
      heroImage: "",
      icon: "book",
    });
  };

  return (
    <main className="cms-page">
      <aside className="cms-sidebar">
        <div className="cms-brand">
          <FiGrid />
          <div>
            <span>MyJourney</span>
            <strong>CMS</strong>
          </div>
        </div>

        <nav aria-label="CMS sections">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "active" : ""}
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="cms-workspace">
        <header className="cms-header">
          <div>
            <span className="section-kicker">Content management system</span>
            <h1>Manage MyJourney</h1>
          </div>
          <div className="cms-header-actions">
            <span>{analytics.articleCount} articles</span>
            <span>{analytics.subscribers} subscribers</span>
          </div>
        </header>

        {activeTab === "overview" && (
          <DashboardOverview analytics={analytics} articles={data.articles} />
        )}

        {activeTab === "articles" && (
          <ArticleEditor
            articleDraft={articleDraft}
            categories={data.categories}
            onChange={setArticleDraft}
            onNew={() => setArticleDraft(createArticleDraft(data.categories))}
            onSave={handleArticleSave}
            onDelete={deleteArticle}
            onSelectArticle={(article) => setArticleDraft({ ...article })}
            onToggleStatus={toggleArticleStatus}
            articles={sortedArticles}
          />
        )}

        {activeTab === "hero" && (
          <HeroManager
            data={data}
            updateSiteSection={updateSiteSection}
            updateStorySection={updateStorySection}
          />
        )}

        {activeTab === "quotes" && (
          <QuoteManager data={data} updateSiteSection={updateSiteSection} />
        )}

        {activeTab === "projects" && (
          <CollectionManager
            title="Projects"
            kicker="Portfolio"
            draft={projectDraft}
            setDraft={setProjectDraft}
            onSave={saveAndClearProject}
            onDelete={deleteProject}
            items={data.projects}
            fields={[
              { name: "title", label: "Title" },
              { name: "category", label: "Category" },
              { name: "status", label: "Status" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
          />
        )}

        {activeTab === "skills" && (
          <CollectionManager
            title="Skills"
            kicker="Expertise"
            draft={skillDraft}
            setDraft={setSkillDraft}
            onSave={saveAndClearSkill}
            onDelete={deleteSkill}
            items={data.skills}
            fields={[
              { name: "name", label: "Name" },
              { name: "level", label: "Level", type: "number", min: 0, max: 100 },
            ]}
          />
        )}

        {activeTab === "timeline" && (
          <CollectionManager
            title="Timeline"
            kicker="Read My Story"
            draft={timelineDraft}
            setDraft={setTimelineDraft}
            onSave={saveAndClearTimeline}
            onDelete={deleteTimelineItem}
            items={data.timeline}
            fields={[
              { name: "year", label: "Year" },
              { name: "title", label: "Title" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
          />
        )}

        {activeTab === "categories" && (
          <CollectionManager
            title="Categories"
            kicker="Taxonomy"
            draft={categoryDraft}
            setDraft={setCategoryDraft}
            onSave={saveAndClearCategory}
            onDelete={deleteCategory}
            items={data.categories}
            fields={[
              { name: "name", label: "Name" },
              { name: "slug", label: "Slug" },
              { name: "icon", label: "Icon key" },
              { name: "description", label: "Description", type: "textarea" },
              {
                name: "longDescription",
                label: "Category page description",
                type: "textarea",
              },
              {
                name: "subcategories",
                label: "Sub categories",
                type: "textarea",
              },
            ]}
          />
        )}

        {activeTab === "comments" && (
          <CommentsManager
            comments={analytics.comments}
            updateCommentStatus={updateCommentStatus}
          />
        )}

        {activeTab === "settings" && (
          <SettingsManager
            data={data}
            updateSiteSection={updateSiteSection}
            resetDemoData={resetDemoData}
          />
        )}
      </section>
    </main>
  );
};

export default AdminDashboard;
