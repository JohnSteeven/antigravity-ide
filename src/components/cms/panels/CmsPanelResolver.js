import React from "react";
import LifeCmsPanel from "./LifeCmsPanel";
import ReflectionsCmsPanel from "./ReflectionsCmsPanel";
import ExperiencesCmsPanel from "./ExperiencesCmsPanel";
import LessonsCmsPanel from "./LessonsCmsPanel";
import CodingCmsPanel from "./CodingCmsPanel";
import TravelCmsPanel from "./TravelCmsPanel";
import NewsCmsPanel from "./NewsCmsPanel";

const PANEL_MAP = {
  life: LifeCmsPanel,
  reflections: ReflectionsCmsPanel,
  experiences: ExperiencesCmsPanel,
  incidents: ExperiencesCmsPanel,
  postmortems: ExperiencesCmsPanel,
  outages: ExperiencesCmsPanel,
  "post-mortems": ExperiencesCmsPanel,
  systemfailures: ExperiencesCmsPanel,
  lessons: LessonsCmsPanel,
  growth: LessonsCmsPanel,
  philosophy: LessonsCmsPanel,
  mindset: LessonsCmsPanel,
  wisdom: LessonsCmsPanel,
  coding: CodingCmsPanel,
  development: CodingCmsPanel,
  technology: CodingCmsPanel,
  tech: CodingCmsPanel,
  travel: TravelCmsPanel,
  adventures: TravelCmsPanel,
  journeys: TravelCmsPanel,
  destinations: TravelCmsPanel,
  trips: TravelCmsPanel,
  news: NewsCmsPanel,
};

const CmsPanelResolver = ({ articleDraft, update }) => {
  if (!articleDraft) return null;
  const categoryRaw = articleDraft.category || "";
  const slug = String(categoryRaw).trim().toLowerCase();

  const PanelComponent = PANEL_MAP[slug];
  if (!PanelComponent) return null;

  return <PanelComponent articleDraft={articleDraft} update={update} />;
};

export default CmsPanelResolver;
