export const DEFAULT_WIDGETS = {
  life: {
    leftSidebar: ["TableOfContents", "ReadingProgress", "FavoriteQuote"],
    rightSidebar: ["AuthorCard", "ShareButtons", "RelatedArticles", "NewsletterPanel", "LifeCollections"],
    bottomExperience: ["LifeLessons", "ReflectionQuestions", "Comments"],
  },
  coding: {
    leftSidebar: ["TableOfContents", "ProjectStructure", "APINavigation"],
    rightSidebar: ["GitHubWidget", "NpmWidget", "OfficialDocs", "DifficultyMeter", "ShareButtons"],
    bottomExperience: ["Exercises", "Quiz", "Downloads", "RelatedTutorials"],
  },
  travel: {
    leftSidebar: ["TripTimeline", "MapNavigation", "TripProgress"],
    rightSidebar: ["WeatherWidget", "CurrencyWidget", "TravelTips", "ShareButtons"],
    bottomExperience: ["TravelChecklist", "SuggestedTrips", "Reviews"],
  },
  reflections: {
    leftSidebar: ["MoodTimeline", "JournalNavigation"],
    rightSidebar: ["DailyQuote", "MoodTracker", "ReadingTime"],
    bottomExperience: ["WriteReflection", "CommunityReflections", "Comments"],
  },
  news: {
    leftSidebar: ["BreakingUpdates", "LatestHeadlines"],
    rightSidebar: ["LiveUpdates", "FactCheck", "ShareButtons", "NewsletterPanel"],
    bottomExperience: ["BackgroundContext", "FullTimeline", "Comments"],
  },
  lessons: {
    leftSidebar: ["LessonNavigation", "TableOfContents"],
    rightSidebar: ["Resources", "Downloads", "Glossary"],
    bottomExperience: ["Summary", "Assignments", "Quiz", "NextLesson"],
  },
  incidents: {
    leftSidebar: ["Timeline", "StoryChapters"],
    rightSidebar: ["AuthorCard", "ShareButtons", "Collections"],
    bottomExperience: ["Comments", "Discussion"],
  },
  default: {
    leftSidebar: ["TableOfContents", "ReadingProgress"],
    rightSidebar: ["AuthorCard", "ShareButtons", "RelatedArticles", "NewsletterPanel"],
    bottomExperience: ["Comments"],
  },
};

export const getWidgetsForExperience = (experienceTemplate, customConfig) => {
  if (customConfig && customConfig.enabledWidgets) {
    return customConfig.enabledWidgets;
  }
  return DEFAULT_WIDGETS[experienceTemplate] || DEFAULT_WIDGETS.default;
};
