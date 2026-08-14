import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import { CmsProvider } from "./context/CmsContext";
import { AuthProvider } from "./context/AuthContext";
import { FeatureProvider } from "./context/FeatureContext";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import StoriesSection from "./components/StoriesSection";
import ExploreCategories from "./components/categories";
import FeaturedArticles from "./components/FeaturedArticles";
import ArticlesBody from "./components/ArticlesBody";
import QuoteSection from "./components/QuoteSection";
import Footer from "./components/Footer";
import ArticlesPage from "./components/ArticlesPage";
import ArticleDetail from "./components/ArticleDetail";
import StoriesPage from "./stories/StoriesPage";
import StoryDetail from "./stories/StoryDetail";
import CategoryPage from "./components/CategoryPage";
import AllCategoriesPage from "./components/AllCategoriesPage";
import Error from "./components/Error";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOTP from "./components/VerifyOTP";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ResetPasswordSuccess from "./components/ResetPasswordSuccess";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ReadMyStory from "./components/ReadMyStory.js";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Contact from "./components/Contact";
import DynamicPage from "./components/DynamicPage";
import NewsletterVerificationPage from "./components/NewsletterVerificationPage";
import NewsletterPreferencesPage from "./components/NewsletterPreferencesPage";
import LoadingScreen from "./components/LoadingScreen";
import { registerLifePwa } from "./pwa/registerLifePwa";
import { playWithFriendsEnabled } from "./features/play-with-friends/config";

import AskMyJourneyWidget from "./components/shared/AskMyJourneyWidget.jsx";
import ReaderDashboard from "./components/ReaderDashboard.jsx";
import SubscriptionDashboard from "./components/SubscriptionDashboard.jsx";
import CommunityFeed from "./components/CommunityFeed.jsx";
import PremiumPage from "./features/premium/PremiumPage.jsx";
import LifePremiumGate from "./features/premium/LifePremiumGate.jsx";
import "./features/premium/premium.css";

const PlayLifePage = lazy(() => import("./features/play-life/PlayLifePage.jsx"));
const PlayWithFriendsPage = lazy(() => import("./features/play-with-friends/PlayWithFriendsPage.jsx"));
const LifeApp = lazy(() => import("./features/life/LifeApp.jsx"));
const CreatorDirectory = lazy(() => import("./features/creators/CreatorDirectory.jsx"));
const CreatorProfile = lazy(() => import("./features/creators/CreatorProfile.jsx"));
const CreatorApplication = lazy(() => import("./features/creators/CreatorApplication.jsx"));
const CreatorStudio = lazy(() => import("./features/creators/CreatorStudio.jsx"));
const LearnHome = lazy(() => import("./features/learn/LearnHome.jsx"));
const LearnCatalog = lazy(() => import("./features/learn/LearnCatalog.jsx"));
const CoursePage = lazy(() => import("./features/learn/CoursePage.jsx"));
const LessonWorkspace = lazy(() => import("./features/learn/LessonWorkspace.jsx"));
const FormatDetailPage = lazy(() => import("./features/learn/FormatDetailPage.jsx"));

const HomePage = () => (
  <main>
    <Hero />
    <StoriesSection />
    <ExploreCategories />
    <FeaturedArticles />
    <ArticlesBody />
    <QuoteSection />
  </main>
);

