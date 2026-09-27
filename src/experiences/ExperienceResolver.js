import React from "react";
import DefaultExperience from "./default/DefaultExperience";
import LifeExperience from "./life/LifeExperience";
import CodingExperience from "./coding/CodingExperience";
import TravelExperience from "./travel/TravelExperience";
import IncidentsExperience from "./incidents/IncidentsExperience";
import LessonsExperience from "./lessons/LessonsExperience";
import "./shared/articleReader.css";
import { decodeHtmlEntities } from "../utils/helpers";

const EXPERIENCE_MAP = {
  // Experience / Incidents category mappings
  incidents: IncidentsExperience,
  experiences: IncidentsExperience,
  experience: IncidentsExperience,
  "real-life": IncidentsExperience,
  "real-life-events": IncidentsExperience,
  events: IncidentsExperience,
  postmortems: IncidentsExperience,
  outages: IncidentsExperience,
  "post-mortems": IncidentsExperience,
  systemfailures: IncidentsExperience,
  stories: IncidentsExperience,
  memories: IncidentsExperience,
  memoir: IncidentsExperience,

  // Other categories
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
  lessons: LessonsExperience,
  reflections: LifeExperience,
  growth: LifeExperience,
  philosophy: LifeExperience,
  mindset: LifeExperience,
  wisdom: LifeExperience,
};

const ExperienceResolver = (props) => {
  const categorySlug = props.article?.categorySlug || props.article?.category?.toLowerCase() || "";
  const cleanSlug = categorySlug.trim().toLowerCase();
  
  const ExperienceComponent = EXPERIENCE_MAP[cleanSlug] || DefaultExperience;

  const headings = ExperienceComponent === CodingExperience
    ? props.headings
    : (props.headings || []).map((heading) => ({ ...heading, text: decodeHtmlEntities(heading.text) }));
  return <ExperienceComponent {...props} headings={headings} />;
};

export default ExperienceResolver;
