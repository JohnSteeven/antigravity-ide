import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  FiEdit3,
  FiGrid,
  FiBookmark,
  FiBookOpen,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useReader } from "../../hooks/useReader";
import { getFullName, getProfileCover, getProfilePhoto } from "../../utils/helpers";
import UserAvatar from "../shared/UserAvatar";
import OverviewTab from "./OverviewTab";
import SavedTab from "./SavedTab";
import ReadingTab from "./ReadingTab";
import ProfileDetailsTab from "./ProfileDetailsTab";
import SettingsTab from "./SettingsTab";
import "./ReaderPortal.css";

const TABS = [
  { id: "overview",  label: "Overview",  icon: <FiGrid /> },
  { id: "saved",     label: "Saved",     icon: <FiBookmark /> },
  { id: "reading",   label: "Reading",   icon: <FiBookOpen /> },
  { id: "profile",   label: "Profile",   icon: <FiUser /> },
  { id: "settings",  label: "Settings",  icon: <FiSettings /> },
];

const ReaderPortal = () => {
  const { user } = useAuth();
  const { refreshReader } = useReader();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const profile   = user?.profile || {};
  const fullName  = getFullName(user);
  const coverImage = getProfileCover(profile);

  useEffect(() => {
    refreshReader();
  }, [refreshReader]);

  // Derive active tab from URL; default to "overview"
  const rawTab   = searchParams.get("tab") || "overview";
  const activeTab = TABS.find((t) => t.id === rawTab) ? rawTab : "overview";

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: false });
  };

  return (
    <main className="rp-page profile-page account-profile-page">
      {/* ── Shared Profile Hero Header (rendered once) ──────────────────── */}
      <div className="rp-hero">
        {coverImage && (
          <>
            <div
              className="rp-cover-bg"
              style={{ backgroundImage: `url("${coverImage}")` }}
            />
            <div className="rp-cover-overlay" />
          </>
        )}

        <div className="rp-hero-inner">
          <div className="rp-avatar-wrap">
            <UserAvatar user={user} className="rp-avatar profile-avatar" />
          </div>

          <div className="rp-hero-info">
            <span className="rp-hero-role rp-kicker">
              {user?.role || "Reader"} · MyJourney
            </span>
            <h1 className="rp-hero-name">{fullName}</h1>
            <div className="rp-hero-username">@{user?.username}</div>
            {profile.bio && (
              <p className="rp-hero-bio">{profile.bio}</p>
            )}
          </div>

          <div className="rp-hero-actions">
            <Link to="/edit-profile" className="rp-edit-btn">
              <FiEdit3 /> Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Bar ─────────────────────────────────────────── */}
      <nav className="rp-tabs-bar" aria-label="Reader portal tabs">
        <div className="rp-tabs-inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`rp-tab-${tab.id}`}
              className={`rp-tab-btn${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              <span className="rp-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Active Tab Content ─────────────────────────────────────────── */}
      <div className="rp-tab-body" role="tabpanel" aria-labelledby={`rp-tab-${activeTab}`}>
        {activeTab === "overview"  && <OverviewTab />}
        {activeTab === "saved"     && <SavedTab />}
        {activeTab === "reading"   && <ReadingTab />}
        {activeTab === "profile"   && <ProfileDetailsTab />}
        {activeTab === "settings"  && <SettingsTab />}
      </div>
    </main>
  );
};

export default ReaderPortal;
