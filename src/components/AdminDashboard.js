import { useMemo, useRef, useState } from "react";
import {
  FiFile,
  FiGrid,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTag,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import DashboardOverview from "./cms/DashboardOverview";
import ArticleModule from "./cms/ArticleModule";
import CategoryModule from "./cms/CategoryModule";
import SubCategoryModule from "./cms/SubCategoryModule";
import TagModule from "./cms/TagModule";
import MediaLibraryModule from "./cms/MediaLibraryModule";
import CommentModule from "./cms/CommentModule";
import UserModule from "./cms/UserModule";
import RoleModule from "./cms/RoleModule";
import PermissionModule from "./cms/PermissionModule";
import ProfileModule from "./cms/ProfileModule";
import ActivityLogModule from "./cms/ActivityLogModule";
import SiteSettingsModule from "./cms/SiteSettingsModule";
import NavigationModule from "./cms/NavigationModule";
import HomepageModule from "./cms/HomepageModule";
import FooterModule from "./cms/FooterModule";
import TestimonialModule from "./cms/TestimonialModule";
import GalleryModule from "./cms/GalleryModule";
import NewsletterModule from "./cms/NewsletterModule";
import ContactModule from "./cms/ContactModule";
import BackupModule from "./cms/BackupModule";
import CmsLayout from "./layout/CmsLayout";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createArticleDraft = (categories = []) => ({
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
  if (!file || !file.type.startsWith("image/")) return;
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
  const type =
    typeof fileOrType === "string" ? fileOrType : fileOrType.type || "";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf")) return "pdf";
  return "image";
};

// ─── Shared Sub-components ────────────────────────────────────────────────────

const ImageDropZone = ({ label, value, onChange }) => {
  const inputRef = useRef(null);
  const handleFiles = (files) => {
    const [file] = files;
    readFileAsDataUrl(file, onChange);
  };
  return (
    <div
      className="drop-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
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
        onChange={(e) => handleFiles(e.target.files)}
        hidden
      />
    </div>
  );
};

// ─── Legacy Manager: Hero & Story ─────────────────────────────────────────────

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
            onChange={(e) =>
              updateSiteSection("hero", { eyebrow: e.target.value })
            }
          />
        </label>
        <label>
          Title
          <input
            value={data.site.hero.title}
            onChange={(e) =>
              updateSiteSection("hero", { title: e.target.value })
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={data.site.hero.description}
            onChange={(e) =>
              updateSiteSection("hero", { description: e.target.value })
            }
          />
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
            onChange={(e) =>
              updateStorySection("hero", { title: e.target.value })
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows="4"
            value={data.story.hero.description}
            onChange={(e) =>
              updateStorySection("hero", { description: e.target.value })
            }
          />
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

// ─── Legacy Manager: Quote ─────────────────────────────────────────────────────

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
          onChange={(e) =>
            updateSiteSection("quote", { text: e.target.value })
          }
        />
      </label>
      <label>
        Attribution
        <input
          value={data.site.quote.author}
          onChange={(e) =>
            updateSiteSection("quote", { author: e.target.value })
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

// ─── Legacy Manager: Generic Collection ───────────────────────────────────────

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
        {"image" in draft && (
          <ImageDropZone
            label="Project image"
            value={draft.image}
            onChange={(image) => setDraft((c) => ({ ...c, image }))}
          />
        )}
        {"heroImage" in draft && (
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

// ─── Legacy Manager: Tags ─────────────────────────────────────────────────────

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
              onChange={(e) =>
                setDraft((c) => ({ ...c, name: e.target.value }))
              }
            />
          </label>
          <label>
            Slug
            <input
              value={draft.slug}
              onChange={(e) =>
                setDraft((c) => ({ ...c, slug: e.target.value }))
              }
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={draft.description}
              onChange={(e) =>
                setDraft((c) => ({ ...c, description: e.target.value }))
              }
            />
          </label>
          <label>
            Color
            <span className="color-input-row">
              <input
                type="color"
                value={draft.color || "#426c67"}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, color: e.target.value }))
                }
              />
              <span
                className="tag-color-preview"
                style={{ backgroundColor: draft.color || "#426c67" }}
              />
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
                />
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
          {tags.length === 0 && (
            <p className="empty-state">No tags yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Legacy Manager: Media Library ────────────────────────────────────────────

const MediaPreview = ({ media }) => {
  if (!media?.url) {
    return (
      <div className="media-file-preview">
        <FiImage />
        <span>No asset selected</span>
      </div>
    );
  }
  if (media.type === "video")
    return <video src={media.url} controls title={media.alt || media.name} />;
  if (media.type === "audio")
    return (
      <div className="media-file-preview">
        <FiFile />
        <audio src={media.url} controls />
      </div>
    );
  if (media.type === "pdf")
    return (
      <div className="media-file-preview">
        <FiFile />
        <span>{media.fileName || media.name || "PDF"}</span>
      </div>
    );
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
    const q = query.trim().toLowerCase();
    return media.filter((item) => {
      const matchesQuery =
        !q ||
        [item.name, item.fileName, item.folder, item.alt]
          .join(" ")
          .toLowerCase()
          .includes(q);
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search media"
            />
          </label>
          <label>
            Folder
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              {folders.map((item) => (
                <option value={item} key={item}>
                  {item === "all" ? "All folders" : item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
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
          onChange={(e) => createMediaFromFiles(e.target.files)}
        />
      </div>

      <div className="media-library-grid">
        <div className="media-grid">
          {filteredMedia.map((item) => (
            <article
              className={item.id === draft.id ? "selected" : ""}
              key={item.id}
            >
              <button type="button" onClick={() => setDraft(item)}>
                <MediaPreview media={item} />
              </button>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.folder} / {item.type}
                </span>
                <small>{item.size || "External URL"}</small>
              </div>
              <button type="button" onClick={() => onDelete(item.id)}>
                <FiTrash2 />
              </button>
            </article>
          ))}
          {filteredMedia.length === 0 && (
            <p className="empty-state">No media found.</p>
          )}
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
                onChange={(e) =>
                  setDraft((c) => ({ ...c, name: e.target.value }))
                }
              />
            </label>
            <label>
              URL
              <input
                value={draft.url}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, url: e.target.value }))
                }
              />
            </label>
            <label>
              Folder
              <input
                value={draft.folder}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, folder: e.target.value }))
                }
              />
            </label>
            <label>
              Type
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, type: e.target.value }))
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
                onChange={(e) =>
                  setDraft((c) => ({ ...c, alt: e.target.value }))
                }
              />
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
            onChange={(e) => replaceSelectedMedia(e.target.files)}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Legacy Manager: Comments ──────────────────────────────────────────────────

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
            <span className={`status-pill ${comment.status}`}>
              {comment.status}
            </span>
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
      {comments.length === 0 && (
        <p className="empty-state">No comments yet.</p>
      )}
    </div>
  </div>
);

