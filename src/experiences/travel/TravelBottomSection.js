import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiCompass, FiMapPin, FiArrowRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const TravelBottomSection = ({
  article,
  approvedComments,
  comment,
  setComment,
  handleCommentSubmit,
  commentMessage,
  relatedArticles = [],
}) => {
  const [showAll, setShowAll] = useState(false);

  const itinerary = article.itinerary || [
    "Day 1: Arrival & Exploring Historic Streets",
    "Day 2: Morning Temples & Bamboo Forest Walk",
    "Day 3: Culinary Market Tour & Evening Tea",
  ];

  const visibleArticles = showAll ? relatedArticles : relatedArticles.slice(0, 2);

  return (
    <footer className="travel-bottom-section">
      {/* Expedition Summary Card */}
      <div className="travel-summary-card">
        <h3>
          <FiCompass /> Expedition Highlights Summary
        </h3>
        <div className="summary-grid">
          {itinerary.map((highlight, idx) => (
            <div key={idx} className="summary-item">
              <span className="item-num">0{idx + 1}</span>
              <p>{highlight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        approvedComments={approvedComments}
        comment={comment}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
      />

      {/* Related Travel Expeditions Grid */}
      {relatedArticles.length > 0 && (
        <div className="travel-suggested-reads">
          <h3>
            <FiMapPin /> More Travel Expeditions
          </h3>
          <div className="travel-reads-grid">
            {visibleArticles.map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="travel-read-card"
              >
                <div className="card-image-wrap">
                  <img
                    src={
                      rel.imageUrl ||
                      rel.featuredImage ||
                      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={rel.title}
                  />
                  <span className="card-badge">{rel.location || rel.category || "Travel"}</span>
                </div>
                <div className="card-body">
                  <h4>{rel.title}</h4>
                  <p>{rel.excerpt}</p>
                  <span className="read-more-btn">
                    Read Expedition <FiArrowRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {relatedArticles.length > 2 && (
            <div className="view-more-container">
              <button
                type="button"
                className="view-more-btn"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? (
                  <>Show Less <FiChevronUp /></>
                ) : (
                  <>View More Expeditions ({relatedArticles.length - 2} more) <FiChevronDown /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </footer>
  );
};

export default TravelBottomSection;
