export const EXPERIENCE_TEMPLATES = {
  DEFAULT: "default",
  LIFE: "life",
  CODING: "coding",
  TRAVEL: "travel",
  REFLECTIONS: "reflections",
  NEWS: "news",
  LESSONS: "lessons",
  INCIDENTS: "incidents",
};

export const experienceConfig = {
  life: {
    template: EXPERIENCE_TEMPLATES.LIFE,
    theme: {
      accentColor: "#a85f49",
      fontFamily: "Playfair Display, Georgia, serif",
      heroStyle: "immersive",
      animationProfile: "life",
    },
  },
  coding: {
    template: EXPERIENCE_TEMPLATES.CODING,
    theme: {
      accentColor: "#14b8a6",
      fontFamily: "JetBrains Mono, monospace",
      heroStyle: "dark",
      animationProfile: "coding",
    },
  },
  travel: {
    template: EXPERIENCE_TEMPLATES.TRAVEL,
    theme: {
      accentColor: "#f59e0b",
      fontFamily: "Oswald, sans-serif",
      heroStyle: "fullscreen",
      animationProfile: "travel",
    },
  },
  reflections: {
    template: EXPERIENCE_TEMPLATES.REFLECTIONS,
    theme: {
      accentColor: "#8b7355",
      fontFamily: "Cormorant Garamond, serif",
      heroStyle: "minimal",
      animationProfile: "reflections",
    },
  },
  news: {
    template: EXPERIENCE_TEMPLATES.NEWS,
    theme: {
      accentColor: "#1e40af",
      fontFamily: "Inter, sans-serif",
      heroStyle: "news-16-9",
      animationProfile: "news",
    },
  },
  lessons: {
    template: EXPERIENCE_TEMPLATES.LESSONS,
    theme: {
      accentColor: "#7c3aed",
      fontFamily: "Inter, sans-serif",
      heroStyle: "standard",
      animationProfile: "lessons",
    },
  },
  incidents: {
    template: EXPERIENCE_TEMPLATES.INCIDENTS,
    theme: {
      accentColor: "#dc2626",
      fontFamily: "Merriweather, serif",
      heroStyle: "standard",
      animationProfile: "incidents",
    },
  },
};

export const getExperienceConfig = (categorySlug) => {
  const slug = String(categorySlug || "").trim().toLowerCase();
  return experienceConfig[slug] || {
    template: EXPERIENCE_TEMPLATES.DEFAULT,
    theme: {
      accentColor: "",
      fontFamily: "",
      heroStyle: "standard",
      animationProfile: "default",
    },
  };
};
