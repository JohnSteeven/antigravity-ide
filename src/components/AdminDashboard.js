import React, { useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useCms } from "../context/CmsContext";
import CmsLayout from "./layout/CmsLayout";

// Import modules
import DashboardOverview from "./cms/DashboardOverview";
import ArticleModule from "./cms/ArticleModule";
import StoryCmsPanel from "./cms/panels/StoryCmsPanel";
import CreatorReviewModule from "./cms/CreatorReviewModule.jsx";
import CategoryModule from "./cms/CategoryModule";
import SubCategoryModule from "./cms/SubCategoryModule";
import TagModule from "./cms/TagModule";
import MediaLibraryModule from "./cms/MediaLibraryModule";
import CommentModule from "./cms/CommentModule";
import UserModule from "./cms/UserModule";
import RoleModule from "./cms/RoleModule";
import PermissionModule from "./cms/PermissionModule";
import ProfileModule from "./cms/ProfileModule";
import ActivityLogModule from "./cms/ActivityLogModule";
import HomepageModule from "./cms/HomepageModule";
import NavigationModule from "./cms/NavigationModule";
import NavigationBuilderModule from "./cms/NavigationBuilderModule";
import FooterModule from "./cms/FooterModule";
import TestimonialModule from "./cms/TestimonialModule";
import GalleryModule from "./cms/GalleryModule";
import NewsletterModule from "./cms/NewsletterModule";
import ContactModule from "./cms/ContactModule";
import BackupModule from "./cms/BackupModule";
import SiteSettingsModule from "./cms/SiteSettingsModule";
import ProjectModule from "./cms/ProjectModule";
import SkillModule from "./cms/SkillModule";
import TimelineModule from "./cms/TimelineModule";
import NewsSettingsModule from "./cms/NewsSettingsModule";
import FeatureFlagModule from "./cms/FeatureFlagModule";
import SettingsRegistryModule from "./cms/SettingsRegistryModule";
import LayoutManagerModule from "./cms/LayoutManagerModule";
import WebsiteBuilderModule from "./cms/WebsiteBuilderModule";
import ThemeBuilderModule from "./cms/ThemeBuilderModule";
import DesignTokenModule from "./cms/DesignTokenModule";
import ComponentLibraryModule from "./cms/ComponentLibraryModule";
import ContentTypeManagerModule from "./cms/ContentTypeManagerModule";
import NavigationIntelligenceModule from "./cms/NavigationIntelligenceModule";
import WorkflowManagerModule from "./cms/WorkflowManagerModule";
import VersionControlModule from "./cms/VersionControlModule";
import AutomationSchedulerModule from "./cms/AutomationSchedulerModule";
import FormBuilderModule from "./cms/FormBuilderModule";
import PluginManagerModule from "./cms/PluginManagerModule";
import PersonalizedDashboardModule from "./cms/PersonalizedDashboardModule";
import SEOIntelligenceModule from "./cms/SEOIntelligenceModule";
import AnalyticsInsightsModule from "./cms/AnalyticsInsightsModule";
import TranslationManagerModule from "./cms/TranslationManagerModule";
// ── Stage 3: AI Intelligence ──────────────────────────────────────────────────
import AIProviderModule from "./cms/AIProviderModule";
import AIWriterModule from "./cms/AIWriterModule";
import PromptManagerModule from "./cms/PromptManagerModule";
import AIAnalyticsModule from "./cms/AIAnalyticsModule";
import AIAssistantModule from "./cms/AIAssistantModule";
import SmartSEOModule from "./cms/SmartSEOModule";
import RecommendationModule from "./cms/RecommendationModule";
// ── Stage 4: Reader Platform ──────────────────────────────────────────────────
import MembershipModule from "./cms/MembershipModule";
import CommunityModule from "./cms/CommunityModule";
import DistributionModule from "./cms/DistributionModule";
// ── Stage 5: Search & Knowledge Graph ─────────────────────────────────────────
import EnterpriseSearchModule from "./cms/EnterpriseSearchModule";
import DeveloperPortalModule from "./cms/DeveloperPortalModule";
import TenantManagerModule from "./cms/TenantManagerModule";
// ── Stage 6: Enterprise Security ──────────────────────────────────────────────
import GovernanceModule from "./cms/GovernanceModule";
import InfrastructureModule from "./cms/InfrastructureModule";
import LaunchCenterModule from "./cms/LaunchCenterModule";


