import React, { useState, useEffect } from "react";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiCode,
  FiHelpCircle,
  FiCheckCircle,
  FiLock,
  FiInfo,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";
import { learnApi } from "../../../services/apiService";
import CodingValidationRuleBuilder from "./CodingValidationRuleBuilder";

const LESSON_TYPES = [
  { value: "coding", label: "Interactive Coding Exercise" },
  { value: "practice", label: "Practice Challenge" },
  { value: "project", label: "Project / Capstone" },
  { value: "quiz", label: "Quiz Assessment" },
  { value: "text", label: "Text / Reading" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "mixed", label: "Mixed Media" },
];

const BLOCK_TYPES = [
  { value: "explanation", label: "Concept / Explanation" },
  { value: "example", label: "Worked Example" },
  { value: "starter_code", label: "Starter Code & Sandbox" },
  { value: "instructions", label: "Task Instructions" },
  { value: "project_task", label: "Project Task Specification" },
];

const COMPLETION_MODES = [
  { value: "manual", label: "Manual (Learner Click / Auto-Gate)" },
  { value: "consume", label: "Consume (Read/Watch 90% Duration)" },
  { value: "resource", label: "Resource Interaction" },
];

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
  },
  section: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
  },
  sectionHeader: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  input: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    boxSizing: "border-box",
  },
  codeTextarea: {
    width: "100%",
    background: "#090d16",
    border: "1px solid #334155",
    color: "#38bdf8",
    padding: "0.75rem",
    borderRadius: "6px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    boxSizing: "border-box",
    resize: "vertical",
  },
  solutionTextarea: {
    width: "100%",
    background: "#0a1a14",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#34d399",
    padding: "0.75rem",
    borderRadius: "6px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.85rem",
    lineHeight: 1.5,
    boxSizing: "border-box",
    resize: "vertical",
  },
  label: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.35rem",
  },
  helperText: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "0.25rem",
  },
  btnPrimary: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "0.45rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  btnSecondary: {
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  btnDanger: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#f87171",
    padding: "0.35rem 0.65rem",
    borderRadius: "4px",
    fontSize: "0.78rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  blockCard: {
    background: "#131d33",
    border: "1px solid #24344d",
    borderRadius: "6px",
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  notice: {
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.25)",
    borderRadius: "6px",
    padding: "0.6rem 0.85rem",
    fontSize: "0.8rem",
    color: "#38bdf8",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.75rem",
  },
};

