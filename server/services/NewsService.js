const axios = require("axios");
const settingRepository = require("../repositories/settingRepository");

// Curated static fallback articles for offline/rate-limited/failure recovery scenarios
const STATIC_FALLBACK_HEADLINES = [
  {
    id: "fb-1",
    title: "The Art of Slow Living in a Fast-Paced World",
    description: "How modern communities are embracing slower rhythms, intentional digital disconnects, and returning to analog craftsmanship to find balance.",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80",
    source: "Global Chronicle",
    author: "Elena Rostova",
    publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    url: "https://unsplash.com",
    category: "world",
    readingTime: "4 min read",
    isExternal: true
  },
  {
    id: "fb-2",
    title: "Quantum Computing Achieves New Stability Milestone",
    description: "Research laboratories announce breakthroughs in silicon quantum dot coherence times, moving closer to commercially viable error-corrected computation.",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    source: "Tech Spectrum",
    author: "Dr. Julian Vance",
    publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    url: "https://unsplash.com",
    category: "technology",
    readingTime: "5 min read",
    isExternal: true
  },
  {
    id: "fb-3",
    title: "Deep Space Telescope Discovers Atmosphere on Earth-Sized Exoplanet",
    description: "Astronomers detect signatures of carbon dioxide and methane in the atmosphere of a nearby rocky planet orbiting a stable red dwarf star.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    source: "Astrophysics Journal",
    author: "Sarah Jenkins",
    publishedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    url: "https://unsplash.com",
    category: "science",
    readingTime: "6 min read",
    isExternal: true
  },
  {
    id: "fb-4",
    title: "Global Markets Stabilize as Inflation Fears Ease",
    description: "Central banks signal a shift toward interest rate normalization as supply chains fully stabilize and wage growth aligns with historical averages.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    source: "Financial Review",
    author: "David Miller",
    publishedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    url: "https://unsplash.com",
    category: "business",
    readingTime: "3 min read",
    isExternal: true
  },
  {
    id: "fb-5",
    title: "New International Agreement Aims to Protect High Seas Biodiversity",
    description: "Over one hundred nations sign a historic treaty establishing marine protected areas and environmental review standards in international waters.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    source: "World Sentinel",
    author: "Marcus Aurel",
    publishedAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    url: "https://unsplash.com",
    category: "world",
    readingTime: "5 min read",
    isExternal: true
  }
];

class NewsService {
  constructor() {
    this.cache = new Map();
    this.cacheDurationMs = 15 * 60 * 1000; // Default 15 minutes
  }

