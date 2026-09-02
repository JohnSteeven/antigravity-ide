import React from "react";
import DefaultCard from "./default/DefaultCard";
import LifeCard from "./life/LifeCard";
import ReflectionsCard from "./reflections/ReflectionsCard";
import ExperiencesCard from "./experiences/ExperiencesCard";
import LessonsCard from "./lessons/LessonsCard";
import CodingCard from "./coding/CodingCard";
import TravelCard from "./travel/TravelCard";
import NewsCard from "./news/NewsCard";

const CARD_MAP = {
  life: LifeCard,
  reflections: ReflectionsCard,
  experiences: ExperiencesCard,
  incidents: ExperiencesCard,
  lessons: LessonsCard,
  coding: CodingCard,
  travel: TravelCard,
  news: NewsCard,
};

const CardResolver = (props) => {
  const articleData = props.articleData || props.article || props;
  const categoryRaw = articleData?.category || props.category || "";
  const slug = String(categoryRaw).trim().toLowerCase();

  const CardComponent = CARD_MAP[slug] || DefaultCard;
  return <CardComponent {...props} articleData={articleData} />;
};

export default CardResolver;
