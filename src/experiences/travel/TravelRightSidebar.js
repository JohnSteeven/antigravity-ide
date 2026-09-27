import React from "react";
import { FiSun, FiCloudRain, FiBriefcase, FiCheckCircle, FiCompass, FiShield, FiHeart } from "react-icons/fi";
import AuthorCard from "../shared/widgets/AuthorCard";
import NewsletterPanel from "../shared/widgets/NewsletterPanel";

const TravelRightSidebar = ({
  article,
  handleCopyLink,
  relatedArticles = [],
  newsletterEmail,
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg,
}) => {
  const weather = article.weather;
  const gearList = article.gearList || [];

  return (
    <aside className="travel-right-sidebar">
      <div className="travel-sticky-box">
        {/* Traveler Bio Card */}
        <AuthorCard article={article} />

        {/* Weather & Climate Specs */}
        {(weather || article.bestTime) && <div className="travel-sidebar-panel weather-box">
          <h3>
            <FiSun className="icon" /> Climate & Weather
          </h3>
          <div className="weather-badge-display">
            <span className="weather-val">{weather}</span>
          </div>
          {article.bestTime && <p className="weather-note">Best time to visit: <strong>{article.bestTime}</strong></p>}
        </div>}

        {/* Packing & Gear List */}
        {gearList.length > 0 && <div className="travel-sidebar-panel gear-box">
          <h3>
            <FiBriefcase className="icon" /> Recommended Packing List
          </h3>
          <div className="gear-list">
            {gearList.map((item, idx) => (
              <div key={idx} className="gear-item">
                <FiCheckCircle className="check-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>}

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

export default TravelRightSidebar;
