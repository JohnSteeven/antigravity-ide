import React from "react";
import DefaultExperience from "./default/DefaultExperience";
import LifeExperience from "./life/LifeExperience";
import CodingExperience from "./coding/CodingExperience";
import TravelExperience from "./travel/TravelExperience";
import IncidentsExperience from "./incidents/IncidentsExperience";
import LessonsExperience from "./lessons/LessonsExperience";

const EXPERIENCE_MAP = {
  life: LifeExperience,
  coding: CodingExperience,
  development: CodingExperience,
  technology: CodingExperience,
  tech: CodingExperience,
  travel: TravelExperience,
  adventures: TravelExperience,
  journeys: TravelExperience,
  destinations: TravelExperience,
  trips: TravelExperience,
  incidents: IncidentsExperience,
  postmortems: IncidentsExperience,
  outages: IncidentsExperience,
  "post-mortems": IncidentsExperience,
  systemfailures: IncidentsExperience,
  lessons: LessonsExperience,
  reflections: LessonsExperience,
  growth: LessonsExperience,
  philosophy: LessonsExperience,
  mindset: LessonsExperience,
  wisdom: LessonsExperience,
};

const ExperienceResolver = (props) => {
  const slug = props.article?.categorySlug || props.article?.category?.toLowerCase();
  const ExperienceComponent = EXPERIENCE_MAP[slug] || DefaultExperience;
  return <ExperienceComponent {...props} />;
};

export default ExperienceResolver;