  // Retrieve cached data if valid
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDurationMs) {
      console.log(`[NewsService] Cache hit for key: ${key}`);
      return cached.data;
    }
    return null;
  }

  // Write data to cache
  setCache(key, data) {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }

  // Get active system news settings
  async getNewsSettings() {
    const raw = await settingRepository.findByKey("news_settings");
    const defaults = {
      enabled: true,
      provider: process.env.NEWS_PROVIDER || "rss",
      cacheDuration: 15,
      maxHeadlines: 12,
      defaultCategories: ["world", "technology", "science", "business", "politics", "health", "sports"],
      featuredProvider: "rss"
    };

    if (raw && raw.value) {
      return { ...defaults, ...raw.value };
    }
    return defaults;
  }

  // Clean and limit excerpt text to 2-3 lines
  trimExcerpt(text, limit = 200) {
    if (!text || typeof text !== "string") return "Read full story at original source...";
    const cleaned = text.replace(/<[^>]*>/g, "").trim();
    if (cleaned.length <= limit) return cleaned;
    return cleaned.slice(0, limit) + "...";
  }

  // Normalize articles into common schema
  normalize(rawItem, provider, category) {
    const id = rawItem.guid || rawItem.id || rawItem.url || Math.random().toString(36).substring(7);
    const title = rawItem.title || "Breaking News Alert";
    const description = this.trimExcerpt(rawItem.description || rawItem.excerpt || rawItem.trailText || rawItem.content);
    const publishedAt = rawItem.pubDate || rawItem.publishedAt || rawItem.webPublicationDate || new Date().toISOString();
    const url = rawItem.link || rawItem.url || rawItem.webUrl || "#";
    
    // Fallback Image Map based on category
    const categoryFallbacks = {
      world: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      science: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      business: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
      politics: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
      health: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
      sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80"
    };

    let image = rawItem.thumbnail || rawItem.image || (rawItem.enclosure && rawItem.enclosure.link) || null;
    if (provider === "newsapi" && rawItem.urlToImage) image = rawItem.urlToImage;
    if (provider === "mediastack" && rawItem.image) image = rawItem.image;
    if (provider === "guardian" && rawItem.fields && rawItem.fields.thumbnail) image = rawItem.fields.thumbnail;
    
    if (!image) {
      image = categoryFallbacks[category.toLowerCase()] || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
    }

    let source = "Global Press";
    if (rawItem.source) {
      source = typeof rawItem.source === "object" ? rawItem.source.name : rawItem.source;
    } else if (provider === "rss" && rawItem.author) {
      source = rawItem.author;
    } else if (provider === "guardian") {
      source = "The Guardian";
    }

    const author = rawItem.author || rawItem.creator || source;

    return {
      id,
      title,
      description,
      image,
      source,
      author,
      publishedAt,
      url,
      category: category.toLowerCase(),
      readingTime: "3 min read",
      isExternal: true
    };
  }

  // Fetch news using the active provider
  async fetchArticles(category = "world", query = "") {
    const settings = await this.getNewsSettings();
    this.cacheDurationMs = (settings.cacheDuration || 15) * 60 * 1000;

    if (!settings.enabled) {
      console.log("[NewsService] News module is disabled. Returning fallback headlines.");
      return STATIC_FALLBACK_HEADLINES;
    }

    const provider = settings.provider || "rss";
    const cacheKey = `${provider}_${category}_${query.trim().toLowerCase()}`;

    // 1. Check cache first
    const cachedData = this.getCache(cacheKey);
    if (cachedData) return cachedData;

    // 2. Fetch from active provider
    try {
      let articles = [];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second network timeout

      if (provider === "rss") {
        articles = await this.fetchFromRss(category, query, controller.signal);
      } else if (provider === "newsapi") {
        articles = await this.fetchFromNewsApi(category, query, controller.signal);
      } else if (provider === "gnews") {
        articles = await this.fetchFromGNews(category, query, controller.signal);
      } else if (provider === "mediastack") {
        articles = await this.fetchFromMediastack(category, query, controller.signal);
      } else if (provider === "guardian") {
        articles = await this.fetchFromGuardian(category, query, controller.signal);
      }

      clearTimeout(timeoutId);

      if (articles && articles.length > 0) {
        // Enforce limit
        const limited = articles.slice(0, settings.maxHeadlines || 12);
        this.setCache(cacheKey, limited);
        return limited;
      }
    } catch (err) {
      console.error(`[NewsService] Fetch failed using provider "${provider}":`, err.message);
    }

    // 3. Fallback: check map for any stale cache key matching category
    console.log("[NewsService] Remote fetch failed. Searching for stale cache fallback...");
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(`_${category}_`)) {
        console.log(`[NewsService] Recovered stale cache for category "${category}": ${key}`);
        return value.data;
      }
    }

    // 4. Ultimate fallback: static curated news
    console.log("[NewsService] Returning static fallback headlines.");
    return STATIC_FALLBACK_HEADLINES.filter(h => h.category === category || category === "world" || category === "all");
  }

  // --- Individual Provider Implementations ---

  async fetchFromRss(category, query, signal) {
    // Map categories to BBC RSS feeds
    const feeds = {
      world: "https://feeds.bbci.co.uk/news/world/rss.xml",
      technology: "https://feeds.bbci.co.uk/news/technology/rss.xml",
      science: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
      business: "https://feeds.bbci.co.uk/news/business/rss.xml",
      politics: "https://feeds.bbci.co.uk/news/politics/rss.xml",
      health: "https://feeds.bbci.co.uk/news/health/rss.xml",
      sports: "https://feeds.bbci.co.uk/news/world/rss.xml" // Fallback to world for sports RSS
    };

    const targetRss = feeds[category.toLowerCase()] || feeds.world;
    const parserUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetRss)}`;

    const res = await axios.get(parserUrl, { signal });
    if (res.data && res.data.status === "ok" && Array.isArray(res.data.items)) {
      let items = res.data.items;
      if (query.trim()) {
        const q = query.toLowerCase();
        items = items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q)));
      }
      return items.map(i => this.normalize(i, "rss", category));
    }
    return [];
  }

  async fetchFromNewsApi(category, query, signal) {
    const key = process.env.NEWS_API_KEY;
    if (!key) throw new Error("NEWS_API_KEY is missing in .env");

    // NewsAPI category mapping
    const catMap = {
      world: "general",
      technology: "technology",
      science: "science",
      business: "business",
      politics: "general",
      health: "health",
      sports: "sports"
    };

    const newsCategory = catMap[category.toLowerCase()] || "general";
    let url = `https://newsapi.org/v2/top-headlines?apiKey=${key}&language=en&category=${newsCategory}`;
    if (query.trim()) {
      url = `https://newsapi.org/v2/everything?apiKey=${key}&language=en&q=${encodeURIComponent(query)}`;
    }

    const res = await axios.get(url, { signal });
    if (res.data && Array.isArray(res.data.articles)) {
      return res.data.articles.map(a => this.normalize(a, "newsapi", category));
    }
    return [];
  }

  async fetchFromGNews(category, query, signal) {
    const key = process.env.GNEWS_API_KEY;
    if (!key) throw new Error("GNEWS_API_KEY is missing in .env");

    const catMap = {
      world: "general",
      technology: "technology",
      science: "science",
      business: "business",
      politics: "nation",
      health: "health",
      sports: "sports"
    };

    const gCategory = catMap[category.toLowerCase()] || "general";
    let url = `https://gnews.io/api/v4/top-headlines?token=${key}&lang=en&category=${gCategory}`;
    if (query.trim()) {
      url = `https://gnews.io/api/v4/search?token=${key}&lang=en&q=${encodeURIComponent(query)}`;
    }

    const res = await axios.get(url, { signal });
    if (res.data && Array.isArray(res.data.articles)) {
      return res.data.articles.map(a => this.normalize(a, "gnews", category));
    }
    return [];
  }

  async fetchFromMediastack(category, query, signal) {
    const key = process.env.MEDIASTACK_API_KEY;
    if (!key) throw new Error("MEDIASTACK_API_KEY is missing in .env");

    const catMap = {
      world: "general",
      technology: "technology",
      science: "science",
      business: "business",
      politics: "politics",
      health: "health",
      sports: "sports"
    };

    const mCategory = catMap[category.toLowerCase()] || "general";
    let url = `http://api.mediastack.com/v1/news?access_key=${key}&languages=en&categories=${mCategory}`;
    if (query.trim()) {
      url += `&keywords=${encodeURIComponent(query)}`;
    }

    const res = await axios.get(url, { signal });
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data.map(a => this.normalize(a, "mediastack", category));
    }
    return [];
  }

  async fetchFromGuardian(category, query, signal) {
    const key = process.env.GUARDIAN_API_KEY;
    if (!key) throw new Error("GUARDIAN_API_KEY is missing in .env");

    const sectionMap = {
      world: "world",
      technology: "technology",
      science: "science",
      business: "business",
      politics: "politics",
      health: "society",
      sports: "sport"
    };

    const section = sectionMap[category.toLowerCase()] || "world";
    let url = `https://content.guardianapis.com/search?api-key=${key}&section=${section}&show-fields=thumbnail,trailText`;
    if (query.trim()) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const res = await axios.get(url, { signal });
    if (res.data && res.data.response && Array.isArray(res.data.response.results)) {
      return res.data.response.results.map(r => this.normalize(r, "guardian", category));
    }
    return [];
  }
}

module.exports = new NewsService();
