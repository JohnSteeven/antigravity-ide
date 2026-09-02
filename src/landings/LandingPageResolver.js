import React from "react";
import DefaultLanding from "./default/DefaultLanding";
import LifeLanding from "./life/LifeLanding";
import ReflectionsLanding from "./reflections/ReflectionsLanding";
import ExperiencesLanding from "./experiences/ExperiencesLanding";
import LessonsLanding from "./lessons/LessonsLanding";
import CodingLanding from "./coding/CodingLanding";
import TravelLanding from "./travel/TravelLanding";
import NewsLanding from "./news/NewsLanding";

const LANDING_MAP = {
  life: LifeLanding,
  reflections: ReflectionsLanding,
  experiences: ExperiencesLanding,
  incidents: ExperiencesLanding,
  postmortems: ExperiencesLanding,
  lessons: LessonsLanding,
  coding: CodingLanding,
  travel: TravelLanding,
  news: NewsLanding,
};

const LandingPageResolver = (props) => {
  const slug = String(props.category?.slug || props.category?.name || "").toLowerCase();
  const LandingComponent = LANDING_MAP[slug] || DefaultLanding;
  return <LandingComponent {...props} />;
};

export default LandingPageResolver;
