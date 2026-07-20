import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  FiBold,
  FiClock,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiFile,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiSettings,
  FiSliders,
  FiChevronLeft,
  FiChevronRight,
  FiCopy
} from "react-icons/fi";
import { mediaApi } from "../../services/apiService";
import { useCms } from "../../context/CmsContext";
import { useBlocker } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const calculateReadingTime = (html) => {
  const text = html ? html.replace(/<[^>]*>/g, "") : "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

const getWordCount = (html) => {
  const text = html ? html.replace(/<[^>]*>/g, "") : "";
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Markdown simple converter for pasting
const convertMarkdownToHtml = (markdown) => {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold & Italic
  html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>");
  html = html.replace(/\*(.*)\*/gim, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Horizontal Rules
  html = html.replace(/^---$/gim, "<hr />");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');

  // Convert newlines to paragraphs
  html = html.split(/\n\n+/).map(p => {
    if (p.trim().startsWith("<h") || p.trim().startsWith("<bl") || p.trim().startsWith("<hr")) {
      return p;
    }
    return `<p>${p.replace(/\n/g, "<br />")}</p>`;
  }).join("");

  return html;
};

const createArticleDraft = (categories = []) => ({
  title: "",
  slug: "",
  description: "",
  category: categories[0]?.name || "Uncategorized",
  subcategory: "",
  body: "<p>Write your story here...</p>",
  status: "draft",
  tags: [],
  isFeatured: false,
  isMustRead: false,
  isTrending: false,
  isPinned: false,
  readingTimeMin: 1,
  seo: {
    title: "",
    description: "",
    keywords: [],
    metaRobots: "index,follow",
  },
});

const ArticleModule = () => {
  const {
    data,
    saveArticle,
    deleteArticle,
    restoreArticle,
    toggleArticleStatus
  } = useCms();

  const categories = data?.categories || [];
  const articles = data?.articles || [];

  // Sorted articles (latest first)
  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      ),
    [articles]
  );

  const defaultDraft = useMemo(() => createArticleDraft(categories), [categories]);

  const [articleDraft, setArticleDraft] = useState(defaultDraft);

  // Editor save/sync states (declared before use in handlers)
  const [saveStatus, setSaveStatus] = useState("Unsaved"); // "Unsaved" | "Saving..." | "Draft Saved" | "Published Successfully" | "Saved" | "Save Failed"
  const [lastSavedTime, setLastSavedTime] = useState("");
  const lastSavedDraftRef = useRef(JSON.stringify(defaultDraft));

  const onChange = setArticleDraft;
  const onNew = () => {
    const fresh = createArticleDraft(categories);
    setArticleDraft(fresh);
    lastSavedDraftRef.current = JSON.stringify(fresh);
    setSaveStatus("Unsaved");
  };
  const onSave = async (draft) => {
    try {
      const saved = await saveArticle(draft);
      if (saved) {
        const normalized = {
          ...saved,
          id: saved._id || saved.id,
          featured: saved.featured !== undefined ? saved.featured : saved.isFeatured,
          mustRead: saved.mustRead !== undefined ? saved.mustRead : saved.isMustRead,
          trending: saved.trending !== undefined ? saved.trending : saved.isTrending,
          pinned: saved.pinned !== undefined ? saved.pinned : saved.isPinned,
        };
        setArticleDraft(normalized);
        lastSavedDraftRef.current = JSON.stringify(normalized);
        return normalized;
      }
    } catch (err) {
      console.error("Article save failed:", err);
      throw err;
    }
  };
  const onDelete = deleteArticle;
  const onRestore = restoreArticle;
  const onSelectArticle = (article) => {
    const normalized = {
      ...article,
      id: article._id || article.id,
      featured: article.featured !== undefined ? article.featured : article.isFeatured,
      mustRead: article.mustRead !== undefined ? article.mustRead : article.isMustRead,
      trending: article.trending !== undefined ? article.trending : article.isTrending,
      pinned: article.pinned !== undefined ? article.pinned : article.isPinned,
    };
    setArticleDraft(normalized);
    lastSavedDraftRef.current = JSON.stringify(normalized);
    setSaveStatus("Saved");
  };
  const onToggleStatus = toggleArticleStatus;

  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Pagination, search, and filtering states
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editorMode, setEditorMode] = useState("edit"); // "edit" | "preview"

  // Undo/Redo stacks
  const [history, setHistory] = useState([articleDraft?.body || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const typingTimeoutRef = useRef(null);

  // Word & Reading metrics
  const wordCount = useMemo(() => getWordCount(articleDraft.body), [articleDraft.body]);
  const readingTime = useMemo(() => calculateReadingTime(articleDraft.body), [articleDraft.body]);

  // Push history helper
  const pushHistory = (newBody) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newBody);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevBody = history[prevIndex];
      onChange({ ...articleDraft, body: prevBody });
      if (editorRef.current) editorRef.current.innerHTML = prevBody;
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextBody = history[nextIndex];
      onChange({ ...articleDraft, body: nextBody });
      if (editorRef.current) editorRef.current.innerHTML = nextBody;
    }
  };

  // Keyboard Shortcuts handler
  const handleKeyDown = (e) => {
    // Save: Ctrl + S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      triggerManualSave();
    }
    // Undo: Ctrl + Z
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      handleUndo();
    }
    // Redo: Ctrl + Y
    if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      handleRedo();
    }
    // Space or Enter: push history immediately
    if (e.key === " " || e.key === "Enter") {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const html = editorRef.current?.innerHTML || "";
      if (history[historyIndex] !== html) {
        pushHistory(html);
      }
    }
  };

  const handleEditorInput = (e) => {
    const html = e.target.innerHTML;
    onChange({ ...articleDraft, body: html });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (history[historyIndex] !== html) {
        pushHistory(html);
      }
    }, 800);
  };

  // Drag & drop file uploads helper
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadAndInsertImage(files[0]);
    }
  };

  const uploadAndInsertImage = async (file) => {
    try {
      setSaveStatus("Saving...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "Uploads");

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.media && data.media.url) {
        const nextBody = `${editorRef.current.innerHTML}<p><img src="${data.media.url}" alt="${data.media.name}" /></p>`;
        editorRef.current.innerHTML = nextBody;
        const nextDraft = { ...articleDraft, body: nextBody };
        onChange(nextDraft);
        pushHistory(nextBody);
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Save Failed");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setSaveStatus("Save Failed");
    }
  };

  // Paste Markdown conversion support
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text/plain");
    const isMarkdown = /^#|^\*|^\>|\[.*?\]\(.*?\)/m.test(text);

    if (isMarkdown) {
      e.preventDefault();
      const html = convertMarkdownToHtml(text);
      document.execCommand("insertHTML", false, html);
      const nextBody = editorRef.current.innerHTML;
      onChange({ ...articleDraft, body: nextBody });
      pushHistory(nextBody);
    }
  };

  const update = (patch) => {
    const nextDraft = { ...articleDraft, ...patch };
    // Auto-generate slug if title changes and slug is empty or matched previous title slug
    if (patch.title !== undefined) {
      const prevAutoSlug = slugify(articleDraft.title || "");
      if (!articleDraft.slug || articleDraft.slug === prevAutoSlug) {
        nextDraft.slug = slugify(patch.title);
      }
    }
    onChange(nextDraft);
  };

  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    const nextBody = editorRef.current?.innerHTML || "";
    onChange({ ...articleDraft, body: nextBody });
    pushHistory(nextBody);
  };

  const insertLink = () => {
    const url = window.prompt("Paste the link URL:");
    if (url) {
      runCommand("createLink", url);
    }
  };

  const triggerManualSave = async () => {
    if (!articleDraft.title || !articleDraft.title.trim()) {
      alert("Please enter a title before saving the article.");
      return;
    }
    setSaveStatus("Saving...");
    try {
      // Auto-recalculate reading time
      const finalDraft = {
        ...articleDraft,
        readingTime: calculateReadingTime(articleDraft.body)
      };
      
      const savedObj = await onSave(finalDraft);
      const nextStatus = finalDraft.status === "published" ? "Published Successfully" : "Draft Saved";
      setSaveStatus(nextStatus);
      setLastSavedTime(new Date().toLocaleTimeString());
      
      setTimeout(() => {
        setSaveStatus("Saved");
      }, 3000);
    } catch (err) {
      setSaveStatus("Save Failed");
    }
  };

  const isModified = useMemo(() => {
    if (!articleDraft) return false;
    return JSON.stringify(articleDraft) !== lastSavedDraftRef.current;
  }, [articleDraft]);

  // Prompt before reloading or closing the tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isModified) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Leave without saving?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isModified]);

  // Prompt before navigating away via React Router
  const blocker = useBlocker(
    useCallback(
      ({ nextLocation }) => {
        return isModified;
      },
      [isModified]
    )
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm("You have unsaved changes. Leave without saving?");
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Sync editor innerHTML on draft switch
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== articleDraft.body) {
      editorRef.current.innerHTML = articleDraft.body || "";
      setHistory([articleDraft.body || ""]);
      setHistoryIndex(0);
      lastSavedDraftRef.current = JSON.stringify(articleDraft);
      setSaveStatus("Saved");
    }
  }, [articleDraft.id, articleDraft._id]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((art) => {
      const matchQuery = !q || [art.title, art.description, art.slug].join(" ").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || String(art.category).toLowerCase() === filterCategory.toLowerCase();
      const matchStatus = filterStatus === "all" || String(art.status).toLowerCase() === filterStatus.toLowerCase();
      return matchQuery && matchCat && matchStatus;
    });
  }, [articles, query, filterCategory, filterStatus]);

  // Paginated articles
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;

  const handleDuplicate = async (article) => {
    const clone = {
      ...article,
      title: `Copy of ${article.title}`,
      slug: `${article.slug}-copy`,
      id: undefined,
      _id: undefined,
      status: "draft",
      views: 0,
      likes: 0,
      bookmarks: 0
    };
    onSelectArticle(clone);
  };

  const hasId = Boolean(articleDraft.id || articleDraft._id);
  const isPublished = articleDraft.status === "published";
  const isSaving = saveStatus === "Saving...";

  let buttonText = "Save Draft";
  if (isPublished) {
    buttonText = hasId ? "Update Published" : "Publish";
  } else {
    buttonText = "Save Draft";
  }

  if (isSaving) {
    buttonText = "Saving...";
  } else if (saveStatus === "Draft Saved") {
    buttonText = "✓ Draft Saved";
  } else if (saveStatus === "Published Successfully") {
    buttonText = "✓ Published Successfully";
  }

  return (
    <div className="cms-grid-two article-editor-layout">
      {/* LEFT PANEL: Editor & Form */}
      <div className="cms-panel wide">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Rich text editor</span>
            <h2>{articleDraft.id || articleDraft._id ? "Edit Article" : "Create Article"}</h2>
          </div>
          <div className="inline-actions">
            <button className="small-outline-btn" type="button" onClick={onNew}>
              <FiPlus /> New
            </button>
            <button
              className="small-solid-btn"
              type="button"
              onClick={triggerManualSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <FiRefreshCw className="spin-animation" style={{ marginRight: "0.25rem" }} />
              ) : (saveStatus === "Draft Saved" || saveStatus === "Published Successfully") ? (
                <span style={{ marginRight: "0.25rem" }}>✓</span>
              ) : (
                <FiSave style={{ marginRight: "0.25rem" }} />
              )}
              {buttonText}
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="form-grid">
          <label>
            Title
            <input
              value={articleDraft.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Article title"
            />
          </label>
          <label>
            Slug
            <input
              value={articleDraft.slug || ""}
              onChange={(e) => update({ slug: e.target.value })}
              placeholder="auto-generated-slug"
            />
          </label>
          <label className="span-two">
            Description
            <textarea
              value={articleDraft.description || ""}
              onChange={(e) => update({ description: e.target.value })}
              rows="2"
              placeholder="Excerpt or summary..."
            ></textarea>
          </label>

          <label>
            Category
            <select
              value={articleDraft.category || ""}
              onChange={(e) => {
                const cat = categories.find(c => c.name === e.target.value);
                update({
                  category: e.target.value,
                  categoryId: cat?.id || cat?._id || "",
                  subcategory: cat?.subcategories?.[0] || ""
                });
              }}
            >
              {categories.map((c) => (
                <option value={c.name} key={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subcategory
            <select
              value={articleDraft.subcategory || ""}
              onChange={(e) => update({ subcategory: e.target.value })}
            >
              {categories
                .find((c) => c.name === articleDraft.category)
                ?.subcategories?.map((sub) => (
                  <option value={sub} key={sub}>
                    {sub}
                  </option>
                )) || <option value="">None</option>}
            </select>
          </label>
        </div>

        {/* WYSIWYG Toolbar */}
        <div className="rich-editor-toolbar" style={{ marginTop: "1.5rem" }}>
          <button type="button" onClick={() => runCommand("bold")} title="Bold"><FiBold /></button>
          <button type="button" onClick={() => runCommand("italic")} title="Italic"><FiItalic /></button>
          <button type="button" onClick={() => runCommand("insertUnorderedList")} title="Bullet List"><FiList /></button>
          <button type="button" onClick={insertLink} title="Insert Link"><FiLink /></button>
          <button type="button" onClick={() => imageInputRef.current?.click()} title="Insert Image"><FiImage /></button>
          <button type="button" onClick={handleUndo} title="Undo">Undo</button>
          <button type="button" onClick={handleRedo} title="Redo">Redo</button>

          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#666" }}>
            {saveStatus === "Saving..." && <span style={{ color: "orange" }}>Saving...</span>}
            {saveStatus === "Saved" && <span style={{ color: "green" }}>Saved {lastSavedTime && `at ${lastSavedTime}`}</span>}
            {saveStatus === "Save Failed" && <span style={{ color: "red" }}>Save Failed</span>}
          </span>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              if (e.target.files?.length) {
                await uploadAndInsertImage(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* Text Area Contenteditable */}
        <div
          ref={editorRef}
          className="rich-text-editor-workspace"
          contentEditable
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          onInput={handleEditorInput}
          style={{
            minHeight: "350px",
            border: "1px solid #ccc",
            padding: "1rem",
            marginTop: "0.5rem",
            outline: "none",
            borderRadius: "4px",
            backgroundColor: "#fff"
          }}
        ></div>

        <div className="editor-stats-row" style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.8rem", color: "#666" }}>
          <span>Words: {wordCount}</span>
          <span>Reading Time: {readingTime}</span>
        </div>

        {/* SEO Metadata Form */}
        <div className="cms-panel" style={{ marginTop: "2rem", padding: "1.5rem" }}>
          <div className="cms-panel-heading" style={{ marginBottom: "1rem" }}>
            <div>
              <span className="section-kicker">SEO & Discovery</span>
              <h2>Meta Configurations</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              SEO Title
              <input
                value={articleDraft.seo?.title || ""}
                onChange={(e) => update({ seo: { ...(articleDraft.seo || {}), title: e.target.value } })}
                placeholder="Meta title"
              />
            </label>
            <label>
              Meta Description
              <textarea
                value={articleDraft.seo?.description || ""}
                onChange={(e) => update({ seo: { ...(articleDraft.seo || {}), description: e.target.value } })}
                placeholder="Meta description excerpt..."
                rows="2"
              />
            </label>
            <label>
              Keywords (comma-separated)
              <input
                value={Array.isArray(articleDraft.seo?.keywords) ? articleDraft.seo.keywords.join(", ") : ""}
                onChange={(e) => update({ seo: { ...(articleDraft.seo || {}), keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) } })}
                placeholder="seo, article, keyword"
              />
            </label>
            <label>
              Meta Robots Directives
              <select
                value={articleDraft.seo?.metaRobots || "index,follow"}
                onChange={(e) => update({ seo: { ...(articleDraft.seo || {}), metaRobots: e.target.value } })}
              >
                <option value="index,follow">Index, Follow</option>
                <option value="noindex,follow">No-Index, Follow</option>
                <option value="index,nofollow">Index, No-Follow</option>
                <option value="noindex,nofollow">No-Index, No-Follow</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Sidebar Settings & Articles Registry */}
      <div className="cms-sidebar-control" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Settings Panel */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <h2>Article Flags</h2>
          </div>
          <div className="form-grid one" style={{ padding: "0.5rem" }}>
            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(articleDraft.featured)}
                onChange={(e) => update({ featured: e.target.checked })}
              />
              Featured Article
            </label>
            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(articleDraft.mustRead)}
                onChange={(e) => update({ mustRead: e.target.checked })}
              />
              Must Read Flag
            </label>
            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(articleDraft.trending)}
                onChange={(e) => update({ trending: e.target.checked })}
              />
              Trending
            </label>
            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(articleDraft.pinned)}
                onChange={(e) => update({ pinned: e.target.checked })}
              />
              Pinned
            </label>
            <label>
              Publishing Status
              <select
                value={articleDraft.status || "draft"}
                onChange={(e) => update({ status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            {articleDraft.status === "scheduled" && (
              <label>
                Scheduled Publication Date
                <input
                  type="datetime-local"
                  value={articleDraft.scheduledAt ? new Date(articleDraft.scheduledAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => update({ scheduledAt: e.target.value })}
                />
              </label>
            )}
          </div>
        </div>

        {/* Registry Listing */}
        <div className="cms-panel">
          <div className="cms-panel-heading">
            <div>
              <span className="section-kicker">Database registry</span>
              <h2>Articles ({filteredArticles.length})</h2>
            </div>
          </div>

          {/* Search & Filters */}
          <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label className="cms-search-control" style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid #ccc", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
              <FiSearch />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search registry"
                style={{ border: "none", outline: "none", width: "100%" }}
              />
            </label>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, padding: "0.25rem" }}
              >
                <option value="all">All Cats</option>
                {categories.map((c) => (
                  <option value={c.name} key={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, padding: "0.25rem" }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="tag-list" style={{ marginTop: "1rem" }}>
            {paginatedArticles.map((art) => (
              <article key={art.id || art._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: "1px solid #eee" }}>
                <button
                  type="button"
                  onClick={() => onSelectArticle(art)}
                  style={{ textAlign: "left", flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column" }}
                >
                  <strong>{art.title}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    {art.category} • <span className={`status-pill ${art.status}`} style={{ display: "inline-block", padding: "0 4px", borderRadius: "3px", fontSize: "0.7rem" }}>{art.status}</span>
                  </span>
                </button>

                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button type="button" onClick={() => handleDuplicate(art)} title="Duplicate" style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <FiCopy />
                  </button>
                  {art.isDeleted ? (
                    <button type="button" onClick={() => onRestore(art.id || art._id)} title="Restore" style={{ background: "none", border: "none", cursor: "pointer", color: "green" }}>
                      <FiRefreshCw />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onDelete(art.id || art._id)} title="Soft Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}>
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </article>
            ))}
            {paginatedArticles.length === 0 && <p className="empty-state">No articles found.</p>}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem", padding: "0.5rem" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <FiChevronLeft />
              </button>
              <span style={{ fontSize: "0.85rem" }}>{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleModule;
