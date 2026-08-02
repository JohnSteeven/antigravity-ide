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

  if (isCoding) {
    return (
      <section
        className="premium-comments-section coding-comments-section"
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
          {approvedComments.map((item) => (
            <article
              className="premium-comment-card coding-comment-card"
              key={item.id}
              style={{
                background: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "20px",
                color: "#e2e8f0",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div
                className="comment-header"
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
              >
                <strong style={{ color: "#38bdf8", fontSize: "15px" }}>{item.name}</strong>
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{item.createdAt}</span>
              </div>
              <p style={{ color: "#e2e8f0", margin: 0, fontSize: "14px", lineHeight: 1.6 }}>
                {item.text}
              </p>
            </article>
          ))}
          {approvedComments.length === 0 && (
            <p
              className="empty-state-comments"
              style={{ color: "#94a3b8", fontSize: "15px", fontStyle: "italic" }}
            >
              No approved comments yet. Be the first to share your thoughts!
            </p>
          )}
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
            required
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
          <button
            className="coding-submit-btn"
            type="submit"
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
              transition: "all 0.2s ease",
              alignSelf: "flex-start",
            }}
          >
            Submit Comment
          </button>
          {commentMessage && (
            <span className="form-note" style={{ color: "#38bdf8", fontSize: "13px" }}>
              {commentMessage}
            </span>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="premium-comments-section">
      <div className="section-heading-row">
        <h2>Comments ({approvedComments.length})</h2>
        <span>
          <FiMessageCircle />
        </span>
      </div>

      <div className="comment-list">
        {approvedComments.map((item) => (
          <article className="premium-comment-card" key={item.id}>
            <div className="comment-header">
              <strong>{item.name}</strong>
              <span>{item.createdAt}</span>
            </div>
            <p>{item.text}</p>
          </article>
        ))}
        {approvedComments.length === 0 && (
          <p className="empty-state-comments">
            No approved comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>

      <form className="comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          value={comment.text}
          onChange={(event) =>
            setComment((current) => ({ ...current, text: event.target.value }))
          }
          placeholder="Write a thoughtful comment"
          required
        ></textarea>
        <button className="primary-btn" type="submit">
          Submit Comment
        </button>
        {commentMessage && <span className="form-note">{commentMessage}</span>}
      </form>
    </section>
  );
};

export default CommentsSection;
