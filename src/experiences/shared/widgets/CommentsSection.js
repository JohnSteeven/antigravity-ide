import React from "react";
import { FiMessageCircle } from "react-icons/fi";

const CommentsSection = ({
  approvedComments = [],
  comment = { text: "" },
  setComment,
  handleCommentSubmit,
  commentMessage = "",
  category = "",
}) => {
  const isCoding = category === "coding";
  const commentLength = comment.text.length;
  const commentsAreLoading = comment.listStatus === "loading";
  const commentsFailed = comment.listStatus === "error";

  const renderCommentList = (coding = false) => {
    if (commentsAreLoading) {
      return <p className="empty-state-comments" role="status">Loading comments…</p>;
    }
    if (commentsFailed) {
      return <p className="empty-state-comments" role="alert">{comment.listMessage}</p>;
    }
    if (approvedComments.length === 0) {
      return (
        <p
          className="empty-state-comments"
          style={coding ? { color: "#94a3b8", fontSize: "15px", fontStyle: "italic" } : undefined}
        >
          No approved comments yet. Be the first to share your thoughts!
        </p>
      );
    }
    return approvedComments.map((item) => (
      <article
        className={coding ? "premium-comment-card coding-comment-card" : "premium-comment-card"}
        key={item.id}
        style={coding ? {
          background: "#1e293b", border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px", padding: "20px", color: "#e2e8f0",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
        } : undefined}
      >
        <div className="comment-header" style={coding ? { display: "flex", justifyContent: "space-between", marginBottom: "8px" } : undefined}>
          <strong style={coding ? { color: "#38bdf8", fontSize: "15px" } : undefined}>{item.name}</strong>
          <span style={coding ? { color: "#94a3b8", fontSize: "13px" } : undefined}>{item.createdAt}</span>
        </div>
        <p style={coding ? { color: "#e2e8f0", margin: 0, fontSize: "14px", lineHeight: 1.6 } : undefined}>{item.text}</p>
      </article>
    ));
  };

  if (isCoding) {
    return (
      <section
        className="premium-comments-section coding-comments-section detail-comments"
        style={{ color: "#f8fafc", marginTop: "40px" }}
      >
        <div
          className="section-heading-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              color: "#ffffff",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "24px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Comments ({approvedComments.length})
          </h2>
          <span style={{ color: "#38bdf8", fontSize: "20px" }}>
            <FiMessageCircle />
          </span>
        </div>

        <div
          className="comment-list"
          style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}
        >
          {renderCommentList(true)}
        </div>

        <form
          className="comment-form"
          onSubmit={handleCommentSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <textarea
            value={comment.text}
            onChange={(event) =>
              setComment((current) => ({ ...current, text: event.target.value }))
            }
            placeholder="Write a thoughtful comment"
            aria-label="Comment"
            required
            minLength={3}
            maxLength={1000}
            disabled={comment.isSubmitting}
            rows={4}
            style={{
              background: "#0f172a",
              color: "#f8fafc",
              border: "1.5px solid #334155",
              borderRadius: "16px",
              padding: "16px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          ></textarea>
          <span className="form-note">{commentLength}/1000 characters</span>
          <button
            className="coding-submit-btn"
            type="submit"
            disabled={comment.isSubmitting}
          >
            {comment.isSubmitting ? "Submitting…" : "Submit Comment"}
          </button>
          {commentMessage && (
            <span className="form-note" role={comment.submissionStatus === "error" ? "alert" : "status"} aria-live="polite" aria-atomic="true" style={{ color: "#38bdf8", fontSize: "13px" }}>
              {commentMessage}
            </span>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="premium-comments-section detail-comments">
      <div className="section-heading-row">
        <h2>Comments ({approvedComments.length})</h2>
        <span>
          <FiMessageCircle />
        </span>
      </div>

      <div className="comment-list">
        {renderCommentList()}
      </div>

      <form className="comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          value={comment.text}
          onChange={(event) =>
            setComment((current) => ({ ...current, text: event.target.value }))
          }
          placeholder="Write a thoughtful comment"
          aria-label="Comment"
          required
          minLength={3}
          maxLength={1000}
          disabled={comment.isSubmitting}
        ></textarea>
        <span className="form-note">{commentLength}/1000 characters</span>
        <button className="primary-btn detail-primary-action" type="submit" disabled={comment.isSubmitting}>
          {comment.isSubmitting ? "Submitting…" : "Submit Comment"}
        </button>
        {commentMessage && <span className="form-note" role={comment.submissionStatus === "error" ? "alert" : "status"} aria-live="polite" aria-atomic="true">{commentMessage}</span>}
      </form>
    </section>
  );
};

export default CommentsSection;
