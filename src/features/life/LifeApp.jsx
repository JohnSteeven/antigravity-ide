import React, { useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { FiActivity, FiBookOpen, FiCalendar, FiDollarSign, FiHeart, FiRepeat, FiSettings, FiTarget, FiTrendingUp } from "react-icons/fi";
import lifeApi from "./api/lifeApi";
import LifeOnboarding from "./components/LifeOnboarding";
import { LifeError, LifeLoading } from "./components/LifeUI";
import useLifeQuery from "./hooks/useLifeQuery";
import GoalsPage from "./pages/GoalsPage";
import HabitsPage from "./pages/HabitsPage";
import HealthPage from "./pages/HealthPage";
import InsightsPage from "./pages/InsightsPage";
import JournalPage from "./pages/JournalPage";
import MoneyPage from "./pages/MoneyPage";
import SettingsPage from "./pages/SettingsPage";
import TodayPage from "./pages/TodayPage";
import "./life.css";

const navigation = [
  { to: "/life/today", label: "Today", icon: FiCalendar },
  { to: "/life/habits", label: "Habits", icon: FiRepeat },
  { to: "/life/goals", label: "Goals", icon: FiTarget },
  { to: "/life/health", label: "Health", icon: FiHeart },
  { to: "/life/money", label: "Money", icon: FiDollarSign },
  { to: "/life/insights", label: "Insights", icon: FiTrendingUp },
  { to: "/life/journal", label: "Journal", icon: FiBookOpen },
];

const LifeNavigation = ({ mobile = false }) => {
  const items = mobile ? navigation.filter((item) => ["Today", "Habits", "Health", "Insights"].includes(item.label)) : navigation;
  return <nav className={mobile ? "life-mobile-nav" : "life-side-nav"} aria-label={mobile ? "Life mobile navigation" : "Life sections"}>{items.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to} className={({ isActive }) => isActive ? "is-active" : ""}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}<NavLink to="/life/settings" className={({ isActive }) => isActive ? "is-active" : ""}><FiSettings aria-hidden="true" /><span>{mobile ? "You" : "Settings"}</span></NavLink></nav>;
};

export default function LifeApp() {
  const profileQuery = useLifeQuery(() => lifeApi.profile(), []);
  const [deletedMessage, setDeletedMessage] = useState("");
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
      <aside className="life-sidebar"><div className="life-mark"><FiActivity aria-hidden="true" /><div><span>MYJOURNEY</span><strong>LIFE</strong></div></div><p>Your days, held together.</p><LifeNavigation /><div className="life-sidebar-private"><span aria-hidden="true">●</span> Private to your account</div></aside>
      <section className="life-workspace"><div className="life-mobile-bar"><div className="life-mark"><FiActivity aria-hidden="true" /><div><span>MYJOURNEY</span><strong>LIFE</strong></div></div><NavLink to="/life/settings" aria-label="Life settings"><FiSettings /></NavLink></div>{deletedMessage && <div className="life-notice life-notice--neutral" role="status">{deletedMessage}</div>}<div className="life-page"><Routes><Route index element={<Navigate to="today" replace />} /><Route path="today" element={<TodayPage />} /><Route path="habits" element={<HabitsPage />} /><Route path="goals" element={<GoalsPage />} /><Route path="health" element={<HealthPage />} /><Route path="money" element={<MoneyPage />} /><Route path="insights" element={<InsightsPage />} /><Route path="journal" element={<JournalPage />} /><Route path="settings" element={<SettingsPage profile={profile} onProfileChange={(next) => profileQuery.setData(next)} onDataDeleted={onDataDeleted} />} /><Route path="*" element={<Navigate to="today" replace />} /></Routes></div></section>
    </div>
    <LifeNavigation mobile />
  </main>;
}
