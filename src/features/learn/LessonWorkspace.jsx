import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { learnApi } from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import ContentReportForm from "./ContentReportForm.jsx";
import CodeEditor from "./components/CodeEditor.jsx";
import QuizSection from "./components/QuizSection.jsx";
import { runExerciseValidation } from "./components/ValidationRunner";
import {
  createSandboxSrcdoc,
  generateChannelNonce,
  validateSandboxMessage,
  SANDBOX_PERMISSIONS,
} from "./sandbox/htmlSandboxHarness";
import { defaultPythonManager } from "./sandbox/pythonWorkerManager";
import "./learn.css";

const idempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() || `lesson-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function LessonWorkspace() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, busy: false, error: "", completed: false });
  const bodyParagraphs = useMemo(() => String(data?.lesson?.body || "").split(/\n{2,}/).filter(Boolean), [data?.lesson?.body]);

  // Coding block state
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "console" | "tests"
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Hints & solution
  const [revealedHints, setRevealedHints] = useState(0);
  const [solutionCode, setSolutionCode] = useState("");
  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [solutionViewed, setSolutionViewed] = useState(false);

  // Completion gates
  const [exercisePassed, setExercisePassed] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  // Sandbox iframe references
  const iframeRef = useRef(null);
  const channelNonceRef = useRef(generateChannelNonce());
  const [srcdoc, setSrcdoc] = useState("");

  // Python runtime state
  const [pythonStatus, setPythonStatus] = useState("READY");

  // Load lesson data
  useEffect(() => {
    let active = true;
    setState({ loading: true, busy: false, error: "", completed: false });
    setConsoleLogs([]);
    setValidationResult(null);
    setRevealedHints(0);
    setSolutionCode("");

    learnApi.lesson(slug, lessonId)
      .then((response) => {
        if (!active) return;
        const res = response.data;
        setData(res);

        // Initialize progress states
        const progress = res.progress;
        setExercisePassed(Boolean(progress?.exercisePassed));
        setQuizPassed(Boolean(progress?.quizPassed));
        setSolutionViewed(Boolean(progress?.solutionViewed));
        const isAlreadyComplete = Boolean(progress?.completed);

        // Find primary coding block
        const codingBlock = res.lesson?.codingBlocks?.[0];
        if (codingBlock) {
          setCode(codingBlock.starterCode || "");
          const lang = codingBlock.language?.toLowerCase();
          if (lang === "html" || lang === "css") {
            setActiveTab("preview");
          } else {
            setActiveTab("console");
          }
        }

        setState({
          loading: false,
          busy: false,
          error: "",
          completed: isAlreadyComplete,
        });
      })
      .catch((error) => {
        if (active) setState({ loading: false, busy: false, error: error.message, completed: false });
      });

    return () => {
      active = false;
    };
  }, [lessonId, slug]);

  const primaryBlock = useMemo(() => data?.lesson?.codingBlocks?.[0] || null, [data]);
  const language = useMemo(() => primaryBlock?.language?.toLowerCase() || "html", [primaryBlock]);
  const isCodingLesson = useMemo(
    () => data?.lesson?.lessonType === "coding" || data?.lesson?.lessonType === "project" || Boolean(primaryBlock),
    [data, primaryBlock]
  );
  const hasQuizzes = useMemo(() => (data?.lesson?.quizQuestions?.length || 0) > 0, [data]);

  // Determine next lesson in course curriculum
  const nextLesson = useMemo(() => {
    if (!data?.course?.curriculum) return null;
    const allLessons = data.course.curriculum.flatMap((m) => m.lessons || []);
    const currentIndex = allLessons.findIndex((l) => String(l.id) === String(lessonId));
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    return null;
  }, [data, lessonId]);

  // Subscribe to Python worker events
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
      } else if (event.type === "RUN_ERROR") {
        setIsExecuting(false);
        setConsoleLogs((prev) => [...prev, { level: "error", text: event.error }]);
      } else if (event.type === "TIMEOUT" || event.type === "ERROR") {
        setIsExecuting(false);
        setConsoleLogs((prev) => [...prev, { level: "error", text: event.error }]);
      }
    });

    return () => unsubscribe();
  }, [language]);

  // Listen for sandboxed iframe postMessage
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

  // Run code handler
  const handleRun = () => {
    setIsExecuting(true);
    setConsoleLogs([]);

    if (language === "python") {
      setActiveTab("console");
      defaultPythonManager.run(code);
      return;
    }

    // HTML / CSS / JS in sandboxed iframe
    const newNonce = generateChannelNonce();
    channelNonceRef.current = newNonce;

    let htmlContent = "";
    let cssContent = "";
    let jsContent = "";

    if (language === "html") {
      htmlContent = code;
    } else if (language === "css") {
      htmlContent = primaryBlock?.expectedOutput || "<div class=\"box\">Preview target</div>";
      cssContent = code;
    } else if (language === "javascript" || language === "js") {
      jsContent = code;
      htmlContent = "<div id=\"root\"></div>";
    }

    const doc = createSandboxSrcdoc({
      html: htmlContent,
      css: cssContent,
      js: jsContent,
      channelNonce: newNonce,
    });

    setSrcdoc(doc);

    if (language === "html" || language === "css") {
      setActiveTab("preview");
    } else {
      setActiveTab("console");
    }

    // Failsafe execution spinner timeout
    setTimeout(() => setIsExecuting(false), 800);
  };

  // Reset code handler
  const handleReset = () => {
    if (primaryBlock?.starterCode !== undefined) {
      setCode(primaryBlock.starterCode);
      setConsoleLogs([]);
      setValidationResult(null);
    }
  };

  // Check / Validate exercise handler
  const handleCheck = async () => {
    setIsValidating(true);
    setActiveTab("tests");

    // Execute first if not executed
    const executionOutput = {
      logs: consoleLogs.map((l) => l.text),
      errors: consoleLogs.filter((l) => l.level === "error"),
      stdout: consoleLogs.map((l) => l.text).join("\n"),
    };

    const rules = primaryBlock?.validationRules || [];
    const result = runExerciseValidation({
      language,
      code,
      rules,
      executionOutput,
    });

    setValidationResult(result);
    setIsValidating(false);

    if (result.passed) {
      setExercisePassed(true);
      // Record exercise pass through authenticated endpoint
      if (isAuthenticated && data?.course?.id && data?.lesson?.id && primaryBlock?.id) {
        try {
          await learnApi.exerciseAttempt(data.course.id, data.lesson.id, {
            blockId: primaryBlock.id,
            passed: true,
          });
        } catch (e) {
          // silently handle attempt sync error
        }
      }
    }
  };

  // View Solution handler
  const handleViewSolution = async () => {
    if (!isAuthenticated) {
      setState((prev) => ({ ...prev, error: "Sign in to view lesson solutions." }));
      return;
    }

    if (solutionCode) {
      setSolutionModalOpen(true);
      return;
    }

    try {
      const response = await learnApi.revealSolution(slug, lessonId, {
        blockId: primaryBlock?.id,
      });
      setSolutionCode(response?.solutionCode || "// No solution provided");
      setSolutionViewed(true);
      setSolutionModalOpen(true);
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to reveal solution." }));
    }
  };
  // Complete lesson handler
  const handleComplete = async () => {
    if (!isAuthenticated) {
      setState((prev) => ({ ...prev, error: "Sign in and enroll to save Lesson progress." }));
      return;
    }

    if (isCodingLesson && !exercisePassed) {
      setState((prev) => ({
        ...prev,
        error: "You must pass the exercise check before marking this lesson complete.",
      }));
      setActiveTab("tests");
      return;
    }

    if (hasQuizzes && !quizPassed) {
      setState((prev) => ({
        ...prev,
        error: "You must pass the lesson quiz before marking this lesson complete.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, busy: true, error: "" }));
    try {
      await learnApi.progress(data.course.id, {
        lessonId: data.lesson.id,
        positionSeconds: data.lesson.durationSeconds || 0,
        completed: true,
        idempotencyKey: idempotencyKey(),
      });

      setState((prev) => ({ ...prev, busy: false, completed: true }));

      if (nextLesson) {
        navigate(`/learn/courses/${slug}/lessons/${nextLesson.id}`);
      }
    } catch (error) {
      setState((prev) => ({ ...prev, busy: false, error: error.message }));
    }
  };

  if (state.loading) {
    return (
      <main className="learn-page">
        <p className="learn-state" role="status">Opening Lesson…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="learn-page">
        <section className="learn-lock" role="alert">
          <p className="learn-kicker">Course access</p>
          <h1>
            {state.error?.toLowerCase().includes("premium")
              ? "This Lesson is part of MyJourney Premium."
              : "Lesson unavailable"}
          </h1>
          <p>{state.error}</p>
          <div>
            <Link className="learn-primary-action" to="/premium">Explore Premium</Link>
            <Link to={`/learn/courses/${slug}`}>Back to Course</Link>
          </div>
        </section>
      </main>
    );
  }

  const hintsList = primaryBlock?.hints || [];

  if (!isCodingLesson) {
    return (
      <main className="learn-page learn-lesson">
        <nav className="learn-breadcrumbs" aria-label="Breadcrumb"><Link to="/learn">Learn</Link><span>/</span><Link to={`/learn/courses/${slug}`}>{data.course.title}</Link></nav>
        <article className="learn-lesson__reader">
          <header><p className="learn-kicker">{data.lesson.lessonType} Lesson</p><h1>{data.lesson.title}</h1>{data.lesson.description && <p>{data.lesson.description}</p>}</header>
          {data.lesson.mediaAssetId && <section className="learn-media-boundary"><h2>Lesson media</h2><p>Secure playback becomes available when a production media provider is configured. Access remains protected server-side.</p></section>}
          <div className="learn-prose">{bodyParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>)}</div>
          {data.lesson.transcript && <details className="learn-transcript"><summary>Transcript</summary><div className="learn-prose"><p>{data.lesson.transcript}</p></div></details>}
          <footer><button className="learn-primary-action" type="button" onClick={handleComplete} disabled={state.busy || state.completed}>{state.completed ? "Lesson complete" : state.busy ? "Saving…" : "Mark Lesson complete"}</button>{state.error && <p className="learn-notice" role="alert">{state.error}</p>}</footer>
          <ContentReportForm targetType="lesson" targetId={data.lesson.id} />
        </article>
      </main>
    );
  }

  return (
    <main className="learn-page learn-workspace">
      {/* Navigation Breadcrumb */}
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/learn/courses/${slug}`}>{data.course.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{data.lesson.title}</span>
      </nav>

      {/* Main Workspace Grid (Desktop Split / Mobile Stack) */}
      <div className={`learn-workspace__grid ${isCodingLesson ? "learn-workspace__grid--split" : ""}`}>
        {/* Left Column: Lesson Instructions, Explanation, Quiz */}
        <section className="learn-workspace__content" aria-label="Lesson instructions and theory">
          <header className="learn-workspace__header">
            <div className="learn-workspace__badges">
              <span className="learn-badge learn-badge--type">{data.lesson.lessonType}</span>
              {data.course.accessLevel === "premium" && (
                <span className="learn-badge learn-badge--premium">Premium</span>
              )}
              {state.completed && (
                <span className="learn-badge learn-badge--completed">✓ Completed</span>
              )}
            </div>
            <h1>{data.lesson.title}</h1>
            {data.lesson.description && <p className="learn-subtitle">{data.lesson.description}</p>}
          </header>

          {/* Lesson Body Paragraphs */}
          <div className="learn-prose">
            {bodyParagraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>
            ))}
          </div>

          {/* Primary Coding Block Content & Worked Example */}
          {primaryBlock && (
            <div className="learn-exercise-prompt">
              {primaryBlock.content && (
                <div className="learn-exercise-prompt__explanation">
                  <h3>Concept</h3>
                  <p>{primaryBlock.content}</p>
                </div>
              )}

              {primaryBlock.instructions && (
                <div className="learn-exercise-prompt__challenge">
                  <h3>Your Challenge</h3>
                  <div className="learn-exercise-prompt__instructions">
                    {primaryBlock.instructions}
                  </div>
                </div>
              )}

              {primaryBlock.expectedOutput && (
                <div className="learn-exercise-prompt__expected">
                  <h4>Expected Output</h4>
                  <pre><code>{primaryBlock.expectedOutput}</code></pre>
                </div>
              )}

              {/* Progressive Hints */}
              {hintsList.length > 0 && (
                <div className="learn-hints" aria-labelledby="hints-heading">
                  <h4 id="hints-heading">Need a Hint?</h4>
                  {hintsList.slice(0, revealedHints).map((hint, idx) => (
                    <div key={idx} className="learn-hint-card">
                      <strong>Hint {idx + 1}:</strong> {hint}
                    </div>
                  ))}
                  {revealedHints < hintsList.length && (
                    <button
                      type="button"
                      className="learn-btn learn-btn--ghost"
                      onClick={() => setRevealedHints((n) => n + 1)}
                    >
                      💡 Reveal Hint {revealedHints + 1} of {hintsList.length}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lesson Quiz Section */}
          {hasQuizzes && (
            <QuizSection
              courseSlug={slug}
              lessonId={data.lesson.id}
              questions={data.lesson.quizQuestions}
              initialPassed={quizPassed}
              onQuizPassed={() => setQuizPassed(true)}
            />
          )}

          {/* Lesson Completion Action Bar */}
          <footer className="learn-workspace__footer">
            <button
              type="button"
              className="learn-primary-action"
              onClick={handleComplete}
              disabled={state.busy || (isCodingLesson && !exercisePassed) || (hasQuizzes && !quizPassed)}
            >
              {state.busy
                ? "Saving…"
                : state.completed
                ? nextLesson
                  ? "Next Lesson →"
                  : "Course Finished 🎉"
                : "Mark Lesson Complete"}
            </button>

            {state.error && <p className="learn-notice" role="alert">{state.error}</p>}
          </footer>

          <ContentReportForm targetType="lesson" targetId={data.lesson.id} />
        </section>

        {/* Right Column: Code Editor & Execution Surface (Only for coding/project lessons) */}
        {isCodingLesson && (
          <section className="learn-workspace__surface" aria-label="Interactive coding surface">
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={handleRun}
              onReset={handleReset}
              onCheck={handleCheck}
              onViewSolution={handleViewSolution}
              language={language}
              isExecuting={isExecuting}
              isValidating={isValidating}
              hasSolution={true}
              solutionViewed={solutionViewed}
            />

            {/* Output Panel with Tab Bar */}
            <div className="learn-output-panel" role="region" aria-label="Output and validation results">
              <nav className="learn-output-tabs" aria-label="Output views">
                {(language === "html" || language === "css") && (
                  <button
                    type="button"
                    className={`learn-tab ${activeTab === "preview" ? "learn-tab--active" : ""}`}
                    onClick={() => setActiveTab("preview")}
                  >
                    Live Preview
                  </button>
                )}
                <button
                  type="button"
                  className={`learn-tab ${activeTab === "console" ? "learn-tab--active" : ""}`}
                  onClick={() => setActiveTab("console")}
                >
                  Console {consoleLogs.length > 0 && `(${consoleLogs.length})`}
                </button>
                <button
                  type="button"
                  className={`learn-tab ${activeTab === "tests" ? "learn-tab--active" : ""}`}
                  onClick={() => setActiveTab("tests")}
                >
                  Validation Checks {validationResult ? (validationResult.passed ? "✓" : "✗") : ""}
                </button>
              </nav>

              {/* Live Preview / Sandbox Execution Surface */}
              <div
                className={`learn-output-panel__preview ${
                  (language === "html" || language === "css") && activeTab === "preview"
                    ? ""
                    : "learn-output-panel__preview--offscreen"
                }`}
                aria-hidden={!((language === "html" || language === "css") && activeTab === "preview")}
              >
                <iframe
                  ref={iframeRef}
                  title="Isolated Preview"
                  sandbox={SANDBOX_PERMISSIONS}
                  srcDoc={srcdoc}
                  className="learn-sandbox-iframe"
                />
              </div>

              {/* Console Output Tab */}
              {activeTab === "console" && (
                <div className="learn-output-panel__console" role="log" aria-live="polite">
                  {language === "python" && pythonStatus === "LOADING_PYODIDE" && (
                    <div className="learn-console-line learn-console-line--info">
                      ⏳ Initializing Pyodide Python runtime (first load may take a few seconds)...
                    </div>
                  )}
                  {consoleLogs.length === 0 ? (
                    <p className="learn-output-empty">
                      Click &ldquo;Run Code&rdquo; to execute and view output here.
                    </p>
                  ) : (
                    consoleLogs.map((log, idx) => (
                      <div key={idx} className={`learn-console-line learn-console-line--${log.level}`}>
                        <span className="learn-console-line__level">[{log.level}]</span>
                        <span className="learn-console-line__text">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Validation Checklist Tab */}
              {activeTab === "tests" && (
                <div className="learn-output-panel__tests" role="region" aria-label="Check results">
                  {!validationResult ? (
                    <p className="learn-output-empty">
                      Click &ldquo;Check&rdquo; to validate your solution against the exercise requirements.
                    </p>
                  ) : (
                    <div className="learn-validation-summary">
                      <div
                        className={`learn-validation-banner ${
                          validationResult.passed
                            ? "learn-validation-banner--passed"
                            : "learn-validation-banner--failed"
                        }`}
                      >
                        {validationResult.passed
                          ? "🎉 Excellent! All exercise criteria passed."
                          : "⚠️ Some checks did not pass yet. Review the checklist below:"}
                      </div>

                      <ul className="learn-validation-checklist">
                        {validationResult.checks.map((check, idx) => (
                          <li
                            key={idx}
                            className={`learn-validation-item ${
                              check.passed ? "learn-validation-item--passed" : "learn-validation-item--failed"
                            }`}
                          >
                            <span className="learn-validation-item__icon" aria-hidden="true">
                              {check.passed ? "✓" : "✗"}
                            </span>
                            <div>
                              <strong>{check.description}</strong>
                              {check.message && <p>{check.message}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Solution Modal */}
      {solutionModalOpen && (
        <div className="learn-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="solution-modal-title">
          <div className="learn-modal-card">
            <header className="learn-modal-card__header">
              <h3 id="solution-modal-title">Official Solution</h3>
              <button
                type="button"
                className="learn-btn-close"
                onClick={() => setSolutionModalOpen(false)}
                aria-label="Close solution modal"
              >
                ✕
              </button>
            </header>
            <div className="learn-modal-card__body">
              <div className="learn-notice learn-notice--warning">
                <strong>Study Note:</strong> Viewing the solution reveals the intended approach. However,
                to master the skill and complete this lesson, you must write and pass the code yourself.
              </div>
              <pre className="learn-code-block">
                <code>{solutionCode}</code>
              </pre>
            </div>
            <footer className="learn-modal-card__footer">
              <button
                type="button"
                className="learn-btn learn-btn--primary"
                onClick={() => setSolutionModalOpen(false)}
              >
                Close Solution
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
