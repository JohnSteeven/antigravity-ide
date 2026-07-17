import React, { useEffect } from "react";
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
import CategoryPage from "./components/CategoryPage";
import Error from "./components/Error";
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOTP from "./components/VerifyOTP";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ReadMyStory from "./components/ReadMyStory.js";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Contact from "./components/Contact";
import SearchPage from "./components/SearchPage";

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
  const authRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthRoute = authRoutes.includes(location.pathname);

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
      {!isAuthRoute && <Header />}
      <Outlet />
      {!isCms && !isAuthRoute && <Footer />}
    </div>
  );
};

const Root = () => (
  <CmsProvider>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </CmsProvider>
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
        path: "category/:slug",
        element: <CategoryPage />,
      },
      {
        path: "about",
        element: <ReadMyStory />,
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
        path: "search",
        element: <SearchPage />,
      },
      {
        // Admin-only: requires login + role === admin
        path: "cms/*",
        element: (
          <ProtectedRoute requireAdmin>
            <React.Suspense fallback={
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#151b1a", color: "#f8f4ed" }}>
                <div className="spin" style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%" }}></div>
              </div>
            }>
              <AdminDashboard />
            </React.Suspense>
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
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "edit-profile",
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<RouterProvider router={appRouter} />);
