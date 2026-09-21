import React, { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiCopy,
  FiDownload,
  FiAlertTriangle,
  FiCode,
} from "react-icons/fi";
import { listCodingSubmissions, getCodingSubmission } from "../../../services/apiService";

export default function SubmissionsDrawer({
  isOpen,
  onClose,
  courseSlug,
  lessonId,
  onLoadSnapshot,
}) {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [confirmLoadSnapshot, setConfirmLoadSnapshot] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!courseSlug || !lessonId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await listCodingSubmissions(courseSlug, lessonId);
      if (res && res.success) {
        setSubmissions(res.submissions || []);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setError(err.message || "Failed to load submission history.");
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, lessonId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSubmission(null);
      setConfirmLoadSnapshot(false);
      fetchSubmissions();
    }
  }, [isOpen, fetchSubmissions]);

  const handleSelectSubmission = async (sub) => {
    setIsLoadingDetail(true);
    try {
      const res = await getCodingSubmission(courseSlug, lessonId, sub._id || sub.id);
      if (res && res.success && res.submission) {
        setSelectedSubmission(res.submission);
      } else {
        setSelectedSubmission(sub);
      }
    } catch {
      setSelectedSubmission(sub);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleApplyToEditor = () => {
    if (!selectedSubmission || !selectedSubmission.codeSnapshot) return;
    onLoadSnapshot(selectedSubmission.codeSnapshot);
    setConfirmLoadSnapshot(false);
    onClose();
  };

  if (!isOpen) return null;

  const renderStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <span className="cd-badge cd-badge--success">
            <FiCheckCircle size={13} />
            <span>Accepted</span>
          </span>
        );
      case "partially_passed":
        return (
          <span className="cd-badge cd-badge--warning">
            <FiAlertCircle size={13} />
            <span>Partial</span>
          </span>
        );
      case "runtime_error":
        return (
          <span className="cd-badge cd-badge--danger">
            <FiAlertCircle size={13} />
            <span>Runtime Error</span>
          </span>
        );
      case "timeout":
        return (
          <span className="cd-badge cd-badge--danger">
            <FiClock size={13} />
            <span>Timeout</span>
          </span>
        );
      case "failed":
      default:
        return (
          <span className="cd-badge cd-badge--danger">
            <FiXCircle size={13} />
            <span>Failed</span>
          </span>
        );
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="cd-submissions-drawer-overlay" onClick={onClose}>
      <div
        className="cd-submissions-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Submission History"
      >
        {/* Drawer Header */}
        <div className="cd-submissions-drawer__header">
          <div className="cd-submissions-drawer__title-row">
            {selectedSubmission ? (
              <button
                onClick={() => setSelectedSubmission(null)}
                className="cd-btn cd-btn--ghost cd-btn--sm"
                title="Back to submissions list"
              >
                <FiArrowLeft size={16} />
                <span>All Submissions</span>
              </button>
            ) : (
              <div className="cd-submissions-drawer__heading">
                <FiClock size={18} className="cd-icon-cyan" />
                <h3>Submission History</h3>
                <span className="cd-submissions-count-badge">
                  {submissions.length}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="cd-btn cd-btn--icon cd-btn--sm"
              title="Close history"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="cd-submissions-drawer__body">
          {isLoading && (
            <div className="cd-submissions-loading">
              <div className="cd-spinner" />
              <p>Loading submission history...</p>
            </div>
          )}

          {error && (
            <div className="cd-submissions-error">
              <FiAlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && submissions.length === 0 && (
            <div className="cd-submissions-empty">
              <FiCode size={40} className="cd-submissions-empty__icon" />
              <h4>No Submissions Yet</h4>
              <p>
                Click <strong>Submit</strong> in the workspace to evaluate your code and create a verifiable submission record.
              </p>
            </div>
          )}

          {/* Submissions List */}
          {!isLoading && !selectedSubmission && submissions.length > 0 && (
            <div className="cd-submissions-list">
              {submissions.map((sub, idx) => (
                <div
                  key={sub._id || sub.id || idx}
                  className="cd-submission-item"
                  onClick={() => handleSelectSubmission(sub)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectSubmission(sub)}
                >
                  <div className="cd-submission-item__top">
                    {renderStatusBadge(sub.status)}
                    <span className="cd-submission-item__time">
                      {formatTimestamp(sub.submittedAt)}
                    </span>
                  </div>
                  <div className="cd-submission-item__meta">
                    <span className="cd-submission-item__tests">
                      {sub.testsPassed} / {sub.testsTotal} tests passed
                    </span>
                    {sub.runtimeMs > 0 && (
                      <span className="cd-submission-item__runtime">
                        <FiClock size={12} /> {sub.runtimeMs}ms
                      </span>
                    )}
                    <span className="cd-submission-item__lang">
                      {sub.language?.toUpperCase() || "CODE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submission Details View */}
          {!isLoading && selectedSubmission && (
            <div className="cd-submission-detail">
              {isLoadingDetail ? (
                <div className="cd-submissions-loading">
                  <div className="cd-spinner" />
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="cd-submission-detail__summary">
                    <div className="cd-submission-detail__header">
                      {renderStatusBadge(selectedSubmission.status)}
                      <span className="cd-submission-detail__time">
                        {formatTimestamp(selectedSubmission.submittedAt)}
                      </span>
                    </div>

                    <div className="cd-submission-detail__stats">
                      <div className="cd-stat-card">
                        <span className="cd-stat-card__label">Tests</span>
                        <span className="cd-stat-card__value">
                          {selectedSubmission.testsPassed} / {selectedSubmission.testsTotal}
                        </span>
                      </div>
                      <div className="cd-stat-card">
                        <span className="cd-stat-card__label">Runtime</span>
                        <span className="cd-stat-card__value">
                          {selectedSubmission.runtimeMs || 0}ms
                        </span>
                      </div>
                      <div className="cd-stat-card">
                        <span className="cd-stat-card__label">Language</span>
                        <span className="cd-stat-card__value">
                          {selectedSubmission.language?.toUpperCase() || "CODE"}
                        </span>
                      </div>
                    </div>

                    {/* Test Results Breakdown */}
                    {selectedSubmission.validationSummary &&
                      selectedSubmission.validationSummary.length > 0 && (
                        <div className="cd-submission-detail__tests">
                          <h4 className="cd-section-title">Validation Details</h4>
                          <div className="cd-validation-list">
                            {selectedSubmission.validationSummary.map((t, tIdx) => (
                              <div
                                key={tIdx}
                                className={`cd-validation-item ${
                                  t.passed ? "cd-validation-item--pass" : "cd-validation-item--fail"
                                }`}
                              >
                                {t.passed ? (
                                  <FiCheckCircle size={14} className="cd-icon-green" />
                                ) : (
                                  <FiXCircle size={14} className="cd-icon-red" />
                                )}
                                <div className="cd-validation-item__content">
                                  <span className="cd-validation-item__desc">
                                    {t.description}
                                  </span>
                                  {t.message && (
                                    <span className="cd-validation-item__msg">
                                      {t.message}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Code Snapshot */}
                    <div className="cd-submission-detail__code-section">
                      <div className="cd-submission-detail__code-header">
                        <span className="cd-section-title">Code Snapshot</span>
                        <button
                          onClick={() => handleCopyCode(selectedSubmission.codeSnapshot)}
                          className="cd-btn cd-btn--ghost cd-btn--xs"
                          title="Copy snapshot"
                        >
                          <FiCopy size={13} />
                          <span>{copySuccess ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="cd-submission-code-box">
                        <code>{selectedSubmission.codeSnapshot}</code>
                      </pre>
                    </div>

                    {/* Action: Load into Editor */}
                    <div className="cd-submission-detail__actions">
                      <button
                        onClick={() => setConfirmLoadSnapshot(true)}
                        className="cd-btn cd-btn--primary cd-btn--block"
                      >
                        <FiDownload size={15} />
                        <span>Load Snapshot into Editor</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal for Overwriting Editor */}
        {confirmLoadSnapshot && (
          <div className="cd-confirm-dialog-overlay" onClick={() => setConfirmLoadSnapshot(false)}>
            <div
              className="cd-confirm-dialog"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <div className="cd-confirm-dialog__header">
                <FiAlertTriangle size={20} className="cd-icon-amber" />
                <h4>Overwrite Current Editor Code?</h4>
              </div>
              <p className="cd-confirm-dialog__message">
                Loading this submission snapshot will replace whatever code is currently in your editor.
                Unsaved changes will be lost.
              </p>
              <div className="cd-confirm-dialog__footer">
                <button
                  onClick={() => setConfirmLoadSnapshot(false)}
                  className="cd-btn cd-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyToEditor}
                  className="cd-btn cd-btn--danger"
                >
                  Replace Editor Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