// ─── Legacy Manager: Settings ──────────────────────────────────────────────────

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
            onChange={(e) => updateSiteSection("brand", e.target.value)}
          />
        </label>
        <label>
          Footer text
          <textarea
            rows="4"
            value={data.site.footer}
            onChange={(e) => updateSiteSection("footer", e.target.value)}
          />
        </label>
      </div>
      <button
        className="small-outline-btn danger"
        type="button"
        onClick={resetDemoData}
      >
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
              onChange={(e) =>
                updateSiteSection("socials", { [key]: e.target.value })
              }
            />
          </label>
        ))}
      </div>
    </div>
  </div>
);

// ─── Module Registry ──────────────────────────────────────────────────────────
// Source of truth for all CMS modules: their metadata, phase, status, icon,
// and planned features. Used by ModulePlaceholder for unmigrated modules.

const MODULE_REGISTRY = {
  subcategories: {
    icon: "◈",
    label: "Sub Categories",
    group: "Publishing",
    phase: "4B",
    status: "Scheduled",
    purpose:
      "Manage subcategories nested inside parent categories. Subcategories allow fine-grained content organisation and help readers navigate to specific topic areas.",
    features: [
      "Create, edit, and delete subcategories",
      "Associate subcategories with parent categories",
      "Automatic slug generation",
      "REST API integration with live MongoDB",
      "Category-subcategory picker in Article editor",
    ],
  },
  users: {
    icon: "◎",
    label: "Users",
    group: "Access",
    phase: "4B",
    status: "Scheduled",
    purpose:
      "Manage all user accounts registered on the platform. View, search, activate, deactivate, and assign roles to users from a centralised admin interface.",
    features: [
      "Paginated user list with search and filters",
      "Edit user profile: name, email, avatar",
      "Assign and revoke roles",
      "Account activation and deactivation",
      "Password reset trigger",
      "Last login and activity display",
    ],
  },
  roles: {
    icon: "◇",
    label: "Roles",
    group: "Access",
    phase: "4B",
    status: "Scheduled",
    purpose:
      "Define and manage access roles for the platform. Roles control what each user can see and do across the CMS. Supports admin, editor, author, and custom roles.",
    features: [
      "Create and name custom roles",
      "Assign permission sets per role",
      "Role hierarchy (admin inherits all)",
      "Assign roles to user accounts",
      "Protected route enforcement",
    ],
  },
  permissions: {
    icon: "◉",
    label: "Permissions",
    group: "Access",
    phase: "4B",
    status: "Scheduled",
    purpose:
      "Define granular permission rules per role and per resource. Control read, write, delete and publish access at the module and entity level.",
    features: [
      "Visual permission matrix (role × resource)",
      "Resource-level access control",
      "Read / Write / Delete / Publish permissions",
      "Live enforcement via admin middleware",
      "Audit trail for permission changes",
    ],
  },
  analytics: {
    icon: "◈",
    label: "Analytics",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Site-wide analytics dashboard tracking views, likes, bookmarks, and reader engagement over time. Powered by MongoDB aggregation pipelines — no third-party tracking.",
    features: [
      "Time-series charts: views, likes, bookmarks",
      "Top articles by views and engagement",
      "Reader retention and average reading time",
      "Category and tag performance breakdown",
      "Subscriber growth over time",
    ],
  },
  seo: {
    icon: "◎",
    label: "SEO",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Manage SEO metadata for every article and public page. Control how content appears in search results and social previews without touching code.",
    features: [
      "Custom meta title and description per article",
      "Open Graph and Twitter card preview",
      "Canonical URL configuration",
      "Sitemap generation and submission",
      "Structured data (JSON-LD) editor",
    ],
  },
  navigation: {
    icon: "◇",
    label: "Navigation Menu",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Manage the public site navigation menu without touching code. Add, reorder, and remove menu items, configure dropdowns, and set external link targets.",
    features: [
      "Drag-and-drop menu builder",
      "Nested dropdowns (2 levels)",
      "Internal and external link support",
      "Mobile navigation preview",
      "Live sync with frontend header",
    ],
  },
  footer: {
    icon: "◉",
    label: "Footer",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Manage the site footer content: columns, links, newsletter toggle, and copyright text. Changes sync instantly to the public website.",
    features: [
      "Multi-column footer layout editor",
      "Social media link management",
      "Legal and policy link configuration",
      "Newsletter sign-up toggle",
      "Copyright text and year",
    ],
  },
  testimonials: {
    icon: "◈",
    label: "Testimonials",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Manage testimonials and reader quotes displayed on the site. Add photos, ratings, and control which testimonials are publicly visible.",
    features: [
      "Add, edit, and delete testimonials",
      "Photo upload per testimonial",
      "Star rating (1–5)",
      "Enable / disable individual testimonials",
      "Display order control",
    ],
  },
  gallery: {
    icon: "◎",
    label: "Gallery",
    group: "Experience",
    phase: "4C",
    status: "Planned",
    purpose:
      "Photo and media gallery management. Organise images into albums, add captions, and control public visibility from a visual grid interface.",
    features: [
      "Multi-image upload with drag-and-drop",
      "Album and collection organisation",
      "Caption and alt text editing",
      "Public visibility toggle per image",
      "Lightbox preview",
    ],
  },
  newsletters: {
    icon: "◇",
    label: "Newsletters",
    group: "Operations",
    phase: "4D",
    status: "Planned",
    purpose:
      "Compose, schedule, and send newsletter campaigns to subscriber segments. Track open rates and click-through performance.",
    features: [
      "Rich text email composer",
      "Subscriber segment targeting",
      "Schedule send date and time",
      "Send history and delivery status",
      "Open rate and click analytics",
    ],
  },
  contact: {
    icon: "◉",
    label: "Contact Messages",
    group: "Operations",
    phase: "4D",
    status: "Planned",
    purpose:
      "View, filter, and respond to messages submitted through the public contact form. Archive, export, and reply directly from the CMS.",
    features: [
      "Inbox view with read/unread status",
      "Filter by date, status, and topic",
      "Reply via email integration",
      "Archive and delete messages",
      "Export to CSV",
    ],
  },
  backups: {
    icon: "◈",
    label: "Backups",
    group: "Operations",
    phase: "4D",
    status: "Planned",
    purpose:
      "Create, schedule, and restore MongoDB database backups. Download backup files and restore to any previous state with one click.",
    features: [
      "Manual backup with one click",
      "Scheduled automatic backups",
      "Restore from any backup snapshot",
      "Download backup as JSON or BSON",
      "Backup size and timestamp log",
    ],
  },
  logs: {
    icon: "◎",
    label: "Logs",
    group: "Operations",
    phase: "4D",
    status: "Planned",
    purpose:
      "Full activity and audit log viewer. Track every action taken in the CMS — who did what, when, and to which resource. Filterable and exportable.",
    features: [
      "Filter by user, action type, and entity",
      "Timestamped, immutable log entries",
      "Search by keyword or resource ID",
      "Export logs to CSV",
      "Retention policy configuration",
    ],
  },
  profile: {
    icon: "◇",
    label: "Profile",
    group: "Operations",
    phase: "4D",
    status: "Planned",
    purpose:
      "Manage your administrator profile: display name, avatar, email, and security settings including password change and two-factor authentication.",
    features: [
      "Edit display name and bio",
      "Avatar upload and crop",
      "Change email address",
      "Change password with strength validation",
      "Two-factor authentication setup",
    ],
  },
};

