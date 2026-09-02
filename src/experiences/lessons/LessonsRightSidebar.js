import React from "react";
import { FiBook, FiBookmark, FiHeart, FiFeather, FiHelpCircle } from "react-icons/fi";
import AuthorCard from "../shared/widgets/AuthorCard";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const LessonsRightSidebar = ({
  article,
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  const books = article.recommendedBooks || [
    "Atomic Habits by James Clear",
    "The Daily Stoic by Ryan Holiday",
    "Essentialism by Greg McKeown",
  ];

  const questions = article.reflectionQuestions || [
    "What small habit could you change today to align better with your long-term vision?",
    "How do you currently find moments of calm in a busy week?",
  ];

  return (
    <aside className="lessons-right-sidebar">
      <div className="lessons-sticky-box">
        {/* Mentor Profile Card */}
        <AuthorCard article={article} />

        {/* Recommended Reading */}
        <div className="lessons-sidebar-panel books-panel">
          <h3>
            <FiBook className="icon" /> Recommended Reading
          </h3>
          <div className="books-list">
            {books.map((b, idx) => (
              <div key={idx} className="book-item">
                <FiBookmark className="book-icon" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Reflection Prompts */}
        {questions.length > 0 && (
          <div className="lessons-sidebar-panel prompt-box">
            <h3>
              <FiHelpCircle className="icon" /> Reader Reflection
            </h3>
            <div className="prompts-list">
              {questions.map((q, idx) => (
                <p key={idx} className="prompt-q">
                  "{q}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Subscription */}
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

export default LessonsRightSidebar;
