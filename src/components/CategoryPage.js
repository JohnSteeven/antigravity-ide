import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { categoryBlueprintBySlug } from "../domain/knowledgeArchitecture";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import CategoryLanding from "../features/categories/CategoryLanding";
import LoadingScreen from "./LoadingScreen";

const CategoryPage = () => {
  const { slug } = useParams();
  const { data, syncStatus, incrementArticle } = useCms();
  const [apiArticles, setApiArticles] = useState(null);

  const category =
    data.categories.find((item) => item.slug === slug && !item.isDeleted && item.isActive !== false) || categoryBlueprintBySlug[slug];

  // Fetch published articles from the API for use in the category landing
  useEffect(() => {
    let cancelled = false;

    articleApi
      .list({ status: "published", limit: 1000 })
      .then((res) => {
        if (!cancelled && Array.isArray(res.articles)) {
          setApiArticles(res.articles);
        }
      })
      .catch(() => {
        if (!cancelled) setApiArticles(null);
      });

    return () => { cancelled = true; };
  }, []);

  if (!category) {
    if (syncStatus === "loading") {
      return <LoadingScreen message="Loading category..." />;
    }
    return <Navigate to="/articles" replace />;
  }

  // Prefer API articles; fall back to CmsContext (only published), synced with live CmsContext metrics
  const articles = (apiArticles || data.articles)
    .filter(a => a.status === "published")
    .map(a => {
      const synced = data.articles.find(x => x.id === a.id || x._id === a.id || x.id === a._id || x._id === a._id);
      if (synced) {
        return {
          ...a,
          likes: synced.likes,
          bookmarks: synced.bookmarks,
          views: synced.views
        };
      }
      return a;
    });

  return (
    <CategoryLanding
      category={category}
      allCategories={data.categories}
      allArticles={articles}
      incrementArticle={incrementArticle}
    />
  );
};

export default CategoryPage;
