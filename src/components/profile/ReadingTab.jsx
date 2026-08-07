import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiClock,
  FiMessageCircle,
  FiCornerDownRight,
  FiEdit2,
  FiPlusCircle,
  FiSend,
  FiTrash2,
  FiCheckCircle,
  FiPlay,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useCms } from "../../context/CmsContext";
import { articleApi } from "../../services/apiService";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const ReadingTab = () => {
  const { user, updateProfile } = useAuth();
  const { data } = useCms();
  const profile = user?.profile || {};

  const [activeSubtab, setActiveSubtab] = useState("continue");
  const [saved, setSaved] = useState([]);

  // Draft comments
  const [draftComments, setDraftComments] = useState(() => {
    try {
      const savedDrafts = localStorage.getItem("myjourney_draft_comments");
      return savedDrafts ? JSON.parse(savedDrafts) : (profile.draftComments || [
        {
          id: "draft-sample-1",
          articleSlug: "building-a-personal-blog-with-purpose",
          articleTitle: "Building A Personal Blog With Purpose",
          text: "Great insights on blog architecture! I was wondering if you plan to cover newsletter integration in part 2?",
          createdAt: "2026-08-01",
        }
      ]);
    } catch {
      return profile.draftComments || [];
    }
  });

  const [newDraftText, setNewDraftText]           = useState("");
  const [newDraftArticleId, setNewDraftArticleId] = useState("");
  const [editingDraftId, setEditingDraftId]       = useState(null);
  const [editingDraftText, setEditingDraftText]   = useState("");
  const [draftMsg, setDraftMsg]                   = useState("");

  const saveDraftsToStorage = (updated) => {
    setDraftComments(updated);
    try {
      localStorage.setItem("myjourney_draft_comments", JSON.stringify(updated));
    } catch (e) {
      console.warn("LocalStorage save failed:", e);
    }
  };

  const handleCreateDraft = (e) => {
    e.preventDefault();
    if (!newDraftText.trim()) return;
    const targetArt = data.articles.find((a) => String(a.id || a._id) === String(newDraftArticleId)) || data.articles[0];
    const newDraft = {
      id: `draft-${Date.now()}`,
      articleId: targetArt?.id || targetArt?._id || "1",
      articleSlug: targetArt?.slug || "building-a-personal-blog-with-purpose",
      articleTitle: targetArt?.title || "Building A Personal Blog With Purpose",
      text: newDraftText.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextDrafts = [newDraft, ...draftComments];
    saveDraftsToStorage(nextDrafts);
    setNewDraftText("");
    setDraftMsg("✓ Draft comment saved!");
    setTimeout(() => setDraftMsg(""), 3000);
  };

  const handlePublishDraft = async (draft) => {
    try {
      const newComment = {
        id: `profile-comment-${Date.now()}`,
        articleId: draft.articleId,
        articleTitle: draft.articleTitle,
        text: draft.text,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      await updateProfile({
        profile: {
          ...profile,
          comments: [newComment, ...(profile.comments || [])],
        },
      });
      const remaining = draftComments.filter((d) => d.id !== draft.id);
      saveDraftsToStorage(remaining);
      setDraftMsg("✓ Draft published as live comment!");
      setTimeout(() => setDraftMsg(""), 3000);
    } catch (err) {
      console.error("Publish draft error:", err);
    }
  };

  const handleDeleteDraft = (draftId) => {
    const remaining = draftComments.filter((d) => d.id !== draftId);
    saveDraftsToStorage(remaining);
  };

  const handleSaveEditedDraft = (draftId) => {
    const updated = draftComments.map((d) =>
      d.id === draftId ? { ...d, text: editingDraftText, createdAt: new Date().toISOString().slice(0, 10) } : d
    );
    saveDraftsToStorage(updated);
    setEditingDraftId(null);
    setEditingDraftText("");
  };

  // Sample or loaded Replies
  const userReplies = profile.replies || [
    {
      id: "reply-1",
      articleTitle: "Building A Personal Blog With Purpose",
      articleSlug: "building-a-personal-blog-with-purpose",
      parentComment: "nice one",
      authorName: "Sarah Jenkins",
      authorRole: "Author",
      text: "Thank you so much! Really glad you found this article helpful.",
      createdAt: "2026-07-31",
    },
    {
      id: "reply-2",
      articleTitle: "Building A Personal Blog With Purpose",
      articleSlug: "building-a-personal-blog-with-purpose",
      parentComment: "nice one",
      authorName: "Alex Rivera",
      authorRole: "Reader",
      text: "Agreed! The section on content structure was super clear.",
      createdAt: "2026-08-01",
    }
  ];

  useEffect(() => {
    const ids = profile.savedArticles || [];
    if (!ids.length) { setSaved([]); return; }
    articleApi.list({ ids: ids.join(","), limit: ids.length })
      .then((r) => setSaved(r.articles || []))
      .catch(() => setSaved(data.articles.filter((a) => ids.includes(a.id) || ids.includes(a._id))));
  }, [profile.savedArticles, data.articles]);

  const comments = profile.comments || [];

  return (
    <div>
      {/* Subtabs */}
      <div className="rp-saved-subtabs" role="tablist">
        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "continue" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("continue")}
        >
          <FiPlay /> Continue Reading ({saved.length})
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "comments" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("comments")}
        >
          <FiMessageCircle /> Your Comments ({comments.length})
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "replies" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("replies")}
        >
          <FiCornerDownRight /> Replies ({userReplies.length})
        </button>

        <button
          type="button"
          className={`rp-subtab-btn${activeSubtab === "drafts" ? " is-active" : ""}`}
          onClick={() => setActiveSubtab("drafts")}
        >
          <FiEdit2 /> Draft Comments ({draftComments.length})
        </button>
      </div>

      {/* Subtab 1: Continue Reading */}
      {activeSubtab === "continue" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiPlay style={{ color: "var(--teal, #426c67)" }} /> Continue Reading & Progress
          </h3>

          {saved.length > 0 ? (
            <div className="rp-continue-grid">
              {saved.map((art, idx) => {
                const progressPct = Math.min(100, Math.max(25, (idx + 1) * 30));
                return (
                  <Link key={art.id || art._id} to={`/articles/${art.slug}`} className="rp-continue-card">
                    <span style={{ fontSize: "0.72rem", color: "var(--gold-dark, #8f6b48)", fontWeight: 800 }}>
                      {art.category || "General"}
                    </span>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.4 }}>{art.title}</div>
                    <div style={{ marginTop: "auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted, #64748b)", marginBottom: 6 }}>
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="rp-progress-bar-wrap">
                        <div className="rp-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">📖</span>
              <div className="rp-empty-title">No articles in progress</div>
              <div className="rp-empty-desc">
                Save stories to your reading queue to pick up where you left off.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Comments */}
      {activeSubtab === "comments" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiMessageCircle style={{ color: "var(--teal, #426c67)" }} /> Your Comments ({comments.length})
          </h3>

          {comments.length > 0 ? (
            <div>
              {comments.map((c, idx) => (
                <div key={c.id || c._id || idx} className="rp-comment-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <strong style={{ fontSize: "0.9rem", color: "var(--ink, #1e293b)" }}>{c.articleTitle || "Article"}</strong>
                    <span style={{ fontSize: "0.76rem", color: "var(--muted, #94a3b8)" }}>{formatDate(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155", lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">💬</span>
              <div className="rp-empty-title">No comments yet</div>
              <div className="rp-empty-desc">
                Share your thoughts on articles to join discussions across MyJourney.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Replies */}
      {activeSubtab === "replies" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiCornerDownRight style={{ color: "var(--clay, #a5855f)" }} /> Replies to Your Comments ({userReplies.length})
          </h3>

          {userReplies.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {userReplies.map((reply) => (
                <div key={reply.id} className="rp-comment-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <Link to={`/articles/${reply.articleSlug}`} style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal, #426c67)", textDecoration: "none" }}>
                        {reply.articleTitle}
                      </Link>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)", marginTop: 2 }}>
                        Replying to your comment: <em>"{reply.parentComment}"</em>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.76rem", color: "var(--muted, #94a3b8)" }}>{formatDate(reply.createdAt)}</span>
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: "0.85rem" }}>{reply.authorName}</strong>
                      <span className={`rp-reply-author-badge ${reply.authorRole === "Author" ? "author" : "reader"}`}>
                        {reply.authorRole}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.86rem", color: "#334155", margin: 0, lineHeight: 1.5 }}>{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">↩️</span>
              <div className="rp-empty-title">No replies yet</div>
              <div className="rp-empty-desc">
                When authors or readers reply to your comments, they will appear here.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Draft Comments */}
      {activeSubtab === "drafts" && (
        <div className="rp-card">
          <h3 className="rp-section-title">
            <FiEdit2 style={{ color: "var(--teal, #426c67)" }} /> Draft Comments ({draftComments.length})
          </h3>

          {draftMsg && <div className="rp-alert-success" style={{ marginBottom: 14 }}>{draftMsg}</div>}

          {/* New Draft Form */}
          <form className="rp-draft-form" onSubmit={handleCreateDraft}>
            <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 6, color: "var(--ink, #1e293b)" }}>
              <FiPlusCircle style={{ color: "var(--teal, #426c67)" }} /> Compose New Draft Comment
            </strong>
            <select
              className="rp-draft-select"
              value={newDraftArticleId}
              onChange={(e) => setNewDraftArticleId(e.target.value)}
            >
              <option value="">Select Article to Draft Comment For...</option>
              {data.articles.map((art) => (
                <option key={art.id || art._id} value={art.id || art._id}>
                  {art.title}
                </option>
              ))}
            </select>

            <textarea
              className="rp-draft-textarea"
              placeholder="Write your draft thoughts or comment response..."
              value={newDraftText}
              onChange={(e) => setNewDraftText(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="primary-btn" disabled={!newDraftText.trim()} style={{ fontSize: "0.8rem", padding: "6px 16px" }}>
                <FiSend /> Save Draft
              </button>
            </div>
          </form>

          {/* List of Drafts */}
          {draftComments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {draftComments.map((draft) => (
                <div key={draft.id} className="rp-comment-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <Link to={`/articles/${draft.articleSlug}`} style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal, #426c67)", textDecoration: "none" }}>
                      {draft.articleTitle}
                    </Link>
                    <span style={{ fontSize: "0.76rem", color: "var(--muted, #94a3b8)" }}>{formatDate(draft.createdAt)}</span>
                  </div>

                  {editingDraftId === draft.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      <textarea
                        className="rp-draft-textarea"
                        value={editingDraftText}
                        onChange={(e) => setEditingDraftText(e.target.value)}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button type="button" className="secondary-btn" onClick={() => setEditingDraftId(null)} style={{ fontSize: "0.78rem", padding: "4px 10px" }}>
                          Cancel
                        </button>
                        <button type="button" className="primary-btn" onClick={() => handleSaveEditedDraft(draft.id)} style={{ fontSize: "0.78rem", padding: "4px 12px" }}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: "0.86rem", color: "#334155", margin: "0 0 10px 0", lineHeight: 1.5 }}>
                        {draft.text}
                      </p>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button type="button" className="secondary-btn" onClick={() => handleDeleteDraft(draft.id)} style={{ fontSize: "0.76rem", padding: "4px 10px", color: "#dc2626" }}>
                          <FiTrash2 /> Discard
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => { setEditingDraftId(draft.id); setEditingDraftText(draft.text); }} style={{ fontSize: "0.76rem", padding: "4px 10px" }}>
                          <FiEdit2 /> Edit
                        </button>
                        <button type="button" className="primary-btn" onClick={() => handlePublishDraft(draft)} style={{ fontSize: "0.76rem", padding: "4px 12px" }}>
                          <FiSend /> Publish Live
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-empty">
              <span className="rp-empty-icon">✍️</span>
              <div className="rp-empty-title">No draft comments</div>
              <div className="rp-empty-desc">
                Unpublished comment drafts will be saved here so you can finish and publish them anytime.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingTab;
