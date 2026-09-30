import React, { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes } from "react-router";
import { FiActivity, FiBell, FiBookOpen, FiCalendar, FiDollarSign, FiHeart, FiPlus, FiRepeat, FiSearch, FiSettings, FiTarget, FiTrendingUp, FiSun, FiSmile, FiGrid, FiX } from "react-icons/fi";
import { useAuthContext } from "../../context/AuthContext";
import lifeApi from "./api/lifeApi";
import LifeOnboarding from "./components/LifeOnboarding";
import { LifeError, LifeLoading } from "./components/LifeUI";
import LifeCommandPalette from "./components/LifeCommandPalette";
import LifeOfflineStatus from "./components/LifeOfflineStatus";
import NotificationCenter from "./components/NotificationCenter";
import QuickCapture from "./components/QuickCapture";
import useLifeQuery from "./hooks/useLifeQuery";
import { setLifeQueueOwner, startLifeSync } from "./offline/offlineQueue";
import HabitsPage from "./pages/HabitsPage";
import HabitDetailPage from "./pages/HabitDetailPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import HealthPage from "./pages/HealthPage";
import InsightsPage from "./pages/InsightsPage";
import JournalPage from "./pages/JournalPage";
import MoneyPage from "./pages/MoneyPage";
import SettingsPage from "./pages/SettingsPage";
import TodayPage from "./pages/TodayPage";
import BodyMeasurementsPage from "./pages/BodyMeasurementsPage";
import HealthVitalsPage from "./pages/HealthVitalsPage";
import SleepDetailPage from "./pages/SleepDetailPage";
import FitnessPage from "./pages/FitnessPage";
import NutritionPage from "./pages/NutritionPage";
import MindPage from "./pages/MindPage";
import CorrelationExplorerPage from "./pages/CorrelationExplorerPage";
import PeriodicReportPage from "./pages/PeriodicReportPage";
import "./life.css";
import "./lifePolish.css";
import "./lifeExpansion.css";

const navigationSections = [
  {
    title: "Daily Rhythm",
    items: [
      { to: "/life/today", label: "Today", icon: FiCalendar },
      { to: "/life/habits", label: "Habits & Routines", icon: FiRepeat },
    ]
  },
  {
    title: "Body & Mind",
    items: [
      { to: "/life/health", label: "Health & Vitals", icon: FiHeart },
      { to: "/life/fitness", label: "Fitness & Movement", icon: FiActivity },
      { to: "/life/nutrition", label: "Nutrition & Fuel", icon: FiSun },
      { to: "/life/mind", label: "Mind & Mood", icon: FiSmile },
    ]
  },
  {
    title: "Direction & Wealth",
    items: [
      { to: "/life/goals", label: "Goals & Direction", icon: FiTarget },
      { to: "/life/money", label: "Money OS", icon: FiDollarSign },
      { to: "/life/journal", label: "Private Journal", icon: FiBookOpen },
    ]
  },
  {
    title: "Intelligence & Reports",
    items: [
      { to: "/life/insights", label: "Insights & Reviews", icon: FiTrendingUp },
    ]
  }
];

const LifeNavigation = ({ mobile = false, onQuickCapture, onOpenMore }) => {
  if (mobile) {
    return (
      <nav className="life-mobile-nav" aria-label="Life mobile navigation">
        <NavLink to="/life/today" className={({ isActive }) => (isActive ? "is-active" : "")}>
          <FiCalendar aria-hidden="true" />
          <span>Today</span>
        </NavLink>
        <NavLink to="/life/habits" className={({ isActive }) => (isActive ? "is-active" : "")}>
          <FiRepeat aria-hidden="true" />
          <span>Habits</span>
        </NavLink>
        <button type="button" className="life-mobile-capture" onClick={() => onQuickCapture?.("")}>
          <FiPlus aria-hidden="true" />
          <span>Add</span>
        </button>
        <NavLink to="/life/health" className={({ isActive }) => (isActive ? "is-active" : "")}>
          <FiHeart aria-hidden="true" />
          <span>Health</span>
        </NavLink>
        <button type="button" className="life-mobile-more-btn" onClick={onOpenMore} style={{ background: "transparent", border: "none", color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "pointer", fontSize: "0.7rem" }}>
          <FiGrid aria-hidden="true" style={{ fontSize: "1.2rem" }} />
          <span>More</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="life-side-nav" aria-label="Life sections">
      {navigationSections.map((sec) => (
        <div key={sec.title} className="life-side-nav-group" style={{ marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700, padding: "0 12px", display: "block", marginBottom: "0.25rem" }}>
            {sec.title}
          </span>
          {sec.items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "is-active" : "")}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      ))}
      <NavLink to="/life/settings" className={({ isActive }) => (isActive ? "is-active" : "")}>
        <FiSettings aria-hidden="true" />
        <span>Settings & Privacy</span>
      </NavLink>
    </nav>
  );
};