const AppShell = () => {
  const location = useLocation();
  const isCms = location.pathname.startsWith("/cms");
  const isPlayLife = location.pathname.startsWith("/play-life");
  const isPlayWithFriends = location.pathname.startsWith("/play-with-friends");
  const isLife = location.pathname.startsWith("/life");
  const isImmersive = isPlayLife || isPlayWithFriends;
  const authRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
    "/reset-password-success",
  ];
  const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route));

  useEffect(() => {
    if (location.hash) {
      const sectionId = decodeURIComponent(location.hash.slice(1));
      window.setTimeout(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("myjourney-theme");
    document.body.classList.toggle("theme-dark", savedTheme === "dark");
  }, []);

  return (
    <div className="app-container">
      {!isAuthRoute && !isImmersive && <Header />}
      <Outlet />
      {!isCms && !isAuthRoute && !isImmersive && !isLife && <Footer />}
      {!isCms && !isAuthRoute && !isImmersive && !isLife && <AskMyJourneyWidget />}
    </div>
  );
};

const Root = () => (
  <AuthProvider>
    <FeatureProvider>
      <ThemeProvider>
        <CmsProvider>
          <AppShell />
        </CmsProvider>
      </ThemeProvider>
    </FeatureProvider>
  </AuthProvider>
);

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "articles",
        element: <ArticlesPage />,
      },
      {
        path: "articles/:slug",
        element: <ArticleDetail />,
      },
      {
        path: "stories",
        element: <StoriesPage />,
      },
      {
        path: "stories/:slug",
        element: <StoryDetail />,
      },
      {
        path: "categories",
        element: <AllCategoriesPage />,
      },
      {
        path: "category/:slug",
        element: <CategoryPage />,
      },
      {
        path: "about",
        element: <ReadMyStory />,
      },
      {
        path: "play-life",
        element: (
          <Suspense fallback={<LoadingScreen message="Opening Play Life..." />}>
            <PlayLifePage />
          </Suspense>
        ),
      },
      {
        path: "play-with-friends",
        element: (
          <Suspense fallback={<LoadingScreen message="Opening Play With Friends..." />}>
            {playWithFriendsEnabled ? <PlayWithFriendsPage /> : <Navigate to="/about#games" replace />}
          </Suspense>
        ),
      },
      {
        path: "play-with-friends/join/:code",
        element: (
          <Suspense fallback={<LoadingScreen message="Opening room..." />}>
            {playWithFriendsEnabled ? <PlayWithFriendsPage /> : <Navigate to="/about#games" replace />}
          </Suspense>
        ),
      },
      {
        path: "play-with-friends/room/:code",
        element: (
          <Suspense fallback={<LoadingScreen message="Reconnecting to room..." />}>
            {playWithFriendsEnabled ? <PlayWithFriendsPage /> : <Navigate to="/about#games" replace />}
          </Suspense>
        ),
      },
      {
        path: "read-my-story",
        element: <ReadMyStory />,
      },
      {
        path: "readmystory",
        element: <Navigate to="/read-my-story" replace />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "newsletter/verify",
        element: <NewsletterVerificationPage />,
      },
      {
        path: "newsletter/preferences",
        element: <NewsletterPreferencesPage />,
      },
      {
        // Admin-only: requires login + role === admin
        path: "cms/*",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
      {
        path: "verify-otp",
        element: (
          <GuestRoute>
            <VerifyOTP />
          </GuestRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password/:token",
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password-success",
        element: <ResetPasswordSuccess />,
      },
      {
        path: "premium",
        element: <PremiumPage />,
      },
      {
        path: "creators",
        element: <Suspense fallback={<LoadingScreen message="Opening Creators..." />}><CreatorDirectory /></Suspense>,
      },
      {
        path: "creators/apply",
        element: <ProtectedRoute><Suspense fallback={<LoadingScreen message="Opening Creator application..." />}><CreatorApplication /></Suspense></ProtectedRoute>,
      },
      {
        path: "creators/:slug",
        element: <Suspense fallback={<LoadingScreen message="Opening Creator..." />}><CreatorProfile /></Suspense>,
      },
      {
        path: "creator-studio/*",
        element: <ProtectedRoute><Suspense fallback={<LoadingScreen message="Opening Creator Studio..." />}><CreatorStudio /></Suspense></ProtectedRoute>,
      },
      {
        path: "learn",
        element: <Suspense fallback={<LoadingScreen message="Opening Learn..." />}><LearnHome /></Suspense>,
      },
      {
        path: "learn/courses",
        element: <Suspense fallback={<LoadingScreen message="Finding Courses..." />}><LearnCatalog format="courses" /></Suspense>,
      },
      {
        path: "learn/courses/:slug",
        element: <Suspense fallback={<LoadingScreen message="Opening Course..." />}><CoursePage /></Suspense>,
      },
      {
        path: "learn/courses/:slug/lessons/:lessonId",
        element: <Suspense fallback={<LoadingScreen message="Opening Lesson..." />}><LessonWorkspace /></Suspense>,
      },
      {
        path: "learn/videos",
        element: <Suspense fallback={<LoadingScreen message="Finding Videos..." />}><LearnCatalog format="videos" /></Suspense>,
      },
      {
        path: "learn/videos/:slug",
        element: <Suspense fallback={<LoadingScreen message="Opening Video..." />}><FormatDetailPage format="video" /></Suspense>,
      },
      {
        path: "learn/podcasts",
        element: <Suspense fallback={<LoadingScreen message="Finding Podcasts..." />}><LearnCatalog format="podcasts" /></Suspense>,
      },
      {
        path: "learn/podcasts/:slug",
        element: <Suspense fallback={<LoadingScreen message="Opening Podcast..." />}><FormatDetailPage format="podcast" /></Suspense>,
      },
      {
        path: "learn/resources",
        element: <Suspense fallback={<LoadingScreen message="Finding Resources..." />}><LearnCatalog format="resources" /></Suspense>,
      },
      {
        path: "learn/resources/:slug",
        element: <Suspense fallback={<LoadingScreen message="Opening Resource..." />}><FormatDetailPage format="resource" /></Suspense>,
      },
      {
        path: "learn/exams",
        element: <Suspense fallback={<LoadingScreen message="Opening exam catalog..." />}><LearnCatalog format="exams" /></Suspense>,
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "life/*",
        element: (
          <ProtectedRoute>
            <LifePremiumGate>
              <Suspense fallback={<LoadingScreen message="Opening Life..." />}>
                <LifeApp />
              </Suspense>
            </LifePremiumGate>
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/dashboard",
        element: <Navigate to="/profile?tab=overview" replace />,
      },
      {
        path: "profile/subscription",
        element: (
          <ProtectedRoute>
            <SubscriptionDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/community",
        element: <Navigate to="/profile?tab=reading" replace />,
      },
      {
        path: "edit-profile",
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: ":pageSlug",
        element: <DynamicPage />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));

registerLifePwa();
root.render(<RouterProvider router={appRouter} />);
// Stories feature architecture updated
