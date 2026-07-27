import React from "react";
import LifeHero from "./LifeHero";
import LifeLeftSidebar from "./LifeLeftSidebar";
import LifeRightSidebar from "./LifeRightSidebar";
import LifeBottomSection from "./LifeBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";

const LifeExperience = (props) => {
  const {
    article,
    processedBody,
    headings,
    activeHeading,
    scrollProgress,
    approvedComments,
    comment,
    setComment,
    handleCommentSubmit,
    commentMessage,
    isLiked,
    handleLikeToggle,
    isBookmarked,
    handleBookmarkToggle,
    isSaved,
    handleSaveToggle,
    handleCopyLink,
    relatedArticles,
    newsletterEmail,
    setNewsletterEmail,
    handleNewsletterSubmit,
    newsletterMsg,
  } = props;

  return (
    <main className="life-experience-page" data-experience="life">
      {/* Layer 1: Immersive Hero */}
      <LifeHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      <div className="life-article-layout">
        {/* Layer 2: Left Sidebar (Chapters, TOC, Streak, Progress) */}
        <LifeLeftSidebar
          article={article}
          headings={headings}
          activeHeading={activeHeading}
          scrollProgress={scrollProgress}
        />

        {/* Layer 3: Main Content (Prose body renderer) */}
        <article className="life-center-content">
          <ArticleProseRenderer processedBody={processedBody} category="life" />

          {/* Layer 5: Bottom Section (Takeaways, reflection questions, comments, continue reading) */}
          <LifeBottomSection
            article={article}
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
            relatedArticles={relatedArticles}
          />
        </article>

        {/* Layer 4: Right Sidebar (Bio, Collections, Book Recs, Newsletter) */}
        <LifeRightSidebar
          article={article}
          handleCopyLink={handleCopyLink}
          relatedArticles={relatedArticles}
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          handleNewsletterSubmit={handleNewsletterSubmit}
          newsletterMsg={newsletterMsg}
        />
      </div>
    </main>
  );
};

export default LifeExperience;