export default function CodingLessonsTab({ lesson, onBack, onSaved }) {
  const [formData, setFormData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Sync incoming lesson into mutable form state
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        body: lesson.body || "",
        lessonType: lesson.lessonType || "coding",
        isPreview: Boolean(lesson.isPreview),
        durationSeconds: lesson.durationSeconds || 300,
        completionMode: lesson.completionMode || "manual",
        codingBlocks: (lesson.codingBlocks || []).map((b) => ({
          id: b.id || b._id,
          blockType: b.blockType || "explanation",
          title: b.title || "",
          content: b.content || "",
          language: b.language || "javascript",
          instructions: b.instructions || "",
          starterCode: b.starterCode || "",
          expectedOutput: b.expectedOutput || "",
          previewFixture: b.previewFixture || "",
          hints: Array.isArray(b.hints) ? [...b.hints] : [],
          validationRules: Array.isArray(b.validationRules)
            ? b.validationRules
            : (typeof b.validationRules === "string" ? (() => { try { return JSON.parse(b.validationRules); } catch(e) { return []; } })() : []),
          solutionCode: b.solutionCode || "",
        })),
        quizQuestions: (lesson.quizQuestions || []).map((q) => ({
          id: q.id || q._id,
          question: q.question || "",
          options: (q.options || []).map((o) => ({ text: o.text || "" })),
          correctOptionIndex: Number(q.correctOptionIndex ?? 0),
          explanation: q.explanation || "",
        })),
      });
    }
  }, [lesson]);

  if (!lesson || !formData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        <p>No lesson selected for authoring.</p>
        <button type="button" onClick={onBack} style={S.btnSecondary}>
          <FiArrowLeft /> Return to Curriculum
        </button>
      </div>
    );
  }

  // Save handler
  const handleSave = async () => {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const serializedBlocks = formData.codingBlocks.map((block) => ({
        id: block.id,
        blockType: block.blockType,
        title: block.title,
        content: block.content || "",
        language: block.language,
        instructions: block.instructions,
        starterCode: block.starterCode,
        expectedOutput: block.expectedOutput,
        previewFixture: block.previewFixture,
        hints: (block.hints || []).filter((h) => h.trim().length > 0),
        validationRules: Array.isArray(block.validationRules) && block.validationRules.length > 0 ? block.validationRules : null,
        solutionCode: block.solutionCode,
      }));

      const payload = {
        title: formData.title,
        description: formData.description,
        body: formData.body,
        lessonType: formData.lessonType,
        isPreview: formData.isPreview,
        durationSeconds: Number(formData.durationSeconds) || 0,
        completionMode: formData.completionMode,
        codingBlocks: serializedBlocks,
        quizQuestions: formData.quizQuestions.map((q) => ({
          question: q.question,
          options: q.options.filter((o) => o.text.trim().length > 0),
          correctOptionIndex: Number(q.correctOptionIndex) || 0,
          explanation: q.explanation,
        })),
      };

      await learnApi.adminCodingUpdateLesson(lesson._id || lesson.id, payload);
      setMessage("Lesson authored and saved successfully.");
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || "Failed to save lesson.");
    } finally {
      setBusy(false);
    }
  };

  // Block management
  const addBlock = () => {
    setFormData((prev) => ({
      ...prev,
      codingBlocks: [
        ...prev.codingBlocks,
        {
          id: `block-${Date.now()}`,
          blockType: "starter_code",
          title: "Exercise Challenge",
          content: "",
          language: "javascript",
          instructions: "",
          starterCode: "// Write your code here\n",
          expectedOutput: "",
          previewFixture: "",
          hints: [],
          validationRules: [],
          solutionCode: "",
        },
      ],
    }));
  };

  const removeBlock = (index) => {
    if (!window.confirm("Delete this coding block?")) return;
    setFormData((prev) => {
      const next = [...prev.codingBlocks];
      next.splice(index, 1);
      return { ...prev, codingBlocks: next };
    });
  };

  const updateBlock = (index, updates) => {
    setFormData((prev) => {
      const next = [...prev.codingBlocks];
      next[index] = { ...next[index], ...updates };
      return { ...prev, codingBlocks: next };
    });
  };

  // Hint management within a block
  const addHint = (bIdx) => {
    const block = formData.codingBlocks[bIdx];
    updateBlock(bIdx, { hints: [...block.hints, ""] });
  };

  const updateHint = (bIdx, hIdx, text) => {
    const block = formData.codingBlocks[bIdx];
    const nextHints = [...block.hints];
    nextHints[hIdx] = text;
    updateBlock(bIdx, { hints: nextHints });
  };

  const removeHint = (bIdx, hIdx) => {
    const block = formData.codingBlocks[bIdx];
    const nextHints = [...block.hints];
    nextHints.splice(hIdx, 1);
    updateBlock(bIdx, { hints: nextHints });
  };

  // Quiz management
  const addQuizQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: [
        ...prev.quizQuestions,
        {
          id: `quiz-${Date.now()}`,
          question: "",
          options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
          correctOptionIndex: 0,
          explanation: "",
        },
      ],
    }));
  };

  const removeQuizQuestion = (qIdx) => {
    if (!window.confirm("Delete this quiz question?")) return;
    setFormData((prev) => {
      const next = [...prev.quizQuestions];
      next.splice(qIdx, 1);
      return { ...prev, quizQuestions: next };
    });
  };

  const updateQuizQuestion = (qIdx, updates) => {
    setFormData((prev) => {
      const next = [...prev.quizQuestions];
      next[qIdx] = { ...next[qIdx], ...updates };
      return { ...prev, quizQuestions: next };
    });
  };

  const updateQuizOption = (qIdx, optIdx, text) => {
    const question = formData.quizQuestions[qIdx];
    const nextOpts = [...question.options];
    nextOpts[optIdx] = { ...nextOpts[optIdx], text };
    updateQuizQuestion(qIdx, { options: nextOpts });
  };

  return (
    <div style={S.container}>
      {/* Top Header & Save Bar */}
      <div style={S.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="button" onClick={onBack} style={S.btnSecondary}>
            <FiArrowLeft /> Back to Modules
          </button>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#38bdf8", fontWeight: 700 }}>
              Lesson Authoring ({formData.lessonType})
            </span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: "0.15rem 0 0" }}>
              {formData.title || "Untitled Lesson"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          style={S.btnPrimary}
        >
          <FiSave /> {busy ? "Saving…" : "Save Lesson"}
        </button>
      </div>

      {message && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "6px" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      {/* 1. Metadata Section */}
      <div style={S.section}>
        <h3 style={S.sectionHeader}><FiFileText /> 1. Lesson Metadata</h3>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={S.label}>Lesson Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Lesson Type</label>
            <select
              value={formData.lessonType}
              onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
              style={S.input}
            >
              {LESSON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={S.label}>Estimated Seconds</label>
            <input
              type="number"
              min="0"
              value={formData.durationSeconds}
              onChange={(e) => setFormData({ ...formData, durationSeconds: Number(e.target.value) })}
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Completion Criteria</label>
            <select
              value={formData.completionMode}
              onChange={(e) => setFormData({ ...formData, completionMode: e.target.value })}
              style={S.input}
            >
              {COMPLETION_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", paddingTop: "1.2rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1", fontSize: "0.85rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.isPreview}
                onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
              />
              Free Public Preview
            </label>
          </div>
        </div>

        <div>
          <label style={S.label}>Brief Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="One-line summary shown in curriculum navigation..."
            style={S.input}
          />
        </div>
      </div>

      {/* 2. Concept / Lesson Body (Markdown) */}
      <div style={S.section}>
        <h3 style={S.sectionHeader}><FiBookOpenIcon /> 2. Concept Explanation (Concept Tab)</h3>
        <p style={S.helperText}>
          Markdown content rendered in the learner&apos;s &quot;Concept&quot; tab. Explain core theory, formulas, syntax diagrams, or worked examples.
        </p>
        <textarea
          rows={10}
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="## Concept Overview&#10;&#10;Write detailed lesson theory here in Markdown..."
          style={{ ...S.input, fontFamily: "inherit", resize: "vertical", marginTop: "0.5rem" }}
        />
      </div>

      {/* 3. Interactive Coding Blocks */}
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ ...S.sectionHeader, margin: 0 }}><FiCode /> 3. Interactive Coding Blocks ({formData.codingBlocks.length})</h3>
            <p style={S.helperText}>
              Configure starter code, instructions, expected outputs, hints, test validation, and official solutions.
            </p>
          </div>
          <button type="button" onClick={addBlock} style={S.btnPrimary}>
            <FiPlus /> Add Block
          </button>
        </div>

        {formData.codingBlocks.map((block, bIdx) => (
          <div key={block.id || bIdx} style={S.blockCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", flex: 1, alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#38bdf8" }}>
                  Block {bIdx + 1}
                </span>
                <input
                  type="text"
                  placeholder="Block Title (e.g. Exercise Challenge)"
                  value={block.title}
                  onChange={(e) => updateBlock(bIdx, { title: e.target.value })}
                  style={{ ...S.input, width: "240px", padding: "0.35rem 0.6rem" }}
                />
                <select
                  value={block.blockType}
                  onChange={(e) => updateBlock(bIdx, { blockType: e.target.value })}
                  style={{ ...S.input, width: "180px", padding: "0.35rem 0.6rem" }}
                >
                  {BLOCK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <select
                  value={block.language}
                  onChange={(e) => updateBlock(bIdx, { language: e.target.value })}
                  style={{ ...S.input, width: "140px", padding: "0.35rem 0.6rem" }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="python">Python</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => removeBlock(bIdx)}
                style={S.btnDanger}
                title="Remove coding block"
              >
                <FiTrash2 /> Remove Block
              </button>
            </div>

            {/* Task Instructions */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={S.label}>Challenge Instructions (Challenge Tab)</label>
              <textarea
                rows={3}
                placeholder="Give learners clear, step-by-step instructions for what code to write..."
                value={block.instructions}
                onChange={(e) => updateBlock(bIdx, { instructions: e.target.value })}
                style={{ ...S.input, resize: "vertical" }}
              />
            </div>

            {/* Worked Example / Notes */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={S.label}>Worked Example / Explanatory Notes (Example Tab)</label>
              <textarea
                rows={3}
                placeholder="Optional worked example walkthrough, explanations, or syntax notes..."
                value={block.content || ""}
                onChange={(e) => updateBlock(bIdx, { content: e.target.value })}
                style={{ ...S.input, resize: "vertical" }}
              />
            </div>

            {/* Starter Code */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={S.label}>Starter Code (Initial Editor Buffer)</label>
              <textarea
                rows={6}
                value={block.starterCode}
                onChange={(e) => updateBlock(bIdx, { starterCode: e.target.value })}
                style={S.codeTextarea}
                placeholder="// Starter template code for the learner..."
              />
            </div>

            {/* Expected Output */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={S.label}>Expected Output / Spec (Displayed to Learner)</label>
              <input
                type="text"
                placeholder="e.g. 42 or Hello World!"
                value={block.expectedOutput}
                onChange={(e) => updateBlock(bIdx, { expectedOutput: e.target.value })}
                style={S.input}
              />
            </div>

            {/* Preview Fixture */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={S.label}>Preview Fixture (HTML Sandbox / Mock Context)</label>
              <textarea
                rows={3}
                placeholder="Optional HTML fixture wrapper or initial DOM template..."
                value={block.previewFixture}
                onChange={(e) => updateBlock(bIdx, { previewFixture: e.target.value })}
                style={S.codeTextarea}
              />
            </div>

            {/* Official Solution Code */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={S.notice}>
                <FiLock /> Official Solution Code is <strong>server-protected (select: false)</strong> and only revealed to learners when explicitly requested.
              </div>
              <label style={S.label}>Official Solution Code</label>
              <textarea
                rows={6}
                value={block.solutionCode}
                onChange={(e) => updateBlock(bIdx, { solutionCode: e.target.value })}
                style={S.solutionTextarea}
                placeholder="// Working canonical solution..."
              />
            </div>

            {/* Hints Section */}
            <div style={{ marginBottom: "1rem", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ ...S.label, margin: 0 }}>Progressive Hints ({block.hints.length})</label>
                <button
                  type="button"
                  onClick={() => addHint(bIdx)}
                  style={{ ...S.btnSecondary, padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                >
                  <FiPlus /> Add Hint
                </button>
              </div>
              {block.hints.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.3rem 0" }}>No hints configured yet.</p>
              ) : (
                block.hints.map((hintText, hIdx) => (
                  <div key={hIdx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "1.2rem" }}>#{hIdx + 1}</span>
                    <input
                      type="text"
                      value={hintText}
                      onChange={(e) => updateHint(bIdx, hIdx, e.target.value)}
                      placeholder={`Hint ${hIdx + 1}...`}
                      style={{ ...S.input, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeHint(bIdx, hIdx)}
                      style={{ ...S.iconBtn, color: "#f87171", padding: "0.35rem 0.5rem" }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Validation Rules Builder (Admin-Friendly Structured Component) */}
            <div>
              <CodingValidationRuleBuilder
                rules={block.validationRules || []}
                onChange={(newRules) => updateBlock(bIdx, { validationRules: newRules })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Quiz Questions Builder */}
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ ...S.sectionHeader, margin: 0 }}><FiHelpCircle /> 4. Lesson Quiz Questions ({formData.quizQuestions.length})</h3>
            <p style={S.helperText}>
              Add multiple choice assessment questions. Correct option indices are server-protected and graded via server endpoint.
            </p>
          </div>
          <button type="button" onClick={addQuizQuestion} style={S.btnPrimary}>
            <FiPlus /> Add Question
          </button>
        </div>

        {formData.quizQuestions.map((quiz, qIdx) => (
          <div key={quiz.id || qIdx} style={{ ...S.blockCard, background: "#111827" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c084fc" }}>
                Question {qIdx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeQuizQuestion(qIdx)}
                style={S.btnDanger}
              >
                <FiTrash2 /> Remove Question
              </button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={S.label}>Question Prompt *</label>
              <input
                type="text"
                value={quiz.question}
                onChange={(e) => updateQuizQuestion(qIdx, { question: e.target.value })}
                placeholder="e.g. Which keyword declares a block-scoped variable?"
                style={S.input}
              />
            </div>

            {/* Options */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={S.label}>Answer Options (Select the correct radio option):</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {quiz.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name={`quiz-${qIdx}-correct`}
                      checked={quiz.correctOptionIndex === optIdx}
                      onChange={() => updateQuizQuestion(qIdx, { correctOptionIndex: optIdx })}
                      style={{ cursor: "pointer" }}
                      title="Set as correct answer"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateQuizOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      style={{ ...S.input, flex: 1 }}
                    />
                    {quiz.correctOptionIndex === optIdx && (
                      <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>
                        CORRECT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Answer Explanation (Shown After Submission)</label>
              <textarea
                rows={2}
                value={quiz.explanation}
                onChange={(e) => updateQuizQuestion(qIdx, { explanation: e.target.value })}
                placeholder="Explain why this answer is correct..."
                style={{ ...S.input, resize: "vertical" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FiBookOpenIcon() {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}
