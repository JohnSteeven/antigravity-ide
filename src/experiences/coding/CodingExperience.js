import React from "react";
import CodingHero from "./CodingHero";
import CodingLeftSidebar from "./CodingLeftSidebar";
import CodingRightSidebar from "./CodingRightSidebar";
import CodingBottomSection from "./CodingBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";

const CodingExperience = (props) => {
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
    <main className="coding-experience-page" data-experience="coding">
      {/* Layer 1: Developer Terminal Hero */}
      <CodingHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      <div className="coding-article-layout">
        {/* Layer 2: Left Developer Sidebar (File Explorer, TOC, API, CLI Commands) */}
        <CodingLeftSidebar
          article={article}
          headings={headings}
          activeHeading={activeHeading}
          scrollProgress={scrollProgress}
        />

        {/* Layer 3: Main Editorial Prose & Code Renderer */}
        <article className="coding-center-content">
          <ArticleProseRenderer processedBody={processedBody} category="coding" />

          {/* Layer 5: Bottom Section (Quick Commands, Comments, Related Tech Tutorials) */}
          <CodingBottomSection
            article={article}
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
            relatedArticles={relatedArticles}
          />
        </article>

        {/* Layer 4: Right Sidebar (Tech Stack Specs, Sandbox, Author Profile, Newsletter) */}
        <CodingRightSidebar
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

export default CodingExperience;
