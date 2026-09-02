import React from "react";

const ReadingProgress = ({ scrollProgress, article, category = "" }) => {
  const isCoding = category === "coding";

  if (isCoding) {
    return (
      <div
        className="reading-progress-box coding-reading-progress"
        style={{
          background: "#1e293b",
          color: "#f8fafc",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          className="progress-labels"
          style={{
            color: "#f8fafc",
            fontWeight: 600,
            display: "flex",
            justifySpace: "between",
            marginBottom: "8px",
          }}
        >
          <span>Reading Progress</span>
          <span>{Math.round(scrollProgress)}%</span>
        </div>
        <div
          className="progress-bar-track"
          style={{
            background: "#334155",
            borderRadius: "10px",
            height: "8px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${scrollProgress}%`,
              background: "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
              borderRadius: "10px",
              height: "100%",
            }}
          ></div>
        </div>
        <span
          className="time-remaining-label"
          style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}
        >
          {Math.max(
            1,
            Math.round(((100 - scrollProgress) / 100) * parseInt(article?.readingTime || "5"))
          )}{" "}
          min remaining
        </span>
      </div>
    );
  }

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
        )}{" "}
        min remaining
      </span>
    </div>
  );
};

export default ReadingProgress;
