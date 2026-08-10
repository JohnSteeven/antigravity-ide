import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiAward,
  FiBookOpen,
  FiBookmark,
  FiCode,
  FiFeather,
  FiHeart,
  FiSend,
  FiGlobe,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { cmsSeed } from "../data/cmsSeed";

const iconMap = {
  award: <FiAward />,
  book: <FiBookOpen />,
  bookmark: <FiBookmark />,
  code: <FiCode />,
  feather: <FiFeather />,
  heart: <FiHeart />,
  send: <FiSend />,
  globe: <FiGlobe />,
};

const displayDescriptions = {
  life: "Stories about growth and purpose.",
  reflections: "Thoughts and personal journals.",
  incidents: "Real life incidents and events.",
  lessons: "Learnings from experiences.",
  travel: "Places, adventures and stories.",
  news: "Live global news and world updates.",
  coding: "Tech tutorials and coding notes."
};

const getCategoryDescription = (category) => {
  return displayDescriptions[category.slug?.toLowerCase()] || category.description;
};

const getCategoryIcon = (category) => {
  if (category.slug === "life") return <FiHeart />;
  if (category.slug === "reflections") return <FiFeather />;
  if (category.slug === "incidents") return <FiBookmark />;
  if (category.slug === "lessons") return <FiBookOpen />;
  if (category.slug === "travel") return <FiSend />;
  return iconMap[category.icon] || <FiBookOpen />;
};

const getCategoryName = (category) => {
  if (category.slug === "incidents") return "Experiences";
  return category.name;
};

const defaultImages = {
  life: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80",
  reflections: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
  incidents: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
  lessons: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80",
  coding: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80"
};

const getCategoryHeroImage = (category) => {
  return category.heroImage?.trim() || defaultImages[category.slug?.toLowerCase()] || defaultImages.life;
};

const ExploreCategories = () => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data } = useCms();
  const rawCategories = (data?.categories && data.categories.length > 0) ? data.categories : cmsSeed.categories;
  const filteredList = rawCategories.filter(
    (c) =>
      !c.isDeleted &&
      c.isActive !== false &&
      (c.status === undefined || c.status === 'published') &&
      (c.visibility === undefined || c.visibility === 'public') &&
      c.showOnHomepage !== false
  );
  const order = ['life', 'reflections', 'incidents', 'lessons', 'travel', 'news', 'coding'];
  const categoriesList = [...filteredList].sort((a, b) => {
    const indexA = order.indexOf(a.slug?.toLowerCase());
    const indexB = order.indexOf(b.slug?.toLowerCase());
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [categoriesList]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const showNavButtons = canScrollLeft || canScrollRight;

  return (
    <section className="categories-section" id="categories">
      <span className="section-kicker">Browse by theme</span>
      <h2 className="categories-heading">Explore by Category</h2>
      <p className="categories-subheading">Choose a topic and dive into meaningful content.</p>

      <div className="categories-carousel-outer">
        {showNavButtons && (
          <button
            type="button"
            className={`categories-carousel-nav prev ${!canScrollLeft ? "disabled" : ""}`}
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
          >
            <FiChevronLeft />
          </button>
        )}

        <div
          className="categories-grid-premium"
          ref={scrollRef}
        >
          {categoriesList.map((category) => (
            <Link
              className="category-card-premium"
              key={category.id || category._id}
              to={`/category/${category.slug}`}
              style={{
                backgroundImage: `url(${getCategoryHeroImage(category)})`
              }}
            >
              <div className="category-overlay-premium" />

              <div className="category-content-premium">
                <div className="category-icon-premium">
                  {getCategoryIcon(category)}
                </div>

                <div className="category-info-premium">
                  <h3 className="category-title-premium">{getCategoryName(category)}</h3>
                  <p className="category-desc-premium">{getCategoryDescription(category)}</p>
                </div>
              </div>

              <div className="category-arrow-premium">
                <FiArrowRight />
              </div>
            </Link>
          ))}
        </div>

        {showNavButtons && (
          <button
            type="button"
            className={`categories-carousel-nav next ${!canScrollRight ? "disabled" : ""}`}
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
          >
            <FiChevronRight />
          </button>
        )}
      </div>
    </section>
  );
};

export default ExploreCategories;