// Phase colour coding
const PHASE_STYLES = {
  "4B": { bg: "#1a3a5c", color: "#7ec8e3", label: "Phase 4B" },
  "4C": { bg: "#1a3a2c", color: "#7edba0", label: "Phase 4C" },
  "4D": { bg: "#3a2a1a", color: "#e3b87e", label: "Phase 4D" },
};

// Status colour coding
const STATUS_STYLES = {
  Scheduled: { dot: "#7ec8e3", text: "Scheduled for implementation" },
  Planned: { dot: "#7edba0", text: "Planned — architecture defined" },
};

// ─── ModulePlaceholder ────────────────────────────────────────────────────────
// Professional placeholder for CMS modules that have not yet been migrated.
// Shows module identity, purpose, status, and planned features.
// Looks like a real admin module page, not a holding page.

const ModulePlaceholder = ({ tabId }) => {
  const module = MODULE_REGISTRY[tabId];

  // Fallback for any tab not in the registry
  if (!module) {
    return (
      <div className="cms-panel">
        <p className="empty-state">Module not found: {tabId}</p>
      </div>
    );
  }

  const phase = PHASE_STYLES[module.phase] || PHASE_STYLES["4D"];
  const status = STATUS_STYLES[module.status] || STATUS_STYLES["Planned"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "100%",
      }}
    >
      {/* Header card */}
      <div
        className="cms-panel"
        style={{
          borderLeft: `4px solid ${phase.color}`,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "start",
          gap: "1.5rem",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: phase.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: phase.color,
            flexShrink: 0,
          }}
        >
          {module.icon}
        </div>

        {/* Title and description */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              {module.label}
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                background: phase.bg,
                color: phase.color,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: `1px solid ${phase.color}30`,
              }}
            >
              {phase.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary, #666)", lineHeight: 1.6 }}>
            {module.purpose}
          </p>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.4rem",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: status.dot,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "0.8rem", color: status.dot, fontWeight: 600 }}>
              {module.status}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #888)" }}>
            {module.group}
          </span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="cms-grid-two">
        {/* Features */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Planned Features</span>
              <h2>What this module will provide</h2>
            </div>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {module.features.map((feature, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  fontSize: "0.9rem",
                  color: "var(--text-primary, #333)",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: phase.bg,
                    border: `1px solid ${phase.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    color: phase.color,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  {i + 1}
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Implementation status */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Implementation Status</span>
              <h2>Current state</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Status row */}
            {[
              { label: "Architecture", done: true },
              { label: "API Design", done: true },
              { label: "Navigation", done: true },
              { label: "UI Implementation", done: false },
              { label: "API Integration", done: false },
              { label: "Testing", done: false },
            ].map(({ label: rowLabel, done }) => (
              <div
                key={rowLabel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.88rem",
                  color: done ? "var(--text-primary, #333)" : "var(--text-secondary, #999)",
                }}
              >
                <span>{rowLabel}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.15rem 0.6rem",
                    borderRadius: "999px",
                    background: done ? "#e8f5ee" : "#f5f5f5",
                    color: done ? "#2e7d52" : "#999",
                    fontWeight: 600,
                  }}
                >
                  {done ? "Complete" : "Pending"}
                </span>
              </div>
            ))}

            {/* Progress bar */}
            <div style={{ marginTop: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary, #888)",
                  marginBottom: "0.4rem",
                }}
              >
                <span>Implementation progress</span>
                <span>50%</span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "999px",
                  background: "#f0f0f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "50%",
                    borderRadius: "999px",
                    background: `linear-gradient(90deg, ${phase.color}, ${phase.bg})`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab Router ───────────────────────────────────────────────────────────────
// Maps tab ids to their content. Centralised here for easy extension.

// ─── AdminDashboard ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const cms = useCms();
  const {
    data,
    analytics,
    saveArticle,
    deleteArticle,
    restoreArticle,
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
    saveTag,
    deleteTag,
    saveMedia,
    bulkAddMedia,
    replaceMedia,
    deleteMedia,
    updateCommentStatus,
    resetDemoData,
  } = cms;

  const [activeTab, setActiveTab] = useState("overview");

  // Article editor state
  const [articleDraft, setArticleDraft] = useState(() =>
    createArticleDraft(data.categories)
  );

  // Other draft states (legacy modules)
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
  const [tagDraft, setTagDraft] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#426c67",
  });
  const [mediaDraft, setMediaDraft] = useState({
    name: "",
    fileName: "",
    type: "image",
    url: "",
    folder: "Uploads",
    alt: "",
    size: "",
    provider: "local",
  });

  // Sorted articles (latest first)
  const sortedArticles = useMemo(
    () =>
      [...data.articles].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      ),
    [data.articles]
  );

  // Article save handler — async, updates draft after save
  const handleArticleSave = async (draft) => {
    try {
      const saved = await saveArticle(draft);
      if (saved && !draft.id && !draft._id) {
        setArticleDraft(createArticleDraft(data.categories));
      } else if (saved) {
        setArticleDraft({ ...saved, id: saved._id || saved.id });
      }
    } catch (err) {
      console.error("Article save failed:", err);
    }
  };

  // Legacy save-and-clear helpers
  const saveAndClearProject = () => {
    saveProject(projectDraft);
    setProjectDraft({ title: "", category: "", description: "", image: "", status: "Draft" });
  };
  const saveAndClearSkill = () => {
    saveSkill(skillDraft);
    setSkillDraft({ name: "", level: 50 });
  };
  const saveAndClearTimeline = () => {
    saveTimelineItem(timelineDraft);
    setTimelineDraft({ year: new Date().getFullYear(), title: "", description: "" });
  };
  const saveAndClearCategory = () => {
    saveCategory(categoryDraft);
    setCategoryDraft({ name: "", slug: "", description: "", longDescription: "", subcategories: "", heroImage: "", icon: "book" });
  };
  const saveAndClearTag = () => {
    saveTag(tagDraft);
    setTagDraft({ name: "", slug: "", description: "", color: "#426c67" });
  };

  // Render the active tab content
  const renderContent = () => {
    switch (activeTab) {
      // ── Phase 4A ───────────────────────────────────────────────
      case "overview":
        return (
          <DashboardOverview
            analytics={analytics}
            articles={data.articles}
          />
        );

      case "articles":
        return (
          <ArticleModule
            articleDraft={articleDraft}
            categories={data.categories}
            onChange={setArticleDraft}
            onNew={() => setArticleDraft(createArticleDraft(data.categories))}
            onSave={handleArticleSave}
            onDelete={deleteArticle}
            onRestore={restoreArticle}
            onSelectArticle={(article) =>
              setArticleDraft({ ...article, id: article._id || article.id })
            }
            onToggleStatus={toggleArticleStatus}
            articles={sortedArticles}
          />
        );

      case "categories":
        return <CategoryModule />;

      case "subcategories":
        return <SubCategoryModule />;

      case "tags":
        return <TagModule />;

      case "media":
        return <MediaLibraryModule />;

      case "comments":
        return <CommentModule />;

      case "users":
        return <UserModule />;

      case "roles":
        return <RoleModule />;

      case "permissions":
        return <PermissionModule />;

      case "profile":
        return <ProfileModule />;

      case "logs":
        return <ActivityLogModule />;

      case "hero":
      case "quotes":
        return <HomepageModule />;

      case "navigation":
        return <NavigationModule />;

      case "footer":
        return <FooterModule />;

      case "testimonials":
        return <TestimonialModule />;

      case "gallery":
        return <GalleryModule />;

      case "newsletters":
        return <NewsletterModule />;

      case "contact":
        return <ContactModule />;

      case "backups":
        return <BackupModule />;

      case "settings":
        return <SiteSettingsModule />;

      case "projects":
        return (
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
        );

      case "skills":
        return (
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
        );

      case "timeline":
        return (
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
        );

      // ── Modules pending full migration — show professional placeholder ──
      default:
        return MODULE_REGISTRY[activeTab]
          ? <ModulePlaceholder tabId={activeTab} />
          : (
            <div className="cms-panel">
              <p className="empty-state">Unknown module: {activeTab}</p>
            </div>
          );
    }
  };

  // Resolve header title from the active navigation item
  const allNavItems = [
    { id: "overview", label: "Dashboard" },
    { id: "articles", label: "Articles" },
    { id: "categories", label: "Categories" },
    { id: "subcategories", label: "Sub Categories" },
    { id: "tags", label: "Tags" },
    { id: "media", label: "Media Library" },
    { id: "comments", label: "Comments" },
    { id: "users", label: "Users" },
    { id: "roles", label: "Roles" },
    { id: "permissions", label: "Permissions" },
    { id: "analytics", label: "Analytics" },
    { id: "seo", label: "SEO" },
    { id: "settings", label: "Settings" },
    { id: "navigation", label: "Navigation Menu" },
    { id: "footer", label: "Footer" },
    { id: "hero", label: "Homepage" },
    { id: "testimonials", label: "Testimonials" },
    { id: "quotes", label: "Quotes" },
    { id: "gallery", label: "Gallery" },
    { id: "timeline", label: "Timeline" },
    { id: "projects", label: "Projects" },
    { id: "newsletters", label: "Newsletters" },
    { id: "contact", label: "Contact Messages" },
    { id: "backups", label: "Backups" },
    { id: "logs", label: "Logs" },
    { id: "profile", label: "Profile" },
    { id: "skills", label: "Skills" },
  ];
  const activeItem = allNavItems.find((i) => i.id === activeTab);

  return (
    <CmsLayout
      brand="MyJourney"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerKicker="Content management system"
      title={activeItem?.label || "Manage MyJourney"}
      actions={
        <>
          <span>{analytics.articleCount} articles</span>
          <span>{analytics.subscribers} subscribers</span>
        </>
      }
    >
      {renderContent()}
    </CmsLayout>
  );
};

export default AdminDashboard;
