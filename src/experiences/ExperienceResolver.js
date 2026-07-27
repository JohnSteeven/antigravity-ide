import React from "react";
import DefaultExperience from "./default/DefaultExperience";
import LifeExperience from "./life/LifeExperience";
import CodingExperience from "./coding/CodingExperience";

const EXPERIENCE_MAP = {
  life: LifeExperience,
  coding: CodingExperience,
  development: CodingExperience,
  technology: CodingExperience,
  tech: CodingExperience,
};

const ExperienceResolver = (props) => {
  const slug = props.article?.categorySlug || props.article?.category?.toLowerCase();
  const ExperienceComponent = EXPERIENCE_MAP[slug] || DefaultExperience;
  return <ExperienceComponent {...props} />;
};

export default ExperienceResolver;
