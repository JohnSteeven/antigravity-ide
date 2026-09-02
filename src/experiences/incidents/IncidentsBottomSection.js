import React, { useState } from "react";
import { Link } from "react-router";
import {
  FiImage,
  FiHelpCircle,
  FiEdit3,
  FiBookOpen,
  FiVideo,
  FiHeadphones,
  FiMessageSquare,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiSend,
  FiFileText,
  FiAward,
  FiTv,
} from "react-icons/fi";
import CommentsSection from "../shared/widgets/CommentsSection";

const DEFAULT_MEMORY_GALLERY = [
  {
    type: "photo",
    title: "The Workspace Setup",
    caption: "Where late-night reflections turned into actionable plans.",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
  },
  {
    type: "certificate",
    title: "Milestone Certificate",
    caption: "A tangible reminder of completing a crucial milestone.",
    url: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80",
  },
  {
    type: "screenshot",
    title: "Breakthrough Message",
    caption: "The email feedback that validated the entire effort.",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
  },
];

const DEFAULT_REFLECTION_QUESTIONS = [
  "Have you ever faced something similar in your own life or career?",
  "What would you have done if you were in this situation?",
  "Which lesson or takeaway stayed with you the most?",
  "What advice would you give to someone experiencing a similar challenge right now?",
  "Has this story changed your perspective or thinking in any way?",
];

const DEFAULT_RECOMMENDED_READING = [
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    note: "A timeless masterpiece on finding purpose through adversity.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    note: "How tiny changes build remarkable momentum over time.",
  },
];

const DEFAULT_VIDEOS = [
  {
    title: "Finding Resilience After Failure",
    duration: "14 min talk",
    speaker: "Noble John Steeven",
    thumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80",
  },
];

const DEFAULT_PODCAST = {
  title: "Episode #42: Turning Challenges Into Stepping Stones",
  duration: "28 mins",
  host: "The Experience Podcast",
  description: "In this episode, we dive deep into how unexpected turns lead to your best growth.",
};

