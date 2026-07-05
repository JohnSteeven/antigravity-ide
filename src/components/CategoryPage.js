import { Navigate, useParams } from "react-router-dom";
import { categoryBlueprintBySlug } from "../domain/knowledgeArchitecture";
import { useCms } from "../context/CmsContext";
import CategoryLanding from "../features/categories/CategoryLanding";

const CategoryPage = () => {
  const { slug } = useParams();
  const { data, incrementArticle } = useCms();
  const category =
    data.categories.find((item) => item.slug === slug) || categoryBlueprintBySlug[slug];

  if (!category) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <CategoryLanding
      category={category}
      allCategories={data.categories}
      allArticles={data.articles}
      incrementArticle={incrementArticle}
    />
  );
};

export default CategoryPage;
