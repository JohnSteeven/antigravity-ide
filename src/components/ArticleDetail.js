import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  FiBookOpen,
  FiBookmark,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiStar,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";
import { getFullName } from "../utils/helpers";
import LoginRequiredModal from "./LoginRequiredModal";
import Breadcrumbs from "./shared/Breadcrumbs";

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { data, addComment, incrementArticle } = useCms();
  const { isAuthenticated, updateProfile, user } = useAuth();
  const [comment, setComment] = useState({ text: "" });
  const [commentMessage, setCommentMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const article = data.articles.find(
    (item) => item.slug === slug && item.status === "published"
  );

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    return data.articles
      .filter(
        (item) =>
          item.id !== article.id &&
          item.status === "published" &&
          item.category === article.category
      )
      .slice(0, 3);
  }, [article, data.articles]);

  useEffect(() => {
    if (article) {
      incrementArticle(article.id, "views");
    }
  }, [article?.id]);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  const approvedComments = (article.comments || []).filter(
    (item) => item.status === "approved"
  );

  const requireLogin = () => {
    if (isAuthenticated) return true;
    setShowLoginModal(true);
    return false;
  };

  const addArticleToProfile = async (field) => {
    const profile = user?.profile || {};
    const currentItems = Array.isArray(profile[field]) ? profile[field] : [];

    if (currentItems.includes(article.id)) {
      return false;
    }

    await updateProfile({
      profile: {
        ...profile,
        [field]: [article.id, ...currentItems],
      },
    });

    return true;
  };

  const handleArticleAction = async ({ metric, profileField, message }) => {
    if (!requireLogin()) return;

    try {
      const changed = await addArticleToProfile(profileField);
      if (!changed) {
        setCommentMessage("This article is already in your profile.");
        return;
      }
      if (metric) incrementArticle(article.id, metric);
      setCommentMessage(message);
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!requireLogin()) return;

    try {
      const nextComment = {
        name: getFullName(user),
        text: comment.text,
      };
      addComment(article.id, nextComment);
      await updateProfile({
        profile: {
          ...(user?.profile || {}),
          comments: [
            {
              id: `profile-comment-${article.id}-${Date.now()}`,
              articleId: article.id,
              articleTitle: article.title,
              text: comment.text,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...((user?.profile?.comments || [])),
          ],
        },
      });
      setComment({ text: "" });
      setCommentMessage("Comment submitted for moderation.");
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  return (
    <main className="article-detail-page">
      <article>
        <header
          className="article-detail-hero"
          style={{ backgroundImage: `url("${article.coverImage}")` }}
        >
          <div className="article-detail-overlay"></div>
          <div>
            <Breadcrumbs
              items={[
                { label: "Must Read", to: "/#featured" },
                { label: article.category, to: `/category/${article.category.toLowerCase()}` },
                { label: article.title },
              ]}
            />
            <span className="article-tag">{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <div className="detail-meta">
              <span>{article.author}</span>
              <span>{article.publishedAt}</span>
              <span>{article.readingTime}</span>
            </div>
          </div>
        </header>

        <section className="article-detail-body">
          <aside className="article-analytics-rail" aria-label="Article actions">
            <span>
              <FiEye /> {article.views}
            </span>
            <button
              type="button"
              onClick={() =>
                handleArticleAction({
                  metric: "likes",
                  profileField: "likedArticles",
                  message: "Article liked.",
                })
              }
              aria-label="Like article"
            >
              <FiHeart /> {article.likes}
            </button>
            <button
              type="button"
              onClick={() =>
                handleArticleAction({
                  metric: "bookmarks",
                  profileField: "bookmarks",
                  message: "Article bookmarked.",
                })
              }
              aria-label="Bookmark article"
            >
              <FiBookmark /> {article.bookmarks}
            </button>
            <button
              type="button"
              onClick={() =>
                handleArticleAction({
                  profileField: "savedArticles",
                  message: "Article saved to your profile.",
                })
              }
              aria-label="Save article"
            >
              <FiBookOpen /> Save
            </button>
            <span>
              <FiStar /> {article.rating}
            </span>
          </aside>

          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: article.body }}
          ></div>
        </section>
      </article>

      <section className="comments-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Conversation</span>
            <h2>Comments</h2>
          </div>
          <span>
            <FiMessageCircle /> {approvedComments.length}
          </span>
        </div>

        <div className="comment-list">
          {approvedComments.map((item) => (
            <article className="comment-card" key={item.id}>
              <strong>{item.name}</strong>
              <p>{item.text}</p>
              <span>{item.createdAt}</span>
            </article>
          ))}
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

      {relatedArticles.length > 0 && (
        <section className="related-articles">
          <span className="section-kicker">Keep reading</span>
          <h2>Related Articles</h2>
          <div className="related-link-list">
            {relatedArticles.map((item) => (
              <Link to={`/articles/${item.slug}`} key={item.id}>
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <LoginRequiredModal
        open={showLoginModal}
        returnTo={location}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
};

export default ArticleDetail;
