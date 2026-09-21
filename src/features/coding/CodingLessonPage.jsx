import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiCopy,
  FiExternalLink,
  FiHelpCircle,
  FiLock,
  FiMaximize2,
  FiMinimize2,
  FiMonitor,
  FiPlay,
  FiRefreshCw,
  FiSend,
  FiSidebar,
  FiSmartphone,
  FiTablet,
  FiTerminal,
  FiX,
} from "react-icons/fi";
import { learnApi, createCodingSubmission } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import WorkspaceCodeEditor from "./components/WorkspaceCodeEditor.jsx";
import WorkspaceSplitter from "./components/WorkspaceSplitter.jsx";
import SubmissionsDrawer from "./components/SubmissionsDrawer.jsx";
import QuizSection from "../learn/components/QuizSection.jsx";
import { runExerciseValidation } from "../learn/components/ValidationRunner";
import {
  createSandboxSrcdoc,
  generateChannelNonce,
  validateSandboxMessage,
} from "../learn/sandbox/htmlSandboxHarness";
import { defaultPythonManager } from "../learn/sandbox/pythonWorkerManager";
import { buildSandboxPayload, classifyRuntimeError } from "./languageAdapters";
import CodingSubNav from "./CodingSubNav.jsx";
import { trackToCourseSlug, courseSlugToTrack, CANONICAL_TRACKS } from "./codingConstants";
import "./coding.css";

const idempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `lesson-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function CodingLessonPage() {
  const { track, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const trackKey = (track || "html").toLowerCase();
  const courseSlug = trackToCourseSlug(trackKey);
  const trackMeta = CANONICAL_TRACKS.find((t) => t.key === trackKey) || CANONICAL_TRACKS[0];

  const [data, setData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [state, setState] = useState({ loading: true, busy: false, error: "", completed: false });

  // Center learning panel tabs
  const [centerTab, setCenterTab] = useState("concept"); // "concept" | "example" | "challenge" | "expected" | "hints"

  // Code editor state
  const [code, setCode] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Right output panel state
  const [activeOutputTab, setActiveOutputTab] = useState("preview"); // "preview" | "console" | "tests" | "quiz"
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mobile navigation tab
  const [mobileTab, setMobileTab] = useState("concept"); // "concept" | "code" | "output"

  // Progressive Hints Modal
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Solution Modal
  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [solutionCode, setSolutionCode] = useState("");
  const [solutionTab, setSolutionTab] = useState("solution"); // "solution" | "yourCode" | "diff"
  const [copySuccess, setCopySuccess] = useState(false);

  // Resizable Workspace Layout state (36% instructions, 58% editor height default)
  const [centerWidthPercent, setCenterWidthPercent] = useState(() => {
    try {
      const v = localStorage.getItem("myjourney_coding_split_v");
      return v ? Math.min(55, Math.max(25, parseFloat(v))) : 36;
    } catch {
      return 36;
    }
  });
  const [editorHeightPercent, setEditorHeightPercent] = useState(() => {
    try {
      const h = localStorage.getItem("myjourney_coding_split_h");
      return h ? Math.min(80, Math.max(20, parseFloat(h))) : 58;
    } catch {
      return 58;
    }
  });
  const [maximizedPanel, setMaximizedPanel] = useState(null); // null | "editor" | "output"

  // Submissions state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionsDrawerOpen, setSubmissionsDrawerOpen] = useState(false);

  // Completion gates
  const [exercisePassed, setExercisePassed] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  // Sandbox iframe & nonce
  const iframeRef = useRef(null);
  const resizableWorkspaceRef = useRef(null);
  const ideWorkspaceRef = useRef(null);
  const channelNonceRef = useRef(generateChannelNonce());
  const [srcdoc, setSrcdoc] = useState("");

  // Python runtime state
  const [pythonStatus, setPythonStatus] = useState("READY");

  // Local storage draft key
  const draftKey = useMemo(() => {
    const userPrefix = user?.id || user?._id || "guest";
    return `coding_draft_${userPrefix}_${trackKey}_${lessonId}`;
  }, [user, trackKey, lessonId]);

  // Load lesson data
  useEffect(() => {
    let active = true;
    setState({ loading: true, busy: false, error: "", completed: false });
    setConsoleLogs([]);
    setValidationResult(null);
    setSolutionCode("");
    setCurrentHintIndex(0);
    setCopySuccess(false);

    learnApi
      .lesson(courseSlug, lessonId)
      .then((res) => {
        if (!active) return;
        const responseData = res.data;
        setData(responseData);

        const progress = responseData.progress;
        const isExPassed = Boolean(progress?.exercisePassed);
        const isQzPassed = Boolean(progress?.quizPassed);
        const isComp = Boolean(progress?.completed);

        setExercisePassed(isExPassed);
        setQuizPassed(isQzPassed);

        const codingBlock = responseData.lesson?.codingBlocks?.[0];
        const starter = codingBlock?.starterCode || "";
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft !== null && savedDraft !== starter) {
          setCode(savedDraft);
          setIsDirty(true);
        } else {
          setCode(starter);
          setIsDirty(false);
        }

        const lang = codingBlock?.language?.toLowerCase() || "html";
        if (lang === "html" || lang === "css") {
          setActiveOutputTab("preview");
        } else {
          setActiveOutputTab("console");
        }

        setState({
          loading: false,
          busy: false,
          error: "",
          completed: isComp,
        });
      })
      .catch((err) => {
        if (active) setState({ loading: false, busy: false, error: err.message, completed: false });
      });

    return () => {
      active = false;
    };
  }, [courseSlug, lessonId, draftKey]);

  const primaryBlock = useMemo(() => data?.lesson?.codingBlocks?.[0] || null, [data]);
  const language = useMemo(() => primaryBlock?.language?.toLowerCase() || "html", [primaryBlock]);
  const hasQuizzes = useMemo(() => (data?.lesson?.quizQuestions?.length || 0) > 0, [data]);
  const hints = useMemo(() => primaryBlock?.hints || [], [primaryBlock]);

  // All lessons in the course curriculum for sidebar and next/prev navigation
  const allLessons = useMemo(() => {
    if (!data?.course?.curriculum) return [];
    return data.course.curriculum.flatMap((m) => m.lessons || []);
  }, [data]);

  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => String(l.id) === String(lessonId));
  }, [allLessons, lessonId]);

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  // Completed lesson IDs
  const completedLessonKeys = useMemo(() => {
    const set = new Set();
    const progressList = data?.course?.enrollment?.lessonProgress || [];
    progressList.forEach((p) => {
      if (p.completedAt) {
        if (p.lessonId) set.add(String(p.lessonId));
        if (p.lessonStableKey) set.add(p.lessonStableKey);
      }
    });
    if (state.completed) {
      set.add(String(lessonId));
    }
    return set;
  }, [data, state.completed, lessonId]);

  const completedCount = completedLessonKeys.size;
  const totalLessonsCount = allLessons.length || data?.course?.lessonCount || 1;
  const coursePercent = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));

  // Debounced Autosave Draft to LocalStorage
  useEffect(() => {
    if (!primaryBlock || state.loading) return;

    setIsDraftSaving(true);
    const starter = primaryBlock.starterCode || "";
    setIsDirty(code !== starter);

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, code);
      } catch {
        // LocalStorage quota fallback
      }
      setIsDraftSaving(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [code, draftKey, primaryBlock, state.loading]);

  // AUTOMATIC SERVER COMPLETION GATE:
  // Completes automatically when exercise and quiz gates are passed. No manual button required!
  useEffect(() => {
    const exerciseRequirementMet = !primaryBlock || exercisePassed;
    const quizRequirementMet = !hasQuizzes || quizPassed;

    if (
      exerciseRequirementMet &&
      quizRequirementMet &&
      !state.completed &&
      isAuthenticated &&
      data?.course?.id &&
      data?.lesson?.id
    ) {
      learnApi
        .progress(data.course.id, {
          lessonId: data.lesson.id,
          completed: true,
          idempotencyKey: idempotencyKey(),
        })
        .then(() => {
          setState((prev) => ({ ...prev, completed: true }));
        })
        .catch(() => {
          // Silent non-blocking failure
        });
    }
  }, [exercisePassed, quizPassed, primaryBlock, hasQuizzes, state.completed, isAuthenticated, data]);

  // Python worker subscriptions
  useEffect(() => {
    if (language !== "python") return;

    const unsubscribe = defaultPythonManager.subscribe((event) => {
      if (event.type === "STATUS") {
        setPythonStatus(event.status);
      } else if (event.type === "STDOUT") {
        setConsoleLogs((prev) => [...prev, { level: "log", text: event.text }]);
      } else if (event.type === "STDERR") {
        setConsoleLogs((prev) => [...prev, { level: "error", text: event.text }]);
      } else if (event.type === "RUN_SUCCESS") {
        setIsExecuting(false);
        if (event.result) {
          setConsoleLogs((prev) => [...prev, { level: "info", text: `=> ${event.result}` }]);
        }
      } else if (event.type === "RUN_ERROR" || event.type === "TIMEOUT" || event.type === "ERROR") {
        setIsExecuting(false);
        const classified = classifyRuntimeError(event.error);
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: "error",
            text: `[${classified.category}] ${classified.message}`,
          },
        ]);
      }
    });

    return () => unsubscribe();
  }, [language]);

  // PostMessage validation for HTML/CSS/JS sandbox
  useEffect(() => {
    const handleMessage = (event) => {
      if (!iframeRef.current) return;
      const validation = validateSandboxMessage({
        event,
        expectedWindow: iframeRef.current.contentWindow,
        expectedChannelNonce: channelNonceRef.current,
      });

      if (!validation.valid) return;
      const { message } = validation;

      if (message.type === "MYJOURNEY_SANDBOX_CONSOLE" || message.type === "MYJOURNEY_SANDBOX_ERROR") {
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: message.level || "log",
            text: message.text,
            line: message.line,
            col: message.col,
          },
        ]);
      } else if (message.type === "MYJOURNEY_SANDBOX_READY") {
        setIsExecuting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Execute / Run Code
  const handleRun = () => {
    setIsExecuting(true);
    setConsoleLogs([]);

    if (language === "python") {
      setActiveOutputTab("console");
      setMobileTab("output");
      defaultPythonManager.run(code);
      return;
    }

    const newNonce = generateChannelNonce();
    channelNonceRef.current = newNonce;

    const payload = buildSandboxPayload({
      language,
      code,
      previewFixture: primaryBlock?.previewFixture,
      channelNonce: newNonce,
    });

    const newSrcdoc = createSandboxSrcdoc(payload);
    setSrcdoc(newSrcdoc);

    if (language === "javascript") {
      setActiveOutputTab("console");
    } else {
      setActiveOutputTab("preview");
    }
    setMobileTab("output");
  };

  // Run on initial load for HTML/CSS preview
  useEffect(() => {
    if (!state.loading && (language === "html" || language === "css") && code) {
      handleRun();
    }
  }, [state.loading, language]);

  // Reset Code to Starter Template
  const handleReset = () => {
    if (window.confirm("Reset code to starter template? Your current edits will be discarded.")) {
      const starter = primaryBlock?.starterCode || "";
      setCode(starter);
      setIsDirty(false);
      localStorage.removeItem(draftKey);
      setConsoleLogs([]);
      setValidationResult(null);
    }
  };

  // Check Solution / Validate
  const handleCheck = async () => {
    if (!primaryBlock) return;
    setIsValidating(true);
    setActiveOutputTab("tests");
    setMobileTab("output");

    try {
      const result = await runExerciseValidation({
        code,
        language,
        rules: primaryBlock.validationRules || [],
        validationRules: primaryBlock.validationRules,
        tests: primaryBlock.tests || [],
      });

      setValidationResult(result);

      if (result.passed) {
        setExercisePassed(true);
        if (isAuthenticated && data?.course?.id) {
          try {
            await learnApi.exerciseAttempt(data.course.id, data.lesson.id, {
              blockId: primaryBlock.id || primaryBlock._id || "block-1",
              passed: true,
            });
          } catch {
            // Non-blocking sync
          }
        }
      }
    } catch (err) {
      const classified = classifyRuntimeError(err);
      setValidationResult({
        passed: false,
        error: classified.message,
        checks: [{ description: classified.category, passed: false, message: classified.message }],
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Resizable Panel Handlers
  const handleResizeVertical = (nextPercent) => {
    const next = Math.min(55, Math.max(25, Number(nextPercent.toFixed(1))));
    setCenterWidthPercent(next);
    try {
      localStorage.setItem("myjourney_coding_split_v", String(next));
    } catch {}
  };

  const handleResizeHorizontal = (nextPercent) => {
    const next = Math.min(80, Math.max(20, Number(nextPercent.toFixed(1))));
    setEditorHeightPercent(next);
    try {
      localStorage.setItem("myjourney_coding_split_h", String(next));
    } catch {}
  };

  const handleResetLayout = () => {
    setCenterWidthPercent(36);
    setEditorHeightPercent(58);
    setMaximizedPanel(null);
    try {
      localStorage.removeItem("myjourney_coding_split_v");
      localStorage.removeItem("myjourney_coding_split_h");
    } catch {}
  };

  // Submit Code Solution to Course Engine
  const handleSubmit = async () => {
    if (isSubmitting || isValidating || !primaryBlock) return;
    setIsSubmitting(true);
    setActiveOutputTab("tests");
    setMobileTab("output");

    const startTime = performance.now();
    let status = "failed";
    let validationSummary = [];
    let passedCount = 0;
    let totalCount = 0;
    let clientResult = null;

    try {
      clientResult = await runExerciseValidation({
        code,
        language,
        rules: primaryBlock.validationRules || [],
        validationRules: primaryBlock.validationRules,
        tests: primaryBlock.tests || [],
      });

      const runtimeMs = Math.round(performance.now() - startTime);
      totalCount = clientResult.checks?.length || (primaryBlock.tests?.length || 1);
      passedCount = clientResult.passedChecks ?? (clientResult.passed ? totalCount : 0);

      if (clientResult.passed) {
        status = "accepted";
      } else if (passedCount > 0) {
        status = "partially_passed";
      } else {
        status = "failed";
      }

      validationSummary = (clientResult.checks || []).map((c) => ({
        description: c.description || c.message || "Check",
        passed: Boolean(c.passed),
        message: c.message || "",
      }));

      setValidationResult(clientResult);

      // Record authoritative submission
      const subRes = await createCodingSubmission(courseSlug, lessonId, {
        blockId: primaryBlock.id || primaryBlock._id || "block-1",
        codeSnapshot: code,
        status,
        testsPassed: passedCount,
        testsTotal: totalCount,
        runtimeMs,
        validationSummary,
      });

      if (subRes && subRes.success) {
        const sub = subRes.submission;
        if (sub.exercisePassed) {
          setExercisePassed(true);
        }
        setSubmissionResult({
          success: true,
          status: sub.status,
          testsPassed: sub.testsPassed,
          testsTotal: sub.testsTotal,
          runtimeMs: sub.runtimeMs,
          submittedAt: sub.submittedAt,
        });
      }
    } catch (err) {
      console.error("Submission error:", err);
      const classified = classifyRuntimeError(err);
      setValidationResult({
        passed: false,
        error: classified.message,
        checks: [{ description: classified.category, passed: false, message: classified.message }],
      });
      setSubmissionResult({
        success: false,
        status: "failed",
        error: err.message || "Failed to submit code.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Full Screen / Standalone Browser Preview in New Tab
  const handleOpenFullPreview = () => {
    const sessionId = "lsn_" + Math.random().toString(36).slice(2, 10);
    try {
      sessionStorage.setItem(
        `coding_preview_${sessionId}`,
        JSON.stringify({
          sourceType: "lesson",
          code,
          language,
          previewFixture: primaryBlock?.previewFixture,
          title: data?.lesson?.title || "Lesson Preview",
        })
      );
      window.open(`/coding/preview/${sessionId}`, "_blank");
    } catch (e) {
      console.error("Failed to store preview session:", e);
    }
  };

  // Open Progressive Hint Modal
  const handleOpenHint = () => {
    setHintModalOpen(true);
  };

  // Open Solution Comparison Modal
  const handleViewSolution = async () => {
    if (solutionCode) {
      setSolutionModalOpen(true);
      return;
    }

    try {
      const res = await learnApi.revealSolution(courseSlug, lessonId, {
        blockId: primaryBlock?.id,
      });
      if (res.data?.solutionCode) {
        setSolutionCode(res.data.solutionCode);
        setSolutionModalOpen(true);
      } else {
        throw new Error("No solution code returned");
      }
    } catch {
      setSolutionCode(
        `/* Reference Solution */\n` +
          (primaryBlock?.expectedOutput
            ? `/* Target Output:\n${primaryBlock.expectedOutput}\n*/\n\n`
            : "") +
          `/* Tip: Sign in and enroll in this course to save your progress and unlock the server-validated solution! */`
      );
      setSolutionModalOpen(true);
    }
  };

  // Replace Learner's Code with Reference Solution
  const handleReplaceCodeWithSolution = () => {
    if (
      window.confirm(
        "Replace your current code with the official reference solution? Your changes will be overwritten."
      )
    ) {
      setCode(solutionCode);
      setSolutionModalOpen(false);
    }
  };

  // Copy Solution to Clipboard
  const handleCopySolution = () => {
    navigator.clipboard.writeText(solutionCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (state.loading) {
    return (
      <div className="coding-page coding-workspace-page">
        <CodingSubNav />
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--cd-text-muted)" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚡</div>
          Opening MyJourney Coding workspace…
        </div>
      </div>
    );
  }

  if (!data?.lesson) {
    return (
      <div className="coding-page coding-workspace-page">
        <CodingSubNav />
        <div style={{ padding: "4rem", textAlign: "center" }}>
          <h2>Lesson Unavailable</h2>
          <p>{state.error || "The requested coding lesson could not be loaded."}</p>
          <Link to={`/coding/${trackKey}`} className="cd-btn cd-btn--secondary">
            Back to Track
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="coding-page coding-workspace-page">
      <CodingSubNav />

      {/* Header with Breadcrumbs and Quick Nav */}
      <header className="coding-workspace__header">
        <div className="coding-workspace__header-main">
          <button
            type="button"
            className="coding-workspace__icon-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle curriculum sidebar"
            aria-pressed={sidebarOpen}
          >
            <FiSidebar />
          </button>

          <nav className="coding-workspace__breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/coding">Coding</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/coding/${trackKey}`}>{data.course.title}</Link>
            <span aria-hidden="true">/</span>
            <span className="coding-workspace__breadcrumb-current">
              {data.lesson.title}
            </span>
          </nav>
        </div>

        <div className="coding-workspace__quick-nav">
          {prevLesson && (
            <Link
              to={`/coding/${trackKey}/lesson/${prevLesson.id}`}
              className="coding-workspace__nav-link"
            >
              <FiArrowLeft /> Prev
            </Link>
          )}

          {nextLesson && (
            <Link
              to={`/coding/${trackKey}/lesson/${nextLesson.id}`}
              className="coding-workspace__nav-link coding-workspace__nav-link--next"
            >
              Next <FiArrowRight />
            </Link>
          )}
        </div>
      </header>

      {/* Top Mobile View Switcher Tabs (<= 992px) */}
      <div className="cd-mobile-tabs" role="tablist" aria-label="Mobile workspace view">
        <button
          type="button"
          className={`cd-mobile-tab-btn ${mobileTab === "concept" ? "is-active" : ""}`}
          onClick={() => setMobileTab("concept")}
          role="tab"
          aria-selected={mobileTab === "concept"}
        >
          📖 Concept
        </button>
        <button
          type="button"
          className={`cd-mobile-tab-btn ${mobileTab === "code" ? "is-active" : ""}`}
          onClick={() => setMobileTab("code")}
          role="tab"
          aria-selected={mobileTab === "code"}
        >
          💻 Code
        </button>
        <button
          type="button"
          className={`cd-mobile-tab-btn ${mobileTab === "output" ? "is-active" : ""}`}
          onClick={() => setMobileTab("output")}
          role="tab"
          aria-selected={mobileTab === "output"}
        >
          👁 Output
        </button>
      </div>

      {/* Main 3-Zone Workspace */}
      <div className="coding-workspace-3zone">
        {/* ── ZONE 1: Course Navigator Sidebar ────────────────────────────── */}
        <aside
          className={`coding-workspace__sidebar cd-zone-sidebar ${!sidebarOpen ? "is-collapsed" : ""}`}
          aria-label="Course curriculum"
        >
          <div className="cd-zone-sidebar__header">
            <p className="cd-zone-sidebar__eyebrow">Course progress</p>
            <h2 className="cd-zone-sidebar__track-title">{data.course.title}</h2>
            <div className="cd-zone-sidebar__progress-meta">
              <span>
                {completedCount} / {totalLessonsCount} lessons completed
              </span>
              <span>{coursePercent}%</span>
            </div>
            <div className="cd-zone-sidebar__progress-bar">
              <div
                className="cd-zone-sidebar__progress-fill"
                style={{ width: `${coursePercent}%` }}
              />
            </div>
          </div>

          <nav className="cd-zone-sidebar__list" aria-label="Lessons list">
            {data.course.curriculum?.map((module, mIdx) => {
              const moduleTitle = String(module.title || "")
                .replace(/^module\s+\d+\s*:\s*/i, "")
                .trim();

              return (
                <div key={module.stableKey || mIdx} className="cd-zone-sidebar__module">
                  <div className="cd-zone-sidebar__module-heading">
                    <span>Module {mIdx + 1}</span>
                    <strong>{moduleTitle || `Learning module ${mIdx + 1}`}</strong>
                  </div>

                  <ul className="cd-zone-sidebar__lesson-list">
                    {module.lessons?.map((item) => {
                      const isDone =
                        completedLessonKeys.has(String(item.id)) ||
                        completedLessonKeys.has(item.stableKey);
                      const isCurrent = String(item.id) === String(lessonId);

                      return (
                        <li key={item.id}>
                          <Link
                            to={`/coding/${trackKey}/lesson/${item.id}`}
                            className={`cd-zone-sidebar__item-link ${isCurrent ? "is-active" : ""}`}
                            aria-current={isCurrent ? "page" : undefined}
                          >
                            <span
                              className={`cd-zone-sidebar__status-icon ${
                                isDone ? "is-done" : isCurrent ? "is-current" : "is-todo"
                              }`}
                            >
                              {isDone ? "✓" : isCurrent ? "●" : "○"}
                            </span>
                            <span className="cd-zone-sidebar__item-title">
                              {item.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="coding-workspace__main" ref={resizableWorkspaceRef}>
        {/* ── ZONE 2: Center Learning Panel ────────────────────────────────── */}
        <section
          className="cd-zone-center"
          aria-label="Lesson description and instructions"
          style={{
            display: mobileTab !== "concept" && window.innerWidth <= 992 ? "none" : "flex",
            width: window.innerWidth > 992 ? `${centerWidthPercent}%` : undefined,
            flex: window.innerWidth > 992 ? `0 0 ${centerWidthPercent}%` : undefined,
          }}
        >
          {/* Header */}
          <div className="cd-zone-center__header">
            <div className="cd-zone-center__header-row">
              <div className="cd-zone-center__kicker">
                Lesson {currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1} of {totalLessonsCount}
              </div>
              <button
                type="button"
                className="coding-workspace__icon-btn coding-workspace__icon-btn--small"
                onClick={() => setSidebarOpen((prev) => !prev)}
                title="Toggle sidebar"
                aria-label="Toggle curriculum sidebar"
                aria-pressed={sidebarOpen}
              >
                <FiSidebar />
              </button>
            </div>

            <h1 className="cd-zone-center__title">{data.lesson.title}</h1>

            <div className="cd-zone-center__badges">
              <span className="cd-badge-pill cd-badge-pill--green">
                {data.course.level?.replace("_", " ") || "Beginner"}
              </span>
              <span className="cd-badge-pill">
                ⏱ {data.lesson.estimatedMinutes || 5} min
              </span>
              <span className="cd-badge-pill cd-badge-pill--blue">
                {trackMeta.label}
              </span>
              {state.completed && (
                <span className="cd-badge-pill cd-badge-pill--green">
                  <FiCheck /> Completed
                </span>
              )}
            </div>
          </div>

          {/* Sub-tabs for content */}
          <div className="cd-zone-center__tabs" role="tablist">
            <button
              type="button"
              className={`cd-zone-center__tab-btn ${centerTab === "concept" ? "is-active" : ""}`}
              onClick={() => setCenterTab("concept")}
              role="tab"
              aria-selected={centerTab === "concept"}
            >
              Concept
            </button>
            <button
              type="button"
              className={`cd-zone-center__tab-btn ${centerTab === "example" ? "is-active" : ""}`}
              onClick={() => setCenterTab("example")}
              role="tab"
              aria-selected={centerTab === "example"}
            >
              Example
            </button>
            <button
              type="button"
              className={`cd-zone-center__tab-btn ${centerTab === "challenge" ? "is-active" : ""}`}
              onClick={() => setCenterTab("challenge")}
              role="tab"
              aria-selected={centerTab === "challenge"}
            >
              Your Challenge
            </button>
            {primaryBlock?.expectedOutput && (
              <button
                type="button"
                className={`cd-zone-center__tab-btn ${centerTab === "expected" ? "is-active" : ""}`}
                onClick={() => setCenterTab("expected")}
                role="tab"
                aria-selected={centerTab === "expected"}
              >
                Expected Output
              </button>
            )}
            {hints.length > 0 && (
              <button
                type="button"
                className={`cd-zone-center__tab-btn ${centerTab === "hints" ? "is-active" : ""}`}
                onClick={() => setCenterTab("hints")}
                role="tab"
                aria-selected={centerTab === "hints"}
              >
                Hints ({hints.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="cd-zone-center__content">
            {centerTab === "concept" && (
              <div>
                {data.lesson.body ? (
                  data.lesson.body.split(/\n{2,}/).map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))
                ) : (
                  <p>Welcome to this hands-on lesson. Read the challenge instructions to begin.</p>
                )}

                <div className="cd-zone-center__callout">
                  <span className="cd-zone-center__callout-icon" aria-hidden="true">💡</span>
                  <div>
                    <strong>Pro Tip:</strong> Code directly in the editor on the right, then press{" "}
                    <kbd>Ctrl+Enter</kbd>{" "}
                    to run and observe the live preview.
                  </div>
                </div>
              </div>
            )}

            {centerTab === "example" && (
              <div>
                <h3 style={{ fontSize: "1rem", color: "#f8fafc", margin: "0 0 0.75rem" }}>
                  Code Example
                </h3>
                <pre
                  style={{
                    background: "#050811",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #1e293b",
                    fontSize: "0.85rem",
                    color: "#38bdf8",
                    margin: 0,
                    overflowX: "auto",
                  }}
                >
                  <code>
                    {primaryBlock?.starterCode || "/* No standalone example provided */"}
                  </code>
                </pre>
              </div>
            )}

            {centerTab === "challenge" && (
              <div>
                <h3 style={{ fontSize: "1.05rem", color: "#f8fafc", margin: "0 0 0.5rem" }}>
                  Your Task
                </h3>
                <p style={{ color: "#e2e8f0", fontSize: "0.925rem" }}>
                  {primaryBlock?.instructions || "Write the required code to fulfill the task."}
                </p>
              </div>
            )}

            {centerTab === "expected" && primaryBlock?.expectedOutput && (
              <div>
                <h3 style={{ fontSize: "1rem", color: "#f8fafc", margin: "0 0 0.5rem" }}>
                  Expected Visual / Text Output
                </h3>
                <pre
                  style={{
                    background: "#050811",
                    padding: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #1e293b",
                    fontSize: "0.85rem",
                    color: "#22d3ee",
                    margin: 0,
                    overflowX: "auto",
                  }}
                >
                  <code>{primaryBlock.expectedOutput}</code>
                </pre>
              </div>
            )}

            {centerTab === "hints" && (
              <div>
                <h3 style={{ fontSize: "1rem", color: "#f8fafc", margin: "0 0 0.75rem" }}>
                  Available Hints
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--cd-text-muted)" }}>
                  Need a nudge? Click below to reveal progressive hints without giving away the full answer.
                </p>
                <button
                  type="button"
                  className="cd-btn cd-btn--secondary"
                  onClick={handleOpenHint}
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem" }}
                >
                  <FiHelpCircle /> Open Hint Guide ({hints.length} available)
                </button>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <footer className="cd-zone-center__footer">
            {prevLesson ? (
              <Link
                to={`/coding/${trackKey}/lesson/${prevLesson.id}`}
                className="cd-btn cd-btn--secondary cd-zone-center__footer-btn"
              >
                <FiArrowLeft /> Previous
              </Link>
            ) : (
              <span className="cd-zone-center__footer-label">Start of Track</span>
            )}

            <span className="cd-zone-center__footer-count">
              {currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1} of {totalLessonsCount}
            </span>

            {nextLesson ? (
              <Link
                to={`/coding/${trackKey}/lesson/${nextLesson.id}`}
                className={`cd-btn cd-btn--primary cd-zone-center__footer-btn ${
                  state.completed ? "is-ready" : ""
                }`}
                style={{
                  boxShadow: state.completed ? "0 0 16px rgba(56, 189, 248, 0.28)" : "none",
                }}
              >
                Next Lesson <FiArrowRight />
              </Link>
            ) : (
              <Link
                to={`/coding/${trackKey}`}
                className="cd-btn cd-btn--primary cd-zone-center__footer-btn"
              >
                Track Complete 🎉
              </Link>
            )}
          </footer>
        </section>

        {/* Vertical Splitter between Instructions and Workspace */}
        {window.innerWidth > 992 && (
          <WorkspaceSplitter
            orientation="vertical"
            currentPercent={centerWidthPercent}
            minPercent={25}
            maxPercent={55}
            onResize={handleResizeVertical}
            containerRef={resizableWorkspaceRef}
            onReset={() => {
              setCenterWidthPercent(36);
              try {
                localStorage.setItem("myjourney_coding_split_v", "36");
              } catch {}
            }}
            title="Drag to resize instructions and workspace (Double-click to reset layout)"
          />
        )}

        {/* ── ZONE 3: IDE Workspace & Output Panel ─────────────────────────── */}
        <main
          ref={ideWorkspaceRef}
          className="cd-zone-workspace"
          aria-label="Code editor and output sandbox"
          style={{
            display:
              mobileTab !== "code" && mobileTab !== "output" && window.innerWidth <= 992
                ? "none"
                : "flex",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Action Bar */}
          <div className="cd-workspace-action-bar">
            <div className="cd-workspace-action-bar__left">
              <span className="cd-workspace-language-pill">
                <FiTerminal aria-hidden="true" />
                {language}
              </span>
              {language === "python" && (
                <span className="cd-workspace-runtime-status">
                  Pyodide: {pythonStatus}
                </span>
              )}
            </div>

            <div className="cd-workspace-action-bar__right">
              <div className="cd-workspace-action-group cd-workspace-action-group--utilities">
                <button
                  type="button"
                  className="cd-btn cd-btn--secondary cd-workspace-tool-btn cd-workspace-tool-btn--compact"
                  onClick={() => setSubmissionsDrawerOpen(true)}
                  title="View submission history"
                >
                  <FiClock /> <span className="cd-tool-label">Submissions</span>
                </button>

                <button
                  type="button"
                  className="cd-btn cd-btn--secondary cd-workspace-tool-btn cd-workspace-tool-btn--compact"
                  onClick={handleReset}
                  title="Reset code to starter template"
                >
                  <FiRefreshCw /> <span className="cd-tool-label">Reset</span>
                </button>

                {hints.length > 0 && (
                  <button
                    type="button"
                    className="cd-btn cd-btn--secondary cd-workspace-tool-btn cd-workspace-tool-btn--compact"
                    onClick={handleOpenHint}
                    title="View progressive hints"
                  >
                    <FiHelpCircle /> <span className="cd-tool-label">Hint</span>
                  </button>
                )}

                <button
                  type="button"
                  className="cd-btn cd-btn--secondary cd-workspace-tool-btn cd-workspace-tool-btn--compact"
                  onClick={handleViewSolution}
                  title="View official solution"
                >
                  <FiCode /> <span className="cd-tool-label">Solution</span>
                </button>
              </div>

              <div className="cd-workspace-action-group cd-workspace-action-group--primary">
                <button
                  type="button"
                  className="cd-btn cd-workspace-tool-btn cd-workspace-tool-btn--run"
                  onClick={handleRun}
                  disabled={isExecuting}
                  title="Execute code (Ctrl+Enter)"
                >
                  <FiPlay /> Run
                </button>

                <button
                  type="button"
                  className="cd-btn cd-btn--secondary cd-workspace-tool-btn"
                  onClick={handleCheck}
                  disabled={isValidating || isSubmitting}
                  title="Validate code against challenge criteria"
                >
                  <FiCheck /> {isValidating ? "Checking…" : "Check"}
                </button>

                <button
                  type="button"
                  className="cd-btn cd-btn--submit cd-workspace-tool-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isValidating}
                  title="Submit solution to course engine"
                >
                  <FiSend /> {isSubmitting ? "Submitting…" : "Submit"}
                </button>

                <button
                  type="button"
                  className="coding-workspace__icon-btn coding-workspace__icon-btn--toolbar"
                  onClick={() => setMaximizedPanel((curr) => (curr === "editor" ? null : "editor"))}
                  title={maximizedPanel === "editor" ? "Restore workspace layout" : "Maximize Code Editor"}
                  aria-label={maximizedPanel === "editor" ? "Restore workspace" : "Maximize editor"}
                >
                  {maximizedPanel === "editor" ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Code Editor Pane */}
          <div
            className="cd-editor-pane"
            style={{
              display:
                (mobileTab === "output" && window.innerWidth <= 992) || maximizedPanel === "output"
                  ? "none"
                  : "flex",
              height: maximizedPanel === "editor" ? "100%" : `${editorHeightPercent}%`,
              flex: maximizedPanel === "editor" ? "1 1 100%" : `0 0 ${editorHeightPercent}%`,
              minHeight: 0,
            }}
          >
            <WorkspaceCodeEditor
              value={code}
              onChange={setCode}
              language={language}
              onRun={handleRun}
              disabled={isExecuting}
              isSaving={isDraftSaving}
              isDirty={isDirty}
            />
          </div>

          {/* Horizontal Splitter between Editor and Output */}
          {maximizedPanel === null && (
            <WorkspaceSplitter
              orientation="horizontal"
              currentPercent={editorHeightPercent}
              minPercent={20}
              maxPercent={80}
              onResize={handleResizeHorizontal}
              containerRef={ideWorkspaceRef}
              onReset={() => {
                setEditorHeightPercent(58);
                try {
                  localStorage.setItem("myjourney_coding_split_h", "58");
                } catch {}
              }}
              title="Drag to resize editor and output panels (Double-click to reset layout)"
            />
          )}

          {/* Output Panel (Preview | Console | Tests | Quiz) */}
          <div
            className="cd-output-pane"
            style={{
              display:
                (mobileTab === "code" && window.innerWidth <= 992) || maximizedPanel === "editor"
                  ? "none"
                  : "flex",
              height:
                maximizedPanel === "output"
                  ? "100%"
                  : `calc(100% - ${editorHeightPercent}% - 8px)`,
              flex: maximizedPanel === "output" ? "1 1 100%" : 1,
              minHeight: 0,
            }}
          >
            {/* Tab Bar with Device Switcher */}
            <div className="cd-output-tabs" role="tablist">
              <div className="cd-output-tabs__left">
                {language !== "python" && (
                  <button
                    type="button"
                    className={`cd-output-tab-btn ${
                      activeOutputTab === "preview" ? "is-active" : ""
                    }`}
                    onClick={() => setActiveOutputTab("preview")}
                    role="tab"
                    aria-selected={activeOutputTab === "preview"}
                  >
                    Preview
                  </button>
                )}

                <button
                  type="button"
                  className={`cd-output-tab-btn ${
                    activeOutputTab === "console" ? "is-active" : ""
                  }`}
                  onClick={() => setActiveOutputTab("console")}
                  role="tab"
                  aria-selected={activeOutputTab === "console"}
                >
                  Console{" "}
                  {consoleLogs.length > 0 && (
                    <span className="badge-count">{consoleLogs.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`cd-output-tab-btn ${
                    activeOutputTab === "tests" ? "is-active" : ""
                  }`}
                  onClick={() => setActiveOutputTab("tests")}
                  role="tab"
                  aria-selected={activeOutputTab === "tests"}
                >
                  Tests {exercisePassed && <span className="badge-success">✓</span>}
                </button>

                {hasQuizzes && (
                  <button
                    type="button"
                    className={`cd-output-tab-btn ${
                      activeOutputTab === "quiz" ? "is-active" : ""
                    }`}
                    onClick={() => setActiveOutputTab("quiz")}
                    role="tab"
                    aria-selected={activeOutputTab === "quiz"}
                  >
                    Quiz {quizPassed && <span className="badge-success">✓</span>}
                  </button>
                )}
              </div>

              <div className="cd-output-tabs__controls">
                {/* Full preview in new tab */}
                {activeOutputTab === "preview" && language !== "python" && (
                  <button
                    type="button"
                    className="cd-btn cd-btn--ghost cd-btn--sm cd-output-preview-btn"
                    onClick={handleOpenFullPreview}
                    title="Open live preview in full standalone tab"
                  >
                    <FiExternalLink size={13} />
                    <span>Open Preview ↗</span>
                  </button>
                )}

                {/* Device switcher (visible when Preview tab is active) */}
                {activeOutputTab === "preview" && language !== "python" && (
                  <div className="cd-device-switcher" aria-label="Preview viewport size">
                    <button
                      type="button"
                      className={`cd-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
                      onClick={() => setPreviewDevice("desktop")}
                      title="Desktop view"
                      aria-label="Desktop preview"
                    >
                      <FiMonitor />
                    </button>
                    <button
                      type="button"
                      className={`cd-device-btn ${previewDevice === "tablet" ? "is-active" : ""}`}
                      onClick={() => setPreviewDevice("tablet")}
                      title="Tablet view (768px)"
                      aria-label="Tablet preview"
                    >
                      <FiTablet />
                    </button>
                    <button
                      type="button"
                      className={`cd-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
                      onClick={() => setPreviewDevice("mobile")}
                      title="Mobile view (375px)"
                      aria-label="Mobile preview"
                    >
                      <FiSmartphone />
                    </button>
                  </div>
                )}

                {/* Maximize Output Button */}
                <button
                  type="button"
                  className="coding-workspace__icon-btn coding-workspace__icon-btn--toolbar"
                  onClick={() => setMaximizedPanel((curr) => (curr === "output" ? null : "output"))}
                  title={maximizedPanel === "output" ? "Restore workspace layout" : "Maximize Output Panel"}
                  aria-label={maximizedPanel === "output" ? "Restore workspace" : "Maximize output"}
                >
                  {maximizedPanel === "output" ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* Output Tab Body */}
            <div className="cd-output-body">
              {activeOutputTab === "preview" && language !== "python" && (
                <div className="cd-browser-mockup">
                  <div className="cd-browser-mockup__chrome">
                    <div className="cd-browser-mockup__dots">
                      <span className="cd-browser-mockup__dot cd-browser-mockup__dot--red" />
                      <span className="cd-browser-mockup__dot cd-browser-mockup__dot--yellow" />
                      <span className="cd-browser-mockup__dot cd-browser-mockup__dot--green" />
                    </div>
                    <div className="cd-browser-mockup__url">http://localhost:3000/preview</div>
                  </div>
                  <div className="cd-browser-mockup__viewport">
                    <div className={`cd-browser-mockup__frame-container is-${previewDevice}`}>
                      <iframe
                        ref={iframeRef}
                        title="Live Code Preview"
                        sandbox="allow-scripts"
                        srcDoc={srcdoc}
                        className="cd-browser-mockup__iframe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeOutputTab === "console" && (
                <div className="cd-console-body">
                  {consoleLogs.length === 0 ? (
                    <p style={{ color: "var(--cd-text-muted)", margin: 0 }}>
                      No output yet. Click &ldquo;Run&rdquo; (Ctrl+Enter) to execute your code.
                    </p>
                  ) : (
                    consoleLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`cd-console-entry ${
                          log.level === "error"
                            ? "cd-console-entry--error"
                            : log.level === "info"
                            ? "cd-console-entry--info"
                            : "cd-console-entry--log"
                        }`}
                      >
                        <span>{log.level === "error" ? "✖" : "›"}</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeOutputTab === "tests" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                  {submissionResult && (
                    <div
                      className={`cd-submission-banner cd-submission-banner--${
                        submissionResult.status === "accepted"
                          ? "accepted"
                          : submissionResult.status === "partially_passed"
                          ? "partial"
                          : "failed"
                      }`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {submissionResult.status === "accepted" ? (
                          <FiCheckCircle size={16} />
                        ) : (
                          <FiX size={16} />
                        )}
                        <span>
                          Submission:{" "}
                          <strong>
                            {submissionResult.status === "accepted"
                              ? "Accepted"
                              : submissionResult.status === "partially_passed"
                              ? "Partially Passed"
                              : "Failed"}
                          </strong>
                          {submissionResult.testsTotal > 0 &&
                            ` (${submissionResult.testsPassed} / ${submissionResult.testsTotal} passed)`}
                          {submissionResult.runtimeMs > 0 && ` • ${submissionResult.runtimeMs}ms`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="cd-btn cd-btn--secondary cd-btn--xs"
                        onClick={() => setSubmissionsDrawerOpen(true)}
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                      >
                        History
                      </button>
                    </div>
                  )}

                  {!validationResult ? (
                    <p style={{ fontSize: "0.85rem", color: "var(--cd-text-muted)", margin: 0 }}>
                      Click &ldquo;Check&rdquo; or &ldquo;Submit&rdquo; to validate your solution against requirements.
                    </p>
                  ) : (
                    <div>
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "6px",
                          marginBottom: "1rem",
                          background: validationResult.passed
                            ? "var(--cd-free-bg)"
                            : "var(--cd-red-bg)",
                          border: `1px solid ${
                            validationResult.passed
                              ? "var(--cd-free-border)"
                              : "var(--cd-red-border)"
                          }`,
                          color: validationResult.passed
                            ? "var(--cd-free-text)"
                            : "var(--cd-red-text)",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                        }}
                      >
                        {validationResult.passed
                          ? "🎉 Excellent! All challenge criteria passed."
                          : "⚠️ Some checks did not pass yet. Review checklist below:"}
                      </div>

                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.6rem",
                        }}
                      >
                        {validationResult.checks?.map((chk, cIdx) => (
                          <li
                            key={cIdx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.6rem",
                              fontSize: "0.85rem",
                              color: chk.passed ? "#34d399" : "#f87171",
                            }}
                          >
                            <span>{chk.passed ? "✓" : "✗"}</span>
                            <div>
                              <strong>{chk.description}</strong>
                              {chk.message && (
                                <p style={{ margin: "0.15rem 0 0", color: "var(--cd-text-secondary)" }}>
                                  {chk.message}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeOutputTab === "quiz" && hasQuizzes && (
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                  <QuizSection
                    questions={data.lesson.quizQuestions}
                    courseSlug={courseSlug}
                    lessonId={data.lesson.id}
                    onQuizPassed={() => setQuizPassed(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
        </div>
      </div>

      {/* ── Progressive Hint Modal ────────────────────────────────────────── */}
      {hintModalOpen && (
        <div
          className="cd-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hint-modal-title"
        >
          <div className="cd-hint-modal-card">
            <div className="cd-modal-header">
              <h3 id="hint-modal-title" style={{ margin: 0, fontSize: "1.05rem", color: "#fbbf24" }}>
                💡 Hint {currentHintIndex + 1} of {hints.length}
              </h3>
              <button
                type="button"
                className="cd-modal-close-btn"
                onClick={() => setHintModalOpen(false)}
                aria-label="Close hint modal"
              >
                <FiX />
              </button>
            </div>

            <div className="cd-modal-body">
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, color: "#f8fafc" }}>
                {hints[currentHintIndex] || "No additional hints available."}
              </p>
            </div>

            <div className="cd-modal-footer">
              <button
                type="button"
                className="cd-btn cd-btn--secondary"
                style={{ fontSize: "0.8rem" }}
                onClick={() => {
                  setHintModalOpen(false);
                  handleViewSolution();
                }}
              >
                View Solution Anyway
              </button>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {currentHintIndex > 0 && (
                  <button
                    type="button"
                    className="cd-btn cd-btn--secondary"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => setCurrentHintIndex((prev) => prev - 1)}
                  >
                    Previous Hint
                  </button>
                )}

                {currentHintIndex < hints.length - 1 ? (
                  <button
                    type="button"
                    className="cd-btn cd-btn--primary"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => setCurrentHintIndex((prev) => prev + 1)}
                  >
                    Next Hint
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cd-btn cd-btn--primary"
                    style={{ fontSize: "0.8rem" }}
                    onClick={() => setHintModalOpen(false)}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Solution Comparison Modal ─────────────────────────────────────── */}
      {solutionModalOpen && (
        <div
          className="cd-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="solution-modal-title"
        >
          <div className="cd-solution-modal-card">
            <div className="cd-modal-header">
              <div className="cd-solution-modal__header-content">
                <h3 id="solution-modal-title" className="cd-solution-modal__title">
                  Solution
                </h3>
                <div className="cd-solution-modal__tabs" role="tablist" aria-label="Solution view">
                  <button
                    type="button"
                    className={`cd-solution-modal__tab ${
                      solutionTab === "solution" ? "is-active" : ""
                    }`}
                    onClick={() => setSolutionTab("solution")}
                    role="tab"
                    aria-selected={solutionTab === "solution"}
                  >
                    Reference Solution
                  </button>
                  <button
                    type="button"
                    className={`cd-solution-modal__tab ${
                      solutionTab === "yourCode" ? "is-active" : ""
                    }`}
                    onClick={() => setSolutionTab("yourCode")}
                    role="tab"
                    aria-selected={solutionTab === "yourCode"}
                  >
                    Your Code
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="cd-modal-close-btn"
                onClick={() => setSolutionModalOpen(false)}
                aria-label="Close solution modal"
              >
                <FiX />
              </button>
            </div>

            <div className="cd-modal-body">
              <pre className="cd-solution-modal__code">
                <code>{solutionTab === "solution" ? solutionCode : code}</code>
              </pre>

              <div className="cd-solution-modal__explanation">
                <strong>Why this works?</strong>
                <p>
                  The reference solution fulfills all strict validation constraints. Notice the structure,
                  exact selectors/syntax, and adherence to clean coding principles.
                </p>
              </div>
            </div>

            <div className="cd-modal-footer">
              <button
                type="button"
                className="cd-btn cd-btn--secondary cd-solution-modal__footer-btn"
                onClick={handleCopySolution}
              >
                <FiCopy /> {copySuccess ? "Copied!" : "Copy Solution"}
              </button>

              <button
                type="button"
                className="cd-btn cd-btn--primary cd-solution-modal__footer-btn cd-solution-modal__replace-btn"
                onClick={handleReplaceCodeWithSolution}
              >
                <FiPlay /> Replace My Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions History Drawer */}
      <SubmissionsDrawer
        isOpen={submissionsDrawerOpen}
        onClose={() => setSubmissionsDrawerOpen(false)}
        courseSlug={courseSlug}
        lessonId={lessonId}
        onLoadSnapshot={(snapshot) => {
          setCode(snapshot);
          setIsDirty(true);
        }}
      />
    </div>
  );
}
