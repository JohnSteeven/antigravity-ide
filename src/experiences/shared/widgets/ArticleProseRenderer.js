import React, { useEffect, useRef } from "react";
import { getImageUrl } from "../../../utils/imageUrlHelper";

const ArticleProseRenderer = ({ processedBody, category }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleError = (e) => {
      if (e.target.tagName === "IMG") {
        console.warn("Inline body image failed to load, applying fallback:", e.target.src);
        e.target.src = getImageUrl("", category || "");
      }
    };

    container.addEventListener("error", handleError, true);
    return () => {
      container.removeEventListener("error", handleError, true);
    };
  }, [processedBody, category]);

  return (
    <div
      ref={containerRef}
      className="premium-article-prose"
      dangerouslySetInnerHTML={{ __html: processedBody }}
    ></div>
  );
};

export default ArticleProseRenderer;
