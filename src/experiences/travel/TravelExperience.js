import React from "react";
import TravelHero from "./TravelHero";
import TravelLeftSidebar from "./TravelLeftSidebar";
import TravelRightSidebar from "./TravelRightSidebar";
import TravelBottomSection from "./TravelBottomSection";
import ArticleProseRenderer from "../shared/widgets/ArticleProseRenderer";

const TravelExperience = (props) => {
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
    <main
      className="travel-experience-page article-detail-theme article-detail-theme--standard"
      data-experience="travel"
    >
      {/* Layer 1: Full-Bleed Destination Hero */}
      <TravelHero
        article={article}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
      />

      <div className="travel-article-layout">
        {/* Layer 2: Left Itinerary Timeline Sidebar */}
        <TravelLeftSidebar
          article={article}
          headings={headings}
          activeHeading={activeHeading}
          scrollProgress={scrollProgress}
        />

        {/* Layer 3: Main Editorial Travel Prose */}
        <article className="travel-center-content">
          <ArticleProseRenderer processedBody={processedBody} category="travel" />

          {/* Layer 5: Bottom Section (Expedition Summary, Comments, Related Travel Guides) */}
          <TravelBottomSection
            article={article}
            approvedComments={approvedComments}
            comment={comment}
            setComment={setComment}
            handleCommentSubmit={handleCommentSubmit}
            commentMessage={commentMessage}
            relatedArticles={relatedArticles}
          />
        </article>

        {/* Layer 4: Right Sidebar (Climate Weather, Gear Packing List, Author Card, Newsletter) */}
        <TravelRightSidebar
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

export default TravelExperience;
