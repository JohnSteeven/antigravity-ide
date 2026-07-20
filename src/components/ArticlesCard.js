import { Link } from "react-router-dom";
import { FiBookmark, FiEye, FiHeart, FiStar } from "react-icons/fi";
import { resolveImageUrl } from "../utils/helpers";

const ArticlesCard = ({ articleData }) => {
  const {
    title,
    slug,
    description,
    coverImage,
    publishedAt,
    category,
    tags = [],
    readingTime,
    views,
    likes,
    rating,
  } = articleData;

  return (
    <article className="article-card">
      <Link to={`/articles/${slug}`} className="article-image-link">
        <img src={resolveImageUrl(coverImage) || undefined} alt={title} className="article-image" />
      </Link>

      <div className="article-details">
        <div className="article-meta-row">
          <span className="article-tag">{category}</span>
          <span>{readingTime}</span>
        </div>

        <h3 className="article-title">
          <Link to={`/articles/${slug}`}>{title}</Link>
        </h3>

        <p className="article-text">{description}</p>

        <div className="article-tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        <div className="article-card-footer">
          <span>{publishedAt}</span>
          <span>
            <FiEye /> {views}
          </span>
          <span>
            <FiHeart /> {likes}
          </span>
          <span>
            <FiStar /> {rating}
          </span>
        </div>

        <Link to={`/articles/${slug}`} className="article-read-link">
          Read article <FiBookmark />
        </Link>
      </div>
    </article>
  );
};

export default ArticlesCard;
