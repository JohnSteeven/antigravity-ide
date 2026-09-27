import React, { useEffect, useState } from "react";
import { FiList } from "react-icons/fi";

export default function ArticleReadingTools({ children }) {
  const [expanded, setExpanded] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1100px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1100px)");
    const update = () => setExpanded(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return <div className="article-reading-tools"><details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary><FiList aria-hidden="true" /> In this article</summary>
    {children}
  </details></div>;
}
