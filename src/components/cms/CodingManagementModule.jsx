import React, { useCallback, useEffect, useState } from "react";
import {
  FiGrid,
  FiBook,
  FiLayers,
  FiCode,
  FiCheckSquare,
  FiBox,
  FiFileText,
  FiLock,
  FiUploadCloud,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { learnApi } from "../../services/apiService";

import CodingOverviewTab from "./coding/CodingOverviewTab";
import CodingTracksTab from "./coding/CodingTracksTab";
import CodingCurriculumTab from "./coding/CodingCurriculumTab";
import CodingLessonsTab from "./coding/CodingLessonsTab";
import CodingPracticeTab from "./coding/CodingPracticeTab";
import CodingProjectsTab from "./coding/CodingProjectsTab";
import CodingMaterialsTab from "./coding/CodingMaterialsTab";
import CodingAccessTab from "./coding/CodingAccessTab";
import CodingPublishingTab from "./coding/CodingPublishingTab";

const TABS = [
  { id: "overview", label: "Overview", icon: FiGrid },
  { id: "tracks", label: "Tracks", icon: FiBook },
  { id: "curriculum", label: "Curriculum", icon: FiLayers },
  { id: "lessons", label: "Lesson Editor", icon: FiCode },
  { id: "practice", label: "Practice", icon: FiCheckSquare },
  { id: "projects", label: "Projects", icon: FiBox },
  { id: "materials", label: "Materials", icon: FiFileText },
  { id: "access", label: "Access Control", icon: FiLock },
  { id: "publishing", label: "Publishing", icon: FiUploadCloud },
];

const S = {
  root: {
    padding: "1.5rem",
    maxWidth: "1350px",
    margin: "0 auto",
    background: "#0f172a",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    padding: "1.75rem 2rem",
    maxWidth: "1400px",
    margin: "1rem auto 3rem",
    color: "#f8fafc", // High contrast default text
    minHeight: "80vh",
    minHeight: "85vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  eyebrow: {
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#38bdf8",
    fontWeight: 700,
  },
  pageTitle: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0.25rem 0 0",
  },
  refreshBtn: {
    background: "#1e293b",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.5rem 0.9rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "background 0.15s ease",
  },
  tabNav: {
    display: "flex",
    gap: "0.25rem",
    borderBottom: "1px solid #334155",
    marginBottom: "1.75rem",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  tabBtn: (active) => ({
    background: active ? "#1e293b" : "transparent",
    color: active ? "#38bdf8" : "#94a3b8",
    border: "none",
    borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
    padding: "0.65rem 1rem",
    fontSize: "0.85rem",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    whiteSpace: "nowrap",
    borderRadius: "6px 6px 0 0",
    transition: "all 0.15s ease",
  }),
  contentArea: {
    minHeight: "500px",
  },
  loadingContainer: {
    padding: "4rem 2rem",
    textAlign: "center",
    color: "#94a3b8",
  },
  errorBanner: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid #ef4444",
    color: "#f87171",
    padding: "0.85rem 1.25rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
};

export default function CodingManagementModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesRes, materialsRes] = await Promise.all([
        learnApi.adminCodingCourses(),
        learnApi.adminCodingMaterials(),
      ]);
      const fetchedCourses = coursesRes.data || [];
      setCourses(fetchedCourses);
      setMaterials(materialsRes.data || []);
      if (!selectedCourseId && fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0].id || fetchedCourses[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load Coding CMS content.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate to Curriculum tab for a specific course
  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setActiveTab("curriculum");
  };

  // Open Lesson Editor: loads full admin lesson details
  const handleEditLesson = async (lessonSummary) => {
    setError("");
    try {
      const lessonId = lessonSummary.id || lessonSummary._id;
      const res = await learnApi.adminCodingLesson(lessonId);
      setSelectedLesson(res.data);
      setActiveTab("lessons");
    } catch (err) {
      setError(err.message || "Failed to open lesson for editing.");
    }
  };

  // Called when lesson is saved
  const handleLessonSaved = async () => {
    await loadData();
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <span style={S.eyebrow}>Admin Content Studio</span>
          <h1 style={S.pageTitle}>Coding Curriculum &amp; Platform Management</h1>
        </div>

        <button type="button" onClick={loadData} style={S.refreshBtn} title="Reload curriculum and materials">
          <FiRefreshCw /> Refresh Data
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={S.errorBanner}>
          <FiAlertCircle style={{ flexShrink: 0, fontSize: "1.1rem" }} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={S.tabNav}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={S.tabBtn(isActive)}
            >
              <Icon /> {tab.label}
              {tab.id === "materials" && materials.length > 0 && (
                <span style={{ fontSize: "0.72rem", background: "#334155", color: "#f8fafc", padding: "0.1rem 0.4rem", borderRadius: "10px" }}>
                  {materials.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={S.contentArea}>
        {loading && courses.length === 0 ? (
          <div style={S.loadingContainer}>
            <FiRefreshCw className="animate-spin" style={{ fontSize: "1.75rem", marginBottom: "0.5rem", color: "#38bdf8" }} />
            <p>Loading Coding CMS curriculum and materials...</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <CodingOverviewTab
                courses={courses}
                materials={materials}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === "tracks" && (
              <CodingTracksTab
                courses={courses}
                onSelectCourse={handleSelectCourse}
                onRefresh={loadData}
              />
            )}

            {activeTab === "curriculum" && (
              <CodingCurriculumTab
                courses={courses}
                selectedCourseId={selectedCourseId}
                onSelectCourse={(id) => setSelectedCourseId(id)}
                onEditLesson={handleEditLesson}
                onRefresh={loadData}
              />
            )}

            {activeTab === "lessons" && (
              <CodingLessonsTab
                lesson={selectedLesson}
                onBack={() => setActiveTab("curriculum")}
                onSaved={handleLessonSaved}
              />
            )}

            {activeTab === "practice" && (
              <CodingPracticeTab
                courses={courses}
                onEditLesson={handleEditLesson}
              />
            )}

            {activeTab === "projects" && (
              <CodingProjectsTab
                courses={courses}
                onEditLesson={handleEditLesson}
              />
            )}

            {activeTab === "materials" && (
              <CodingMaterialsTab
                materials={materials}
                courses={courses}
                onRefresh={loadData}
              />
            )}

            {activeTab === "access" && (
              <CodingAccessTab
                courses={courses}
                onRefresh={loadData}
              />
            )}

            {activeTab === "publishing" && (
              <CodingPublishingTab
                courses={courses}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
