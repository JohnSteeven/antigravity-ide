import React from "react";
import IncidentsHero from "./IncidentsHero";
import IncidentsLeftSidebar from "./IncidentsLeftSidebar";
import IncidentsRightSidebar from "./IncidentsRightSidebar";
import IncidentsBottomSection from "./IncidentsBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";

const IncidentsExperience = (props) => {
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
    <main className="incidents-experience-page" data-experience="incidents">
      {/* Layer 1: Incident Shell Status Hero */}
      <IncidentsHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      <div className="incidents-article-layout">
        {/* Layer 2: Left Incident Chronology Sidebar */}
        <IncidentsLeftSidebar
          article={article}
          headings={headings}
          activeHeading={activeHeading}
          scrollProgress={scrollProgress}
        />

        {/* Layer 3: Main Editorial Post-Mortem & RCA Prose */}
        <article className="incidents-center-content">
          <ArticleProseRenderer processedBody={processedBody} category="incidents" />

          {/* Layer 5: Bottom Section (Remediation Summary, Comments, Related RCA Reports) */}
          <IncidentsBottomSection
            article={article}
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
            relatedArticles={relatedArticles}
          />
        </article>

        {/* Layer 4: Right Sidebar (Action Items Checklist, Impact Radius, Commander Bio, Newsletter) */}
        <IncidentsRightSidebar
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

export default IncidentsExperience;