const IncidentsBottomSection = ({
  article = {},
  approvedComments = [],
  comment = "",
  setComment,
  handleCommentSubmit,
  commentMessage = "",
  relatedArticles = [],
}) => {
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [userStoryModalOpen, setUserStoryModalOpen] = useState(false);
  const [userStoryText, setUserStoryText] = useState("");
  const [storySubmitted, setStorySubmitted] = useState(false);

  // Dynamic story-tailored reflection questions generator
  const getDynamicReflectionQuestions = (art) => {
    if (art.reflectionQuestions && art.reflectionQuestions.length > 0) {
      return art.reflectionQuestions;
    }
    const text = `${art.title || ""} ${art.mood || ""} ${art.category || ""} ${art.subcategory || ""}`.toLowerCase();
    if (text.includes("flight") || text.includes("travel") || text.includes("airport") || text.includes("delay")) {
      return [
        "When was the last time an unexpected disruption ended up creating a far better outcome for you?",
        "How comfortable are you striking up spontaneous conversations with strangers in public spaces?",
        "If you were stranded at an airport for 7 hours, how would you turn that time into a creative opportunity?",
        "Have you ever sketched a big idea or business plan on a napkin or scrap piece of paper?",
        "How do you balance sticking to a strict schedule with staying open to unexpected detours?",
      ];
    }
    if (text.includes("fail") || text.includes("launch") || text.includes("product") || text.includes("mistake")) {
      return [
        "Are you currently working on something in isolation without getting early feedback from users?",
        "How do you react emotionally when a project you poured months into doesn't get the response you hoped for?",
        "What is the most important lesson a past failure or setback taught you about yourself?",
        "How can you shorten your feedback loop today to validate your key assumptions faster?",
        "What would your project look like if you cut 70% of the non-essential features and focused only on the core pain point?",
      ];
    }
    if (text.includes("job") || text.includes("layoff") || text.includes("career") || text.includes("work")) {
      return [
        "How do you separate your personal self-worth from your job title and corporate brand?",
        "Have you ever stayed in a comfortable situation out of security when your gut told you it was time to move on?",
        "If your current routine was disrupted tomorrow, what creative skill or passion would you pursue?",
        "What small step can you take this week to build independent creative ownership outside your primary job?",
        "Looking back at your career pivots, which unexpected change turned out to be your greatest blessing?",
      ];
    }
    if (text.includes("conversation") || text.includes("mentor") || text.includes("leader") || text.includes("advice")) {
      return [
        "Has anyone ever asked you a single question that completely changed the way you view leadership or work?",
        "How often do you focus on making the people around you shine rather than proving your own competence?",
        "What is one piece of unvarnished feedback you received that hurt at first but made you significantly better?",
        "How can you shift from performing for applause to creating real leverage for your team?",
        "Who in your life played the role of a quiet mentor, and how can you pay that wisdom forward today?",
      ];
    }
    return [
      "Have you ever ignored early warning signs of physical or mental exhaustion in your work or life?",
      "How do you establish clear boundaries when expectations around you start escalating out of control?",
      "What single sentence or piece of advice has re-aligned your priorities during a turbulent time?",
      "If you could relive the hardest day of this experience, what choice would you make differently?",
      "What daily practice or ritual helps you stay grounded when external circumstances feel chaotic?",
    ];
  };

  // Dynamic CMS Props & Fallbacks
  const memoryGallery = article.memoryGallery || DEFAULT_MEMORY_GALLERY;
  const reflectionQuestions = getDynamicReflectionQuestions(article);
  const recommendedReading = article.recommendedReading || article.books || DEFAULT_RECOMMENDED_READING;
  const recommendedVideos = article.videos || article.recommendedVideos || DEFAULT_VIDEOS;
  const podcast = article.podcast || DEFAULT_PODCAST;

  const showGallery = article.memoryGallery !== false;
  const showReflection = article.reflectionQuestions !== false;
  const showShareStory = article.shareYourStory !== false;
  const showReading = article.recommendedReading !== false && article.books !== false;
  const showVideos = article.videos !== false;
  const showPodcast = article.podcast !== false;

  const visibleArticles = showAllArticles ? relatedArticles : relatedArticles.slice(0, 2);

  const getMemoryIcon = (type) => {
    switch (type) {
      case "video":
        return <FiTv />;
      case "certificate":
        return <FiAward />;
      case "document":
      case "screenshot":
        return <FiFileText />;
      case "audio":
        return <FiHeadphones />;
      default:
        return <FiImage />;
    }
  };

  const handleUserStorySubmit = (e) => {
    e.preventDefault();
    if (!userStoryText.trim()) return;
    setStorySubmitted(true);
    setTimeout(() => {
      setUserStoryText("");
      setStorySubmitted(false);
      setUserStoryModalOpen(false);
    }, 2200);
  };

  return (
    <footer className="incidents-bottom-section experience-bottom-section">


      {/* 2. Reflection Questions */}
      {showReflection && reflectionQuestions && reflectionQuestions.length > 0 && (
        <div className="experience-bottom-card reflection-questions-card">
          <h3>
            <FiHelpCircle className="icon" /> Reflection Questions
          </h3>
          <p className="card-sub-caption">Take a moment to ponder these questions as you digest the story.</p>
          <div className="reflection-questions-list">
            {reflectionQuestions.map((q, idx) => (
              <div key={idx} className="reflection-question-item">
                <span className="question-num">Q{idx + 1}</span>
                <p className="question-text">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Share Your Story CTA */}
      {showShareStory && (
        <div className="experience-bottom-card share-story-card">
          <div className="share-story-content">
            <div className="share-text-box">
              <h3>
                <FiEdit3 className="icon" /> Share Your Experience
              </h3>
              <p>Have you been through something similar? Your journey can encourage and inspire someone else walking the same path.</p>
            </div>
            <button
              type="button"
              className="share-story-btn detail-primary-action"
              onClick={() => setUserStoryModalOpen(true)}
            >
              Write Your Story <FiSend />
            </button>
          </div>

          {/* Interactive Modal/Form Expansion */}
          {userStoryModalOpen && (
            <div className="user-story-form-overlay">
              <div className="user-story-form-box">
                <h4>Tell us about your experience</h4>
                <p className="form-sub">Share your thoughts, turning point, or key lessons learned.</p>

                {storySubmitted ? (
                  <div className="story-success-msg">
                    <FiCheck className="check-mark" />
                    <p>Thank you for sharing your story! It has been submitted for community inspiration.</p>
                  </div>
                ) : (
                  <form onSubmit={handleUserStorySubmit}>
                    <textarea
                      rows={4}
                      placeholder="Write your personal experience here..."
                      value={userStoryText}
                      onChange={(e) => setUserStoryText(e.target.value)}
                      required
                    />
                    <div className="form-action-row">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setUserStoryModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="submit-story-btn detail-primary-action">
                        Submit Story <FiSend />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Recommended Reading */}
      {showReading && recommendedReading && recommendedReading.length > 0 && (
        <div className="experience-bottom-card recommended-reading-card">
          <h3>
            <FiBookOpen className="icon" /> Recommended Reading
          </h3>
          <div className="recommended-books-grid">
            {recommendedReading.map((book, idx) => (
              <div key={idx} className="book-item-card">
                <div className="book-icon-badge">📚</div>
                <div className="book-details">
                  <h4>{book.title}</h4>
                  <span className="book-author">by {book.author}</span>
                  {book.note && <p className="book-note">{book.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* 6. Recommended Experiences (Medium Style Magazine Cards) */}
      {relatedArticles.length > 0 && (
        <div className="incidents-suggested-reports experience-suggested-stories magazine-editorial-stories">
          <h3>
            <FiMessageSquare className="icon" /> Recommended Experiences
          </h3>
          <div className="incidents-reports-grid experience-stories-grid magazine-cards-grid">
            {visibleArticles.map((rel) => (
              <Link
                key={rel._id || rel.id}
                to={`/articles/${rel.slug}`}
                className="medium-magazine-card"
              >
                {(rel.coverImage || rel.image) && (
                  <div className="magazine-card-image">
                    <img src={rel.coverImage || rel.image} alt={rel.title} />
                  </div>
                )}
                <div className="magazine-card-body">
                  <div className="card-header-bar">
                    <span className="card-category-pill">{rel.category || "Experience"}</span>
                    <span className="card-time">{rel.readingTime || "15 min read"}</span>
                  </div>
                  <h4>{rel.title}</h4>
                  <p>{rel.excerpt || rel.description}</p>
                  <span className="read-report-btn read-story-btn magazine-arrow-link">
                    Read Story <FiArrowRight className="arrow-icon" />
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
                onClick={() => setShowAllArticles((prev) => !prev)}
              >
                {showAllArticles ? (
                  <>Show Less <FiChevronUp /></>
                ) : (
                  <>View More Experiences ({relatedArticles.length - 2} more) <FiChevronDown /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Community Discussion & Comments */}
      <CommentsSection
        approvedComments={approvedComments}
        comment={comment}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
      />
    </footer>
  );
};

export default IncidentsBottomSection;
