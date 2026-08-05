import React, { useState, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiFolder,
  FiInfo,
  FiFileText,
  FiGrid,
  FiAlertCircle,
  FiSave,
  FiZap,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";
import apiService from "../../services/apiService";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoryModule() {
  const { data, saveCategory, deleteCategory, restoreCategory } = useCms();
  const { categories = [], subcategories = [], articles = [] } = data;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State — Core
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [icon, setIcon] = useState('book');
  const [heroImage, setHeroImage] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [sortOrder, setSortOrderField] = useState(0);

  // Lifecycle & Visibility
  const [status, setStatus] = useState('published');
  const [isActive, setIsActive] = useState(true);
  const [visibility, setVisibility] = useState('public');
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [showInNavigation, setShowInNavigation] = useState(true);
  const [showInFooter, setShowInFooter] = useState(false);
  const [showInSearch, setShowInSearch] = useState(true);
  const [includeInSitemap, setIncludeInSitemap] = useState(true);
  const [allowArticles, setAllowArticles] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // UI Filters / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, created, articles
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle auto slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!categoryId) {
      setSlug(slugify(val));
    }
  };

  // Validations
  const validateForm = () => {
    if (!name.trim()) {
      setError("Category Name is required.");
      return false;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return false;
    }

    // Check for duplicate name/slug (excluding current editing category)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicateName = categories.some(
      (c) => c.name.toLowerCase() === normalizedName && c.id !== categoryId && c._id !== categoryId
    );
    if (isDuplicateName) {
      setError("A category with this name already exists.");
      return false;
    }

    const isDuplicateSlug = categories.some(
      (c) => c.slug === slug && c.id !== categoryId && c._id !== categoryId
    );
    if (isDuplicateSlug) {
      setError("A category with this slug already exists.");
      return false;
    }

    if (name.length > 50) {
      setError("Category name cannot exceed 50 characters.");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setCategoryId('');
    setName('');
    setSlug('');
    setDescription('');
    setLongDescription('');
    setIcon('book');
    setHeroImage('');
    setAccentColor('');
    setSortOrderField(0);
    setStatus('published');
    setIsActive(true);
    setVisibility('public');
    setShowOnHomepage(true);
    setShowInNavigation(true);
    setShowInFooter(false);
    setShowInSearch(true);
    setIncludeInSitemap(true);
    setAllowArticles(true);
    setAllowComments(true);
    setIsFeatured(false);
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setError('');
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      await saveCategory({
        id: categoryId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        longDescription: longDescription.trim(),
        icon,
        heroImage: heroImage.trim(),
        accentColor: accentColor.trim(),
        sortOrder: Number(sortOrder) || 0,
        isFeatured,
        status,
        isActive,
        visibility,
        showOnHomepage,
        showInNavigation,
        showInFooter,
        showInSearch,
        includeInSitemap,
        allowArticles,
        allowComments,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        seoKeywords: seoKeywords ? seoKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      });
      setSuccess(categoryId ? "Category updated successfully!" : "Category created successfully!");
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click
  const handleEdit = (cat) => {
    setError('');
    setSuccess('');
    setCategoryId(cat.id || cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setLongDescription(cat.longDescription || '');
    setIcon(cat.icon || 'book');
    setHeroImage(cat.heroImage || '');
    setAccentColor(cat.accentColor || '');
    setSortOrderField(cat.sortOrder || 0);
    setStatus(cat.status || 'published');
    setIsActive(cat.isActive !== false);
    setVisibility(cat.visibility || 'public');
    setShowOnHomepage(cat.showOnHomepage !== false);
    setShowInNavigation(cat.showInNavigation !== false);
    setShowInFooter(Boolean(cat.showInFooter));
    setShowInSearch(cat.showInSearch !== false);
    setIncludeInSitemap(cat.includeInSitemap !== false);
    setAllowArticles(cat.allowArticles !== false);
    setAllowComments(cat.allowComments !== false);
    setIsFeatured(Boolean(cat.isFeatured));
    setSeoTitle(cat.seoTitle || '');
    setSeoDescription(cat.seoDescription || '');
    setSeoKeywords(Array.isArray(cat.seoKeywords) ? cat.seoKeywords.join(', ') : (cat.seoKeywords || ''));
  };

  // Handle Delete
  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await deleteCategory(id);
      setSuccess("Category deleted successfully.");
      if (categoryId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Restore
  const handleRestore = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to restore the category "${catName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await restoreCategory(id);
      setSuccess("Category restored successfully.");
    } catch (err) {
      setError(err.message || "Failed to restore category.");
    } finally {
      setLoading(false);
    }
  };

  // Counts helper
  const getStats = (cat) => {
    const catName = cat.name.toLowerCase();
    const articleCount = articles.filter(
      (a) => a.category && a.category.toLowerCase() === catName
    ).length;

    const subCount = subcategories.filter(
      (s) => s.category && (s.category.name?.toLowerCase() === catName || s.category === cat.id || s.category === cat._id)
    ).length;

    return { articleCount, subCount };
  };

  // Filtered & Sorted Categories
  const processedCategories = useMemo(() => {
    let list = [...categories];

    // Filter deleted
    if (!showDeleted) {
      list = list.filter((c) => !c.isDeleted);
    } else {
      list = list.filter((c) => c.isDeleted);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "created") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "articles") {
        return getStats(b).articleCount - getStats(a).articleCount;
      }
      return 0;
    });

    return list;
  }, [categories, searchQuery, sortBy, subcategories, articles]);

  // Pagination
  const totalPages = Math.ceil(processedCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedCategories.slice(start, start + itemsPerPage);
  }, [processedCategories, currentPage]);

  return (
    <div className="cms-grid-two">
      {/* LEFT: Category Form */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Taxonomy</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{categoryId ? "Edit Category" : "Create Category"}</h2>
              {name && (
                <button
                  type="button"
                  className="small-outline-btn"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await apiService.post('/api/ai/category', { categoryName: name, currentDescription: description });
                      if (res?.data?.content) {
                        const parsed = typeof res.data.content === 'string' ? JSON.parse(res.data.content) : res.data.content;
                        if (parsed.description) setDescription(parsed.description);
                        if (parsed.seoDescription) setLongDescription(parsed.seoDescription);
                        if (parsed.suggestedIcon) setIcon(parsed.suggestedIcon);
                        setSuccess('✨ AI Auto-generated category metadata!');
                      }
                    } catch (err) {
                      setError('AI generation failed: ' + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FiZap style={{ color: 'var(--cms-accent)' }} /> AI Auto-Fill
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="status-message error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <FiAlertCircle /> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="status-message success" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--cms-accent, #426c67)" }}>
            <FiInfo /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="form-grid one">
          <label>
            Category Name *
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Life, Tech, Travel"
              disabled={loading}
              maxLength={50}
              required
            />
          </label>

          <label>
            Slug *
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="category-slug"
              disabled={loading}
              required
            />
          </label>

          <label>
            Icon Key
            <select value={icon} onChange={(e) => setIcon(e.target.value)} disabled={loading}>
              <option value="book">Book</option>
              <option value="heart">Heart</option>
              <option value="feather">Feather</option>
              <option value="award">Award</option>
              <option value="send">Send</option>
              <option value="grid">Grid</option>
              <option value="image">Image</option>
              <option value="star">Star</option>
              <option value="briefcase">Briefcase</option>
            </select>
          </label>

          <label>
            Hero Image URL
            <input
              type="text"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              disabled={loading}
            />
          </label>

          <label>
            Short Description
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary for listings"
              disabled={loading}
              maxLength={200}
            />
          </label>

          <label>
            Long Description (Category Page)
            <textarea
              rows="5"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Detailed content for the category detail view"
              disabled={loading}
            />
          </label>

          {/* ═══════ LIFECYCLE CONTROL PANEL ══════════════════════════════ */}
          <div style={{ border: '2px solid var(--line, #e4ded4)', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>

            {/* Header */}
            <div style={{ background: 'var(--cms-accent, #426c67)', color: '#fff', padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Lifecycle &amp; Visibility Controls
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Status */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 100 }}>Status</span>
                {['draft', 'published', 'archived'].map((s) => (
                  <button
                    key={s} type="button" disabled={loading}
                    onClick={() => setStatus(s)}
                    style={{
                      padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: '2px solid',
                      borderColor: status === s ? (s === 'published' ? '#10b981' : s === 'archived' ? '#6b7280' : '#f59e0b') : '#e4ded4',
                      background: status === s ? (s === 'published' ? '#d1fae5' : s === 'archived' ? '#f3f4f6' : '#fef3c7') : 'transparent',
                      color: status === s ? (s === 'published' ? '#065f46' : s === 'archived' ? '#374151' : '#92400e') : '#888',
                    }}
                  >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              {/* Quick Active Toggle */}
              <div
                onClick={() => !loading && setIsActive((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isActive ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1.5px solid ${isActive ? '#86efac' : '#fca5a5'}`, cursor: loading ? 'not-allowed' : 'pointer', userSelect: 'none' }}
              >
                <div style={{ width: 40, height: 22, borderRadius: 11, background: isActive ? '#10b981' : '#ef4444', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isActive ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#065f46' : '#991b1b' }}>
                    {isActive ? '✅ Active' : '🔴 Inactive'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    {isActive ? 'Category is visible on configured surfaces' : 'Category is hidden from all public surfaces — articles are preserved'}
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 100 }}>Visibility</span>
                {[{ v: 'public', label: 'Public', color: '#10b981' }, { v: 'unlisted', label: 'Unlisted', color: '#f59e0b' }, { v: 'private', label: 'Private', color: '#ef4444' }].map(({ v, label, color }) => (
                  <button
                    key={v} type="button" disabled={loading}
                    onClick={() => setVisibility(v)}
                    style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: `2px solid ${visibility === v ? color : '#e4ded4'}`, background: visibility === v ? `${color}22` : 'transparent', color: visibility === v ? color : '#888' }}
                  >{label}</button>
                ))}
              </div>

              {/* Surface Controls */}
              <div style={{ background: '#f8f7f5', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Surface Controls</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    { label: '🏠 Show on Homepage', val: showOnHomepage, set: setShowOnHomepage },
                    { label: '🔗 Show in Navigation', val: showInNavigation, set: setShowInNavigation },
                    { label: '🦶 Show in Footer', val: showInFooter, set: setShowInFooter },
                    { label: '🔍 Show in Search', val: showInSearch, set: setShowInSearch },
                    { label: '🗺️ Include in Sitemap', val: includeInSitemap, set: setIncludeInSitemap },
                    { label: '⭐ Featured Category', val: isFeatured, set: setIsFeatured },
                  ].map(({ label, val, set }) => (
                    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500 }}>
                      <div
                        onClick={() => !loading && set((v) => !v)}
                        style={{ width: 32, height: 18, borderRadius: 9, background: val ? '#10b981' : '#ccc', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                      >
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: val ? 17 : 3, transition: 'left 0.2s' }} />
                      </div>
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Content Rules */}
              <div style={{ background: '#f8f7f5', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Content Rules</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: '📝 Allow Articles', val: allowArticles, set: setAllowArticles },
                    { label: '💬 Allow Comments', val: allowComments, set: setAllowComments },
                  ].map(({ label, val, set }) => (
                    <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500 }}>
                      <div
                        onClick={() => !loading && set((v) => !v)}
                        style={{ width: 32, height: 18, borderRadius: 9, background: val ? '#10b981' : '#ccc', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                      >
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: val ? 17 : 3, transition: 'left 0.2s' }} />
                      </div>
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Order & Accent Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                  Sort Order
                  <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrderField(e.target.value)} disabled={loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.9rem' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                  Accent Color
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={accentColor || '#426c67'} onChange={(e) => setAccentColor(e.target.value)} disabled={loading} style={{ width: 40, height: 36, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#426c67" disabled={loading} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }} />
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* ═══════ SEO PANEL ════════════════════════════════════════════════ */}
          <div style={{ border: '1.5px solid var(--line, #e4ded4)', borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ background: '#f3f4f6', padding: '8px 16px', fontWeight: 700, fontSize: '0.8rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SEO Metadata
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                SEO Title
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Optimized page title (leave blank to use category name)" disabled={loading} maxLength={70} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                Meta Description
                <textarea rows="2" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="160-character meta description for search engines" disabled={loading} maxLength={160} style={{ resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', fontWeight: 600 }}>
                Keywords <span style={{ fontWeight: 400, color: '#888' }}>(comma-separated)</span>
                <input type="text" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="lessons, learning, self-improvement" disabled={loading} />
              </label>
            </div>
          </div>

          <div className="inline-actions" style={{ marginTop: "1rem" }}>
            <button className="small-solid-btn" type="submit" disabled={loading}>
              <FiSave /> {categoryId ? "Update Category" : "Save Category"}
            </button>
            {(categoryId || name || slug) && (
              <button
                className="small-outline-btn"
                type="button"
                onClick={resetForm}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: Categories List */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Manage</span>
            <h2>Categories List</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="media-filter-grid" style={{ marginBottom: "1rem", gap: "0.5rem" }}>
          <label className="cms-search-control" style={{ flex: 1 }}>
            <FiSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search categories..."
            />
          </label>

          <label style={{ minWidth: "140px" }}>
            Sort By
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="created">Newly Created</option>
              <option value="articles">Article Count</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", minWidth: "110px", fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1);
              }}
            />
            Show Deleted
          </label>
        </div>

        {/* Categories List */}
        <div className="compact-list editable" style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
          {paginatedCategories.map((cat) => {
            const { articleCount, subCount } = getStats(cat);
            const isEditing = categoryId === (cat.id || cat._id);

            return (
              <div
                key={cat.id || cat._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: isEditing ? "1px solid var(--cms-accent, #426c67)" : "1px solid #eee",
                  backgroundColor: isEditing ? "#f0f6f5" : "transparent",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FiFolder style={{ color: cat.isDeleted ? "#aaa" : "var(--cms-accent, #426c67)" }} />
                    <strong style={{ fontSize: "0.95rem", textDecoration: cat.isDeleted ? "line-through" : "none", color: cat.isDeleted ? "#888" : "inherit" }}>{cat.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#888", backgroundColor: "#f5f5f5", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                      /{cat.slug}
                    </span>
                    {cat.isDeleted && (
                      <span style={{ fontSize: '0.7rem', color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '600', border: '1px solid #fed7d7' }}>
                        Deleted
                      </span>
                    )}
                    {!cat.isDeleted && cat.isActive === false && (
                      <span style={{ fontSize: '0.7rem', color: '#991b1b', backgroundColor: '#fef2f2', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 600, border: '1px solid #fca5a5' }}>
                        Inactive
                      </span>
                    )}
                    {!cat.isDeleted && cat.status && cat.status !== 'published' && (
                      <span style={{ fontSize: '0.7rem', color: cat.status === 'draft' ? '#92400e' : '#374151', backgroundColor: cat.status === 'draft' ? '#fef3c7' : '#f3f4f6', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 600, border: `1px solid ${cat.status === 'draft' ? '#fde68a' : '#d1d5db'}` }}>
                        {cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}
                      </span>
                    )}
                    {cat.visibility === 'unlisted' && (
                      <span style={{ fontSize: '0.7rem', color: '#92400e', backgroundColor: '#fffbeb', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>Unlisted</span>
                    )}
                    {cat.visibility === 'private' && (
                      <span style={{ fontSize: '0.7rem', color: '#6b21a8', backgroundColor: '#faf5ff', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>Private</span>
                    )}
                    {cat.isFeatured && (
                      <span style={{ fontSize: '0.7rem', color: '#b45309', backgroundColor: '#fef9c3', padding: '0.1rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>⭐ Featured</span>
                    )}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#666' }}>
                    {cat.description || 'No description provided.'}
                  </p>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#888', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Articles: <strong>{articleCount}</strong></span>
                    <span>Subcategories: <strong>{subCount}</strong></span>
                    <span>Created: <strong>{new Date(cat.createdAt).toLocaleDateString()}</strong></span>
                    {cat.showOnHomepage === false && <span style={{ color: '#ef4444' }}>🏠 Hidden</span>}
                    {cat.showInNavigation === false && <span style={{ color: '#ef4444' }}>🔗 Hidden</span>}
                  </div>
                </div>

                <div className="inline-actions" style={{ gap: "0.25rem" }}>
                  {cat.isDeleted ? (
                    <button
                      className="small-outline-btn"
                      type="button"
                      title="Restore Category"
                      onClick={() => handleRestore(cat.id || cat._id, cat.name)}
                      disabled={loading}
                    >
                      <FiRotateCcw size={12} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="small-outline-btn"
                        type="button"
                        title="Edit Category"
                        onClick={() => handleEdit(cat)}
                        disabled={loading}
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        className="small-outline-btn danger"
                        type="button"
                        title="Delete Category"
                        onClick={() => handleDelete(cat.id || cat._id, cat.name)}
                        disabled={loading}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {paginatedCategories.length === 0 && (
            <p className="empty-state">No categories found matching your query.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
            <button
              className="small-outline-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.85rem", color: "#666" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="small-outline-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
