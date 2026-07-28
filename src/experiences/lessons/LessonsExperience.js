import React from "react";
import LessonsHero from "./LessonsHero";
import LessonsLeftSidebar from "./LessonsLeftSidebar";
import LessonsRightSidebar from "./LessonsRightSidebar";
import LessonsBottomSection from "./LessonsBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";

const LessonsExperience = (props) => {
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
    <main className="lessons-experience-page" data-experience="lessons">
      {/* Layer 1: Contemplative Reader Hero */}
      <LessonsHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      <div className="lessons-article-layout">
        {/* Layer 2: Left Core Principles Sidebar */}
        <LessonsLeftSidebar
          article={article}
          headings={headings}
          activeHeading={activeHeading}
          scrollProgress={scrollProgress}
        />

        {/* Layer 3: Main Editorial Contemplative Prose */}
        <article className="lessons-center-content">
          <ArticleProseRenderer processedBody={processedBody} category="lessons" />

          {/* Layer 5: Bottom Section (Wisdom Takeaways, Comments, Related Reflection Guides) */}
          <LessonsBottomSection
            article={article}
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
            relatedArticles={relatedArticles}
          />
        </article>

        {/* Layer 4: Right Sidebar (Recommended Books, Reader Prompts, Mentor Profile, Newsletter) */}
        <LessonsRightSidebar
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

export default LessonsExperience;