const MODULE_TITLES = {
  overview: { kicker: "Dashboard", title: "Overview & Analytics" },
  articles: { kicker: "Writing", title: "Articles & Drafts" },
  stories: { kicker: "Narrative", title: "Stories & Reading Layouts" },
  creators: { kicker: "Creator platform", title: "Creator Applications & Editorial Review" },
  categories: { kicker: "Structure", title: "Category Management" },
  subcategories: { kicker: "Structure", title: "Subcategory Management" },
  tags: { kicker: "Taxonomy", title: "Tag List" },
  media: { kicker: "Assets", title: "Media Library" },
  comments: { kicker: "Moderation", title: "Comments List" },
  users: { kicker: "AccessControl", title: "Users List" },
  roles: { kicker: "AccessControl", title: "Roles List" },
  permissions: { kicker: "AccessControl", title: "Permissions List" },
  profile: { kicker: "Account", title: "My Profile" },
  logs: { kicker: "Audit", title: "Activity Logs" },
  hero: { kicker: "Homepage", title: "Hero Welcome Banner" },
  quotes: { kicker: "Homepage", title: "Quotes Configuration" },
  navigation: { kicker: "Experience", title: "Navigation Menu Layout" },
  footer: { kicker: "Experience", title: "Footer Branding" },
  testimonials: { kicker: "Homepage", title: "Client Testimonials" },
  gallery: { kicker: "Homepage", title: "Gallery Album Grid" },
  newsletters: { kicker: "Engagement", title: "Newsletter Campaigns" },
  contact: { kicker: "Engagement", title: "Contact Form Submissions" },
  backups: { kicker: "Database", title: "System Snapshots" },
  settings: { kicker: "Site settings", title: "General Configuration Options" },
  "news-settings": { kicker: "Global News", title: "News Integration & Analytics Dashboard" },
  analytics: { kicker: "Experience", title: "Analytics & Traffic Insights" },
  seo: { kicker: "Experience", title: "Search Engine Optimization (SEO)" },
  homepage: { kicker: "Experience", title: "Homepage Layout & Content" },
  projects: { kicker: "Portfolio", title: "Projects List" },
  skills: { kicker: "Expertise", title: "Skills List" },
  timeline: { kicker: "Portfolio", title: "Timeline Management" },
  features: { kicker: "Operations", title: "Feature Flags Manager" },
  "settings-registry": { kicker: "Operations", title: "Settings Registry" },
  layouts: { kicker: "Experience", title: "Layout Engine Manager" },
  "website-builder": { kicker: "Experience", title: "Website Builder & Page Engine" },
  "theme-builder": { kicker: "Experience", title: "Design System Engine" },
  "design-tokens": { kicker: "Experience", title: "Enterprise Design Tokens System" },
  components: { kicker: "Experience", title: "Component Library & Block Marketplace" },
  "content-modeling": { kicker: "Headless CMS", title: "Enterprise Content Modeling Engine" },
  "navigation-intelligence": { kicker: "Experience", title: "Enterprise Navigation Intelligence Engine" },
  workflow: { kicker: "Stage 2 Engine", title: "Enterprise Editorial Workflow & Publishing Engine" },
  "version-control": { kicker: "Stage 2 Engine", title: "Enterprise Unified Version Control System" },
  automation: { kicker: "Stage 2 Engine", title: "Enterprise Content Scheduler & Automation Engine" },
  forms: { kicker: "Stage 2 Engine", title: "Enterprise Dynamic Form Builder & Lead Management" },
  plugins: { kicker: "Stage 2 Engine", title: "Enterprise Plugin Platform & Extension Marketplace" },
  workspace: { kicker: "Stage 2 Engine", title: "Enterprise Dashboard, Widget System & Workspace Platform" },
  seo: { kicker: "Stage 2 Engine", title: "Enterprise SEO Intelligence & Search Optimization Engine" },
  analytics: { kicker: "Stage 2 Engine", title: "Enterprise Content Intelligence & Reader Analytics Engine" },
  localization: { kicker: "Stage 2 Engine", title: "Enterprise Localization, Internationalization & Translation Engine" },
  i18n: { kicker: "Stage 2 Engine", title: "Translation Manager & Locale Packs" },
  insights: { kicker: "Stage 2 Engine", title: "DXP Conversion Funnel & Insights" },
  sitemap: { kicker: "Stage 2 Engine", title: "XML Sitemap & Search Indexing" },
  widgets: { kicker: "Stage 2 Engine", title: "Self-Registered Widget Library" },
  marketplace: { kicker: "Stage 2 Engine", title: "Plugin Store & Extensions" },
  leads: { kicker: "Stage 2 Engine", title: "Lead Inbox & Pipeline Management" },
  scheduler: { kicker: "Stage 2 Engine", title: "Content Scheduler Queue" },
  revisions: { kicker: "Stage 2 Engine", title: "Revision History & Rollback" },
  "content-types": { kicker: "Headless CMS", title: "Content Type Schema Builder" },
  blocks: { kicker: "Experience", title: "Block Registry" },
  tokens: { kicker: "Experience", title: "Design Tokens" },
  pages: { kicker: "Experience", title: "Page Manager" },
  "ai-providers": { kicker: "Stage 3 AI", title: "AI Provider Manager" },
  "ai-writer": { kicker: "Stage 3 AI", title: "AI Writing Assistant" },
  "ai-prompts": { kicker: "Stage 3 AI", title: "Prompt Manager" },
  "ai-analytics": { kicker: "Stage 3 AI", title: "AI Usage & Performance Analytics" },
  "ai-assistant": { kicker: "Stage 3 AI", title: "AI Knowledge Assistant & RAG Engine" },
  "ai-seo": { kicker: "Stage 3 AI", title: "Smart SEO Assistant" },
  "ai-recommendations": { kicker: "Stage 3 AI", title: "Recommendation Engine" },
  membership: { kicker: "Stage 4 Monetization", title: "Membership & Subscription Management Platform" },
  community: { kicker: "Stage 4 Community", title: "Discussion Moderation & Community Platform" },
  distribution: { kicker: "Stage 4 Distribution", title: "Omnichannel Distribution & Marketing Automation" },
  search: { kicker: "Stage 5 Search & Graph", title: "Universal Search & Knowledge Graph Console" },
  developers: { kicker: "Stage 5 Developer Platform", title: "Developer Console & API Gateway" },
  tenants: { kicker: "Stage 5 Multi-Tenant Platform", title: "Multi-Site & White-Label Site Manager" },
  governance: { kicker: "Stage 6 Governance", title: "Security, Compliance & Governance Center" },
  infrastructure: { kicker: "Stage 6 Infrastructure", title: "Cloud Infrastructure & Observability Dashboard" },
  launch: { kicker: "Stage 6 Commercial Launch", title: "Production Launch Readiness Console" },
};

