import React from "react";
import { FiMessageCircle } from "react-icons/fi";

const CommentsSection = ({
  approvedComments = [],
  comment = { text: "" },
  setComment,
  handleCommentSubmit,
  commentMessage = "",
}) => {
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