export default function LifeApp() {
  const { user } = useAuthContext();
  const profileQuery = useLifeQuery(() => lifeApi.profile(), []);
  const [deletedMessage, setDeletedMessage] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const openCapture = (type = "") => { setCaptureType(type); setCaptureOpen(true); };
  useEffect(() => {
    let disposed = false;
    let stopSync = () => {};
    setLifeQueueOwner(user?.id || user?._id).then(() => {
      if (!disposed) stopSync = startLifeSync();
    }).catch(() => {});
    return () => { disposed = true; stopSync(); };
  }, [user?.id, user?._id]);
  useEffect(() => {
    const onKey = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (profileQuery.loading) return <main className="life-app life-entry-state"><LifeLoading label="Opening your private Life space…" /></main>;
  if (profileQuery.error || !profileQuery.data) return <main className="life-app life-entry-state"><LifeError message={profileQuery.error || "Life could not be opened."} onRetry={profileQuery.refresh} /></main>;
  const profile = profileQuery.data;
  if (!profile.onboarding?.completedAt && !profile.onboarding?.skippedAt) return <div className="life-app"><LifeOnboarding profile={profile} onDone={(next) => profileQuery.setData(next)} /></div>;
  const onDataDeleted = () => {
    setDeletedMessage("All Life data was permanently deleted and cannot be recovered. Your MyJourney account was not deleted.");
    profileQuery.setData({ ...profile, onboarding: { completedAt: null, skippedAt: new Date().toISOString() } });
  };
  return <main className="life-app">
    <div className="life-shell">
      <aside className="life-sidebar"><div className="life-mark"><FiActivity aria-hidden="true" /><div><span>MYJOURNEY</span><strong>LIFE</strong></div></div><p>Your days, held together.</p><button type="button" className="life-sidebar-add" onClick={() => openCapture()}><FiPlus /> Quick capture</button><LifeNavigation /><div className="life-sidebar-private"><span aria-hidden="true">●</span> Private to your account</div></aside>
      <section className="life-workspace"><div className="life-mobile-bar"><div className="life-mark"><FiActivity aria-hidden="true" /><div><span>MYJOURNEY</span><strong>LIFE</strong></div></div><div><button type="button" onClick={() => setSearchOpen(true)} aria-label="Search Life"><FiSearch /></button><button type="button" onClick={() => setNotificationsOpen(true)} aria-label="Life notifications"><FiBell /></button><NavLink to="/life/settings" aria-label="Life settings"><FiSettings /></NavLink></div></div><LifeOfflineStatus /><div className="life-desktop-tools"><button type="button" onClick={() => setSearchOpen(true)}><FiSearch /> Search <kbd>⌘K</kbd></button><button type="button" onClick={() => setNotificationsOpen(true)} aria-label="Life notifications"><FiBell /></button><button type="button" className="life-primary-button" onClick={() => openCapture()}><FiPlus /> Add</button></div>{deletedMessage && <div className="life-notice life-notice--neutral" role="status">{deletedMessage}</div>}<div className="life-page"><Routes><Route index element={<Navigate to="today" replace />} /><Route path="today" element={<TodayPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="habits/:id" element={<HabitDetailPage />} /><Route path="goals" element={<GoalsPage />} /><Route path="goals/:id" element={<GoalDetailPage />} /><Route path="health" element={<HealthPage />} /><Route path="health/body" element={<BodyMeasurementsPage />} /><Route path="health/vitals" element={<HealthVitalsPage />} /><Route path="health/sleep" element={<SleepDetailPage />} /><Route path="fitness" element={<FitnessPage />} /><Route path="fitness/workouts" element={<FitnessPage />} /><Route path="fitness/volume" element={<FitnessPage />} /><Route path="nutrition" element={<NutritionPage />} /><Route path="mind" element={<MindPage />} /><Route path="mind/mood" element={<MindPage />} /><Route path="money" element={<MoneyPage />} /><Route path="money/accounts" element={<MoneyPage />} /><Route path="money/cashflow" element={<MoneyPage />} /><Route path="money/bills" element={<MoneyPage />} /><Route path="insights" element={<InsightsPage />} /><Route path="insights/correlations" element={<CorrelationExplorerPage />} /><Route path="reports/weekly" element={<PeriodicReportPage initialType="weekly" />} /><Route path="reports/monthly" element={<PeriodicReportPage initialType="monthly" />} /><Route path="reports/yearly" element={<PeriodicReportPage initialType="yearly" />} /><Route path="journal" element={<JournalPage />} /><Route path="journal/search" element={<JournalPage />} /><Route path="journal/:id" element={<JournalPage />} /><Route path="settings" element={<SettingsPage profile={profile} onProfileChange={(next) => profileQuery.setData(next)} onDataDeleted={onDataDeleted} />} /><Route path="*" element={<Navigate to="today" replace />} /></Routes></div></section>
    </div>
    <LifeNavigation mobile onQuickCapture={openCapture} onOpenMore={() => setMobileMoreOpen(true)} />
    <QuickCapture open={captureOpen} initialType={captureType} onClose={() => setCaptureOpen(false)} />
    <LifeCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} onCapture={openCapture} />
    <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    {mobileMoreOpen && (
      <div className="life-mobile-sheet-backdrop" onClick={() => setMobileMoreOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
        <div className="life-mobile-sheet" onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "#0f172a", borderTop: "1px solid #334155", borderRadius: "16px 16px 0 0", padding: "1.5rem", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc" }}>All Life Modules</h3>
            <button type="button" onClick={() => setMobileMoreOpen(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <FiX />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { to: "/life/fitness", label: "Fitness", icon: FiActivity },
              { to: "/life/nutrition", label: "Nutrition", icon: FiSun },
              { to: "/life/mind", label: "Mind & Mood", icon: FiSmile },
              { to: "/life/goals", label: "Goals", icon: FiTarget },
              { to: "/life/money", label: "Money OS", icon: FiDollarSign },
              { to: "/life/journal", label: "Journal", icon: FiBookOpen },
              { to: "/life/insights/correlations", label: "Correlations", icon: FiTrendingUp },
              { to: "/life/reports/weekly", label: "Weekly Review", icon: FiCalendar },
              { to: "/life/settings", label: "Settings", icon: FiSettings },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMoreOpen(false)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem 0.5rem", background: "#1e293b", borderRadius: "10px", color: "#f8fafc", textDecoration: "none", fontSize: "0.75rem", textAlign: "center", border: "1px solid #334155" }}
              >
                <Icon style={{ fontSize: "1.35rem", color: "#38bdf8" }} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )}
  </main>;
}
