import { createContext, useContext, useMemo } from "react";
import { useContentCms, ContentCmsProvider } from "./ContentCmsContext";
import { useMediaCms, MediaCmsProvider } from "./MediaCmsContext";
import { useEngagementCms, EngagementCmsProvider } from "./EngagementCmsContext";
import { useAccessCms, AccessCmsProvider } from "./AccessCmsContext";
import { useSiteCms, SiteCmsProvider } from "./SiteCmsContext";

const CmsContext = createContext(null);

const CmsContextOrchestrator = ({ children }) => {
  const content = useContentCms();
  const media = useMediaCms();
  const engagement = useEngagementCms();
  const access = useAccessCms();
  const site = useSiteCms();

  const combinedData = useMemo(() => ({
    articles: content.articles,
    categories: content.categories,
    subcategories: content.subcategories,
    tags: content.tags,
    story: content.story,
    timeline: content.timeline,
    projects: content.projects,
    skills: content.skills,
    stats: content.stats,
    site: content.site,
    media: media.media,
    comments: engagement.comments,
    testimonials: engagement.testimonials,
    subscribers: engagement.subscribers,
    users: access.users,
    roles: access.roles,
    settings: site.settings,
    backups: site.backups,
    logs: site.logs,
  }), [content, media, engagement, access, site]);

  const combinedActions = useMemo(() => ({
    ...content,
    ...media,
    ...engagement,
    ...access,
    ...site,
  }), [content, media, engagement, access, site]);

  // Backward compatibility structure for analytics
  const analytics = useMemo(() => {
    const publishedArticles = content.articles.filter((a) => a.status === "published");
    const draftArticles = content.articles.filter((a) => a.status === "draft");
    const scheduledArticles = content.articles.filter((a) => a.status === "scheduled");
    const archivedArticles = content.articles.filter((a) => a.status === "archived");

    const mappedComments = engagement.comments.map((c) => ({
      ...c,
      id: c._id || c.id,
      articleTitle: c.articleId?.title || "Unknown Article",
      articleId: c.articleId?._id || c.articleId?.id || c.articleId,
      text: c.body,
      name: c.authorName || "Reader",
    }));

    return {
      articleCount: content.articles.length,
      publishedCount: publishedArticles.length,
      draftCount: draftArticles.length,
      scheduledCount: scheduledArticles.length,
      archivedCount: archivedArticles.length,
      views: content.articles.reduce((sum, a) => sum + Number(a.views || 0), 0),
      likes: content.articles.reduce((sum, a) => sum + Number(a.likes || 0), 0),
      bookmarks: content.articles.reduce((sum, a) => sum + Number(a.bookmarks || 0), 0),
      subscribers: engagement.subscribers.length,
      comments: mappedComments,
      pendingComments: mappedComments.filter((c) => c.status === "pending").length,
      tagCount: content.tags.length,
      categoryCount: content.categories.length,
      mediaCount: media.media.length,
    };
  }, [content, media, engagement]);

  const value = useMemo(() => ({
    data: combinedData,
    analytics,
    syncStatus: content.syncStatus, // content sync status as default
    ...combinedActions
  }), [combinedData, analytics, content.syncStatus, combinedActions]);

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const CmsProvider = ({ children }) => {
  return (
    <ContentCmsProvider>
      <MediaCmsProvider>
        <EngagementCmsProvider>
          <AccessCmsProvider>
            <SiteCmsProvider>
              <CmsContextOrchestrator>
                {children}
              </CmsContextOrchestrator>
            </SiteCmsProvider>
          </AccessCmsProvider>
        </EngagementCmsProvider>
      </MediaCmsProvider>
    </ContentCmsProvider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error("useCms must be used inside CmsProvider");
  return context;
};
