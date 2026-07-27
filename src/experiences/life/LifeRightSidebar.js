import React from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiActivity } from "react-icons/fi";
import AuthorCard from "../shared/widgets/AuthorCard";
import ShareButtons from "../shared/widgets/ShareButtons";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const LifeRightSidebar = ({
  article,
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  const books = [
    { title: "Atomic Habits", author: "James Clear" },
    { title: "The Power of Now", author: "Eckhart Tolle" },
  ];

  return (
    <aside className="life-right-sidebar">
      <div className="life-sticky-box">
        <AuthorCard article={article} />

        <ShareButtons article={article} handleCopyLink={handleCopyLink} />

        {/* Life Collections */}
        <div className="life-sidebar-panel">
          <h3>Life Collections</h3>
          <div className="life-collections-list">
            <Link to="/category/life?subcategory=daily-journals" className="collection-tag">Daily Journals</Link>
            <Link to="/category/life?subcategory=personal-growth" className="collection-tag">Personal Growth</Link>
            <Link to="/category/life?subcategory=habits" className="collection-tag">Habits & Routines</Link>
            <Link to="/category/life?subcategory=relationships" className="collection-tag">Relationships</Link>
          </div>
        </div>

        {/* Recommended Books */}
        <div className="life-sidebar-panel book-recommendations-panel">
          <h3><FiBookOpen /> Book Recommendations</h3>
          <div className="recommended-books-list">
            {books.map((b, i) => (
              <div key={i} className="book-item">
                <strong>{b.title}</strong>
                <span>by {b.author}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Stories */}
        {relatedArticles.length > 0 && (
          <div className="life-sidebar-panel">
            <h3>Related Reflections</h3>
            <div className="related-stories-list">
              {relatedArticles.map((item) => (
                <Link to={`/articles/${item.slug}`} className="related-story-row" key={item.id}>
                  <div className="related-story-meta">
                    <span>{item.subcategory || "Habits"}</span>
                    <span>•</span>
                    <span>{item.readingTime || "5 min read"}</span>
                  </div>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </div>
          </div>
        )}

        <NewsletterPanel
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          handleNewsletterSubmit={handleNewsletterSubmit}
          newsletterMsg={newsletterMsg}
        />
      </div>
    </aside>
  );
};

export default LifeRightSidebar;
