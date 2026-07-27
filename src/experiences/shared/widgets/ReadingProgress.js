import React from "react";

const ReadingProgress = ({ scrollProgress, article }) => {
  return (
    <div className="reading-progress-box">
      <div className="progress-labels">
        <span>Reading Progress</span>
        <span>{Math.round(scrollProgress)}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${scrollProgress}%` }}></div>
      </div>
      <span className="time-remaining-label">
        {Math.max(
          1,
          Math.round(((100 - scrollProgress) / 100) * parseInt(article?.readingTime || "5"))
        )} min remaining
      </span>
    </div>
  );
};

export default ReadingProgress;