export default function AdminDashboard() {
  const { data, analytics } = useCms();
  const navigate = useNavigate();
  const location = useLocation();

  // Deduce activeTab from pathname
  const activeTab = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    // Path: /cms/articles -> parts: ['cms', 'articles']
    const lastPart = parts[parts.length - 1];
    if (!lastPart || lastPart === "cms") {
      return "overview";
    }
    return lastPart;
  }, [location.pathname]);

  const headerInfo = useMemo(() => {
    return MODULE_TITLES[activeTab] || { kicker: "CMS", title: "Management Console" };
  }, [activeTab]);

  return (
    <CmsLayout
      brand={data?.site?.brand || "MyJourney"}
      activeTab={activeTab}
      onTabChange={(tabId) => navigate(tabId === "overview" ? "/cms" : `/cms/${tabId}`)}
      headerKicker={headerInfo.kicker}
      title={headerInfo.title}
    >
      <Routes>
        <Route index element={<DashboardOverview analytics={analytics} articles={data?.articles} />} />
        <Route path="overview" element={<DashboardOverview analytics={analytics} articles={data?.articles} />} />
        <Route path="articles" element={<ArticleModule />} />
        <Route path="stories" element={<StoryCmsPanel />} />
        <Route path="creators" element={<CreatorReviewModule />} />
        <Route path="categories" element={<CategoryModule />} />
        <Route path="subcategories" element={<SubCategoryModule />} />
        <Route path="tags" element={<TagModule />} />
        <Route path="media" element={<MediaLibraryModule />} />
        <Route path="comments" element={<CommentModule />} />
        <Route path="users" element={<UserModule />} />
        <Route path="roles" element={<RoleModule />} />
        <Route path="permissions" element={<PermissionModule />} />
        <Route path="profile" element={<ProfileModule />} />
        <Route path="logs" element={<ActivityLogModule />} />
        <Route path="hero" element={<HomepageModule />} />
        <Route path="quotes" element={<HomepageModule />} />
        <Route path="navigation" element={<NavigationBuilderModule />} />
        <Route path="footer" element={<FooterModule />} />
        <Route path="testimonials" element={<TestimonialModule />} />
        <Route path="gallery" element={<GalleryModule />} />
        <Route path="newsletters" element={<NewsletterModule />} />
        <Route path="contact" element={<ContactModule />} />
        <Route path="backups" element={<BackupModule />} />
        <Route path="settings" element={<SiteSettingsModule />} />
        <Route path="news-settings" element={<NewsSettingsModule />} />
        <Route path="features" element={<FeatureFlagModule />} />
        <Route path="settings-registry" element={<SettingsRegistryModule />} />
        <Route path="layouts" element={<LayoutManagerModule />} />
        <Route path="website-builder" element={<WebsiteBuilderModule />} />
        <Route path="theme-builder" element={<ThemeBuilderModule />} />
        <Route path="design-tokens" element={<DesignTokenModule />} />
        <Route path="components" element={<ComponentLibraryModule />} />
        <Route path="content-modeling" element={<ContentTypeManagerModule />} />
        <Route path="content-types" element={<ContentTypeManagerModule />} />
        <Route path="navigation-intelligence" element={<NavigationIntelligenceModule />} />
        <Route path="workflow" element={<WorkflowManagerModule />} />
        <Route path="version-control" element={<VersionControlModule />} />
        <Route path="automation" element={<AutomationSchedulerModule />} />
        <Route path="forms" element={<FormBuilderModule />} />
        <Route path="plugins" element={<PluginManagerModule />} />
        <Route path="workspace" element={<PersonalizedDashboardModule />} />
        <Route path="seo" element={<SEOIntelligenceModule />} />
        <Route path="analytics" element={<AnalyticsInsightsModule />} />
        <Route path="localization" element={<TranslationManagerModule />} />
        <Route path="i18n" element={<TranslationManagerModule />} />
        <Route path="insights" element={<AnalyticsInsightsModule />} />
        <Route path="sitemap" element={<SEOIntelligenceModule />} />
        <Route path="widgets" element={<PersonalizedDashboardModule />} />
        <Route path="marketplace" element={<PluginManagerModule />} />
        <Route path="leads" element={<FormBuilderModule />} />
        <Route path="scheduler" element={<AutomationSchedulerModule />} />
        <Route path="revisions" element={<VersionControlModule />} />
        <Route path="blocks" element={<ComponentLibraryModule />} />
        <Route path="blocks" element={<ComponentLibraryModule />} />
        <Route path="tokens" element={<DesignTokenModule />} />
        <Route path="tokens" element={<DesignTokenModule />} />
        <Route path="pages" element={<WebsiteBuilderModule />} />
        <Route path="analytics" element={<DashboardOverview analytics={analytics} articles={data?.articles} />} />
        <Route path="seo" element={<SiteSettingsModule />} />
        <Route path="homepage" element={<HomepageModule />} />
        <Route path="projects" element={<ProjectModule />} />
        <Route path="skills" element={<SkillModule />} />
        <Route path="timeline" element={<TimelineModule />} />
        {/* Stage 3: AI Intelligence */}
        <Route path="ai-providers" element={<AIProviderModule />} />
        <Route path="ai/providers" element={<AIProviderModule />} />

        <Route path="ai-writer" element={<AIWriterModule />} />
        <Route path="ai/writer" element={<AIWriterModule />} />

        <Route path="ai-prompts" element={<PromptManagerModule />} />
        <Route path="ai/prompts" element={<PromptManagerModule />} />

        <Route path="ai-analytics" element={<AIAnalyticsModule />} />
        <Route path="ai/analytics" element={<AIAnalyticsModule />} />

        <Route path="ai-assistant" element={<AIAssistantModule />} />
        <Route path="ai/assistant" element={<AIAssistantModule />} />

        <Route path="ai-seo" element={<SmartSEOModule />} />
        <Route path="ai/seo" element={<SmartSEOModule />} />

        <Route path="ai-recommendations" element={<RecommendationModule />} />
        <Route path="ai/recommendations" element={<RecommendationModule />} />
        {/* Stage 4: Reader Platform */}
        <Route path="membership" element={<MembershipModule />} />
        <Route path="community" element={<CommunityModule />} />
        <Route path="distribution" element={<DistributionModule />} />
        {/* Stage 5: Search & Knowledge Graph */}
        <Route path="search" element={<EnterpriseSearchModule />} />
        <Route path="developers" element={<DeveloperPortalModule />} />
        <Route path="tenants" element={<TenantManagerModule />} />
        {/* Stage 6: Enterprise Security */}
        <Route path="governance" element={<GovernanceModule />} />
        <Route path="infrastructure" element={<InfrastructureModule />} />
        <Route path="launch" element={<LaunchCenterModule />} />
        <Route
          path="*"
          element={
            <div className="cms-panel">
              <p className="empty-state">Module not found.</p>
            </div>
          }
        />
      </Routes>
    </CmsLayout>
  );
}
