import React from "react";
import DefaultExperience from "./default/DefaultExperience";
import LifeExperience from "./life/LifeExperience";

const EXPERIENCE_MAP = {
  life: LifeExperience,
  // To be populated in subsequent phases:
  // coding: CodingExperience,
  // travel: TravelExperience,
  // reflections: ReflectionsExperience,
  // news: NewsExperience,
  // lessons: LessonsExperience,
  // incidents: IncidentsExperience,
};

const ExperienceResolver = (props) => {
  const slug = props.article?.categorySlug || props.article?.category?.toLowerCase();
  const ExperienceComponent = EXPERIENCE_MAP[slug] || DefaultExperience;
  return <ExperienceComponent {...props} />;
};

export default ExperienceResolver;
