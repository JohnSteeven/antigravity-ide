import { Link } from "react-router-dom";
import {
  FiAward,
  FiBookOpen,
  FiCode,
  FiFeather,
  FiHeart,
  FiSend,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";

const iconMap = {
  award: <FiAward />,
  book: <FiBookOpen />,
  code: <FiCode />,
  feather: <FiFeather />,
  heart: <FiHeart />,
  send: <FiSend />,
};

const ExploreCategories = () => {
  const { data } = useCms();

  return (
    <section className="categories-section" id="categories">
      <span className="section-kicker">Browse by theme</span>
      <h2 className="categories-heading">Explore by Category</h2>

      <div className="categories-grid">
        {data.categories.map((category) => (
          <Link
            className="category-item"
            key={category.id}
            to={`/category/${category.slug}`}
          >
            <div className="category-icon">
              {iconMap[category.icon] || <FiBookOpen />}
            </div>

            <span className="category-name">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ExploreCategories;
