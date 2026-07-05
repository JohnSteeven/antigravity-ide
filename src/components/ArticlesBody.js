import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";
import ArticlesCard from "./ArticlesCard";

const ArticlesBody = () => {
  const { data } = useCms();
  const articles = data.articles
    .filter((article) => article.status === "published")
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 6);

  return (
    <section className="articles-body" id="latest-articles">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Latest stories</span>
          <h2>Fresh From The Journal</h2>
        </div>

        <Link to="/articles" className="text-link">
          Browse all articles
        </Link>
      </div>

      <div className="article-grid">
        {articles.map((article) => (
          <ArticlesCard articleData={article} key={article.id} />
        ))}
      </div>
    </section>
  );
};

export default ArticlesBody;
