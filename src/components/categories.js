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

import { cmsSeed } from "../data/cmsSeed";

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
  const rawCategories = (data?.categories && data.categories.length > 0) ? data.categories : cmsSeed.categories;
  const categoriesList = rawCategories.filter((c) => !c.isDeleted && c.isActive !== false);

  return (
    <section className="categories-section" id="categories">
      <span className="section-kicker">Browse by theme</span>
      <h2 className="categories-heading">Explore by Category</h2>

      <div className="categories-grid">
        {categoriesList.map((category) => (
          <Link
            className="category-item"
            key={category.id || category._id}
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
