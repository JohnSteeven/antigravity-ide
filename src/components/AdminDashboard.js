import React, { useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useCms } from "../context/CmsContext";
import CmsLayout from "./layout/CmsLayout";

// Import modules
import DashboardOverview from "./cms/DashboardOverview";
import ArticleModule from "./cms/ArticleModule";
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

const MODULE_TITLES = {
  overview: { kicker: "Dashboard", title: "Overview & Analytics" },
  articles: { kicker: "Writing", title: "Articles & Drafts" },
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
  timeline: { kicker: "Read My Story", title: "Timeline Moments" },
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
        <Route path="navigation" element={<NavigationModule />} />
        <Route path="footer" element={<FooterModule />} />
        <Route path="testimonials" element={<TestimonialModule />} />
        <Route path="gallery" element={<GalleryModule />} />
        <Route path="newsletters" element={<NewsletterModule />} />
        <Route path="contact" element={<ContactModule />} />
        <Route path="backups" element={<BackupModule />} />
        <Route path="settings" element={<SiteSettingsModule />} />
        <Route path="news-settings" element={<NewsSettingsModule />} />
        <Route path="analytics" element={<DashboardOverview analytics={analytics} articles={data?.articles} />} />
        <Route path="seo" element={<SiteSettingsModule />} />
        <Route path="homepage" element={<HomepageModule />} />
        <Route path="projects" element={<ProjectModule />} />
        <Route path="skills" element={<SkillModule />} />
        <Route path="timeline" element={<TimelineModule />} />
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
