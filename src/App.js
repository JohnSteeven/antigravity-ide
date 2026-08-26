import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router";
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
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import LoadingScreen from "./components/LoadingScreen";
import { registerLifePwa } from "./pwa/registerLifePwa";
import { AgentProvider } from "./features/agent/AgentContext.jsx";
import { playWithFriendsEnabled } from "./features/play-with-friends/config";

import AskMyJourneyWidget from "./components/shared/AskMyJourneyWidget.jsx";

import LifePremiumGate from "./features/premium/LifePremiumGate.jsx";
import "./features/premium/premium.css";

const PlayLifePage = lazy(() => import("./features/play-life/PlayLifePage.jsx"));
const PlayWithFriendsPage = lazy(() => import("./features/play-with-friends/PlayWithFriendsPage.jsx"));
const ArticlesPage = lazy(() => import("./components/ArticlesPage.js"));
const ArticleDetail = lazy(() => import("./components/ArticleDetail.js"));
const StoriesPage = lazy(() => import("./stories/StoriesPage.js"));
const StoryDetail = lazy(() => import("./stories/StoryDetail.js"));
const CategoryPage = lazy(() => import("./components/CategoryPage.js"));
const AllCategoriesPage = lazy(() => import("./components/AllCategoriesPage.js"));
const Error = lazy(() => import("./components/Error.js"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard.js"));
const Login = lazy(() => import("./components/Login.js"));
const Register = lazy(() => import("./components/Register.js"));
const VerifyOTP = lazy(() => import("./components/VerifyOTP.js"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword.js"));
const ResetPassword = lazy(() => import("./components/ResetPassword.js"));
const ResetPasswordSuccess = lazy(() => import("./components/ResetPasswordSuccess.js"));
const Profile = lazy(() => import("./components/Profile.js"));
const EditProfile = lazy(() => import("./components/EditProfile.js"));
const ReadMyStory = lazy(() => import("./components/ReadMyStory.js"));
const Contact = lazy(() => import("./components/Contact.js"));
const DynamicPage = lazy(() => import("./components/DynamicPage.js"));
const NewsletterVerificationPage = lazy(() => import("./components/NewsletterVerificationPage.js"));
const NewsletterPreferencesPage = lazy(() => import("./components/NewsletterPreferencesPage.js"));
const SubscriptionDashboard = lazy(() => import("./components/SubscriptionDashboard.jsx"));
const PremiumPage = lazy(() => import("./features/premium/PremiumPage.jsx"));
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
// MyJourney Agent — full-screen experience
const AgentPage = lazy(() => import("./features/agent/AgentPage.jsx"));

const withRouteFallback = (element, message) => (
  <Suspense fallback={<LoadingScreen message={message} />}>
    {element}
  </Suspense>
);


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

// AppShell decides which chrome (Header/Footer/Widget) to render per route.
// The Agent page is a full-screen experience: no header, footer, or floating widget.
const AppShell = () => {
  const location = useLocation();
  const isCms = location.pathname.startsWith("/cms");
  const isPlayLife = location.pathname.startsWith("/play-life");
  const isPlayWithFriends = location.pathname.startsWith("/play-with-friends");
  const isLife = location.pathname.startsWith("/life");
  const isAgent = location.pathname.startsWith("/agent");
  const isImmersive = isPlayLife || isPlayWithFriends || isAgent;

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
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.dataset.theme = savedTheme;
      document.documentElement.style.colorScheme = savedTheme;
    }
  }, []);

  return (
    <div className="app-container">
      {!isAuthRoute && !isImmersive && <a className="skip-link" href="#main-content">Skip to main content</a>}
      {!isAuthRoute && !isImmersive && <Header />}
      <div id="main-content" tabIndex="-1">
        <Outlet />
      </div>
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
          {/* AgentProvider must be inside AuthProvider to access the authenticated user.
              It initialises lazily — it does not load conversations until the user is
              authenticated and navigates to an Agent surface. */}
          <AgentProvider>
            <AppShell />
          </AgentProvider>
        </CmsProvider>
      </ThemeProvider>
    </FeatureProvider>
  </AuthProvider>
);


const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: withRouteFallback(<Error />, "Opening MyJourney..."),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "articles",
        element: withRouteFallback(<ArticlesPage />, "Opening Articles..."),
      },
      {
        path: "articles/:slug",
        element: withRouteFallback(<ArticleDetail />, "Opening Article..."),
      },
      {
        path: "stories",
        element: withRouteFallback(<StoriesPage />, "Opening Stories..."),
      },
      {
        path: "stories/:slug",
        element: withRouteFallback(<StoryDetail />, "Opening Story..."),
      },
      {
        path: "categories",
        element: withRouteFallback(<AllCategoriesPage />, "Opening Categories..."),
      },
      {
        path: "category/:slug",
        element: withRouteFallback(<CategoryPage />, "Opening Category..."),
      },
      {
        path: "about",
        element: withRouteFallback(<ReadMyStory />, "Opening About..."),
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
        element: withRouteFallback(<ReadMyStory />, "Opening About..."),
      },
      {
        path: "readmystory",
        element: <Navigate to="/read-my-story" replace />,
      },
      {
        path: "contact",
        element: withRouteFallback(<Contact />, "Opening Contact..."),
      },
      {
        path: "newsletter/verify",
        element: withRouteFallback(<NewsletterVerificationPage />, "Verifying newsletter..."),
      },
      {
        path: "newsletter/preferences",
        element: withRouteFallback(<NewsletterPreferencesPage />, "Opening newsletter preferences..."),
      },
      {
        // Admin-only: requires login + role === admin
        path: "cms/*",
        element: (
          <ProtectedRoute requireAdmin>
            {withRouteFallback(<AdminDashboard />, "Opening CMS...")}
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <GuestRoute>
            {withRouteFallback(<Login />, "Opening sign in...")}
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            {withRouteFallback(<Register />, "Opening registration...")}
          </GuestRoute>
        ),
      },
      {
        path: "verify-otp",
        element: (
          <GuestRoute>
            {withRouteFallback(<VerifyOTP />, "Opening verification...")}
          </GuestRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestRoute>
            {withRouteFallback(<ForgotPassword />, "Opening password recovery...")}
          </GuestRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <GuestRoute>
            {withRouteFallback(<ResetPassword />, "Opening password reset...")}
          </GuestRoute>
        ),
      },
      {
        path: "reset-password/:token",
        element: (
          <GuestRoute>
            {withRouteFallback(<ResetPassword />, "Opening password reset...")}
          </GuestRoute>
        ),
      },
      {
        path: "reset-password-success",
        element: withRouteFallback(<ResetPasswordSuccess />, "Opening confirmation..."),
      },
      {
        path: "premium",
        element: withRouteFallback(<PremiumPage />, "Opening Premium..."),
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
            {withRouteFallback(<Profile />, "Opening profile...")}
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
        // MyJourney Agent — full-screen experience.
        // Authentication is NOT enforced at the route level so unauthenticated
        // users can see a sign-in prompt inside AgentPage. The server enforces
        // authentication on all conversation endpoints.
        path: "agent/*",
        element: (
          <Suspense fallback={<LoadingScreen message="Opening MyJourney Agent..." />}>
            <AgentPage />
          </Suspense>
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
            {withRouteFallback(<SubscriptionDashboard />, "Opening membership...")}
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
            {withRouteFallback(<EditProfile />, "Opening profile settings...")}
          </ProtectedRoute>
        ),
      },
      {
        path: ":pageSlug",
        element: withRouteFallback(<DynamicPage />, "Opening page..."),
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));

registerLifePwa();
root.render(<RouterProvider router={appRouter} />);
// Stories feature architecture updated
